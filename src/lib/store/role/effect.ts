import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, switchMap, map, catchError } from 'rxjs';
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
}
