import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Observable, EMPTY, asyncScheduler, concat, defer, last, observeOn, of, switchMap, map, catchError, reduce } from 'rxjs';
import { EntityEffect } from '@cartesianui/platform-common';
import { ICartesianResponse } from '@cartesianui/platform-core';
import { RoleActions } from './actions';
import { IPermission, Role, RoleCloneSkip, RolePermissions } from '../../models';
import { RoleHttpService, IRoleHttpServiceExtension } from '../../shared/role/http.service';

@Injectable()
export class RoleEffects extends EntityEffect<Role, IRoleHttpServiceExtension> {
  constructor(actions$: Actions, httpService: RoleHttpService) {
    super(httpService, RoleActions);
  }

  syncPermissions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RoleActions.syncPermissions),
      switchMap(({ id, form }) =>
        this.httpService.syncPermissions(id, form).pipe(
          map(({ data }: ICartesianResponse) => RoleActions.updateSuccess({ entity: data })),
          catchError(({ errors, message }: ICartesianResponse) => of(RoleActions.updateFailure({ errors, message })))
        )
      )
    )
  );

  attachPermissions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RoleActions.attachPermissions),
      switchMap(({ id, form }) =>
        this.httpService.attachPermission(id, form).pipe(
          map(({ data }: ICartesianResponse) => RoleActions.updateSuccess({ entity: data })),
          catchError(({ errors, message }: ICartesianResponse) => of(RoleActions.updateFailure({ errors, message })))
        )
      )
    )
  );

  detachPermissions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RoleActions.detachPermissions),
      switchMap(({ id, form }) =>
        this.httpService.detachPermission(id, form).pipe(
          map(({ data }: ICartesianResponse) => RoleActions.updateSuccess({ entity: data })),
          catchError(({ errors, message }: ICartesianResponse) => of(RoleActions.updateFailure({ errors, message })))
        )
      )
    )
  );

  /**
   * Give, then revoke, one after the other, so the role in the last response
   * carries both changes. Either list may be empty. Uses the give and revoke
   * endpoints only: a full sync would replace every other permission the role holds.
   */
  changePermissions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RoleActions.changePermissions),
      switchMap(({ id, give, revoke }) => {
        const calls: Observable<ICartesianResponse>[] = [];
        if (give.permissionIds?.length) calls.push(defer(() => this.httpService.attachPermission(id, give)));
        if (revoke.permissionIds?.length) calls.push(defer(() => this.httpService.detachPermission(id, revoke)));
        if (!calls.length) return EMPTY;

        return concat(...calls).pipe(
          last(),
          map(({ data }: ICartesianResponse) => RoleActions.updateSuccess({ entity: data })),
          catchError(({ errors, message }: ICartesianResponse) => of(RoleActions.updateFailure({ errors, message })))
        );
      }),
      observeOn(asyncScheduler)
    )
  );

  /**
   * Clone a role: read the source's permissions, create the new role, give it those permissions,
   * then read the new role back. Uses the existing endpoints only and never writes to the source.
   *
   * The source is read FIRST, so a failed read, like a refused create (name taken or invalid),
   * leaves nothing behind. Once the role exists it is kept: a permission the server will not give
   * it is reported in `skipped`, never a reason to undo the role.
   */
  clone$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RoleActions.clone),
      switchMap(({ sourceId, form }) =>
        this.httpService.getById(sourceId, 'permissions').pipe(
          map(({ data }: ICartesianResponse) => permissionsOf(data)),
          switchMap((permissions) =>
            this.httpService.create(form).pipe(
              switchMap(({ data: created }: ICartesianResponse) =>
                this.givePermissions(created.id, permissions).pipe(
                  switchMap((skipped) =>
                    this.httpService.getById(created.id, 'permissions').pipe(
                      map(({ data }: ICartesianResponse) => data),
                      // The role and its grants are saved; a failed re-read must not report the clone as failed.
                      catchError(() => of(created)),
                      map((entity: Role) => RoleActions.cloneSuccess({ entity, skipped }))
                    )
                  )
                )
              )
            )
          ),
          catchError((error) => of(RoleActions.cloneFailure({ message: errorMessage(error), errors: error?.error?.errors })))
        )
      ),
      observeOn(asyncScheduler)
    )
  );

  /**
   * Give `permissions` to the role and return the ones the server refused, each with its reason.
   * Never errors.
   *
   * `POST /roles/{id}/permissions` refuses the WHOLE request when any one permission is not
   * grantable: `GivePermissionsToRoleAction` runs the host-only guard
   * (`AssertRolePermissionGrantAllowedTask`, 403) over the full id list before granting anything.
   * So one call for everything, the usual case, and on a refusal:
   *  - the host-only 403 names what it refused (`Host-only permission(s) [a, b] ...`): those are
   *    set aside and the rest is given again;
   *  - any other 403 or 422, or a message that names nothing in the request, splits the request
   *    in half and gives each half, down to single permissions;
   *  - any other status (a lost session, a server error) reports every permission in the request.
   * Each refused call shows the app's error toast, so the split only runs when the message does
   * not already say which permissions were the problem.
   */
  private givePermissions(roleId: string, permissions: IPermission[]): Observable<RoleCloneSkip[]> {
    if (!permissions.length) return of([]);

    const form = new RolePermissions({ roleId, permissionIds: permissions.map((permission) => permission.id) });

    return this.httpService.attachPermission(roleId, form).pipe(
      map((): RoleCloneSkip[] => []),
      catchError((error) => {
        const reason = errorMessage(error);
        // Only a 403 or 422 is about WHICH permissions were sent. Anything else (a lost session,
        // a server error) would fail every smaller request too, so report the lot and stop.
        const refusal = error?.status === 403 || error?.status === 422;
        if (permissions.length === 1 || !refusal) return of(permissions.map((permission) => skipOf(permission, reason)));

        const named = namedIn(reason, permissions);
        if (named.length) {
          const rest = permissions.filter((permission) => !named.includes(permission));
          return this.givePermissions(roleId, rest).pipe(map((skipped) => [...named.map((permission) => skipOf(permission, reason)), ...skipped]));
        }

        const half = Math.ceil(permissions.length / 2);
        return concat(this.givePermissions(roleId, permissions.slice(0, half)), this.givePermissions(roleId, permissions.slice(half))).pipe(
          reduce((all: RoleCloneSkip[], skipped: RoleCloneSkip[]) => [...all, ...skipped], [])
        );
      })
    );
  }
}

/** The permissions a role read with `?include=permissions` carries (a Fractal collection, `{ data: [] }`). */
function permissionsOf(role: any): IPermission[] {
  const rows = role?.permissions?.data ?? role?.permissions;
  return Array.isArray(rows) ? rows : [];
}

/** The server's sentence: the interceptor throws an `HttpErrorResponse` carrying the body in `.error`. */
function errorMessage(error: any): string {
  return error?.error?.message ?? error?.message ?? 'The request was refused.';
}

/** The permissions in `permissions` whose names a refusal lists in brackets, e.g. the host-only 403. */
function namedIn(reason: string, permissions: IPermission[]): IPermission[] {
  const list = /\[([^\]]+)\]/.exec(reason ?? '')?.[1];
  if (!list) return [];
  const names = list.split(',').map((name) => name.trim());
  return permissions.filter((permission) => names.includes(permission.name));
}

function skipOf(permission: IPermission, reason: string): RoleCloneSkip {
  return { id: permission.id, name: permission.name, displayName: permission.displayName, reason };
}
