import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Observable, EMPTY, asyncScheduler, concat, defer, last, observeOn, of, switchMap, map, catchError } from 'rxjs';
import { EntityEffect } from '@cartesianui/platform-common';
import { ICartesianResponse } from '@cartesianui/platform-core';
import { RoleActions } from './actions';
import { Role } from '../../models';
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
}
