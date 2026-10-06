import { Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { EntityEffect } from '@cartesianui/platform-common';
import { Permission } from '../../models';
import { PermissionActions } from './actions';
import { PermissionHttpService } from '../../shared/permission/http.service';

@Injectable()
export class PermissionEffects extends EntityEffect<Permission> {
  constructor(actions$: Actions, httpService: PermissionHttpService) {
    super(httpService, PermissionActions);
  }
}
