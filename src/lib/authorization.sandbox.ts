import { inject, Injectable } from '@angular/core';
import { Sandbox, EntitySandbox } from '@cartesianui/platform-common';
import { Store } from '@ngrx/store';
import { Role, RolePermissions, Permission } from './models';
import { RoleActions, fromRole } from './store/role';
import { PermissionActions, fromPermission } from './store/permission';

@Injectable({ providedIn: 'root' })
export class AuthorizationSandbox extends Sandbox {
  private store = inject(Store);

  role = new EntitySandbox<Role>(this.store, this.injector, {
    selectors: fromRole,
    actions: RoleActions,
    model: Role
  });

  permission = new EntitySandbox<Permission>(this.store, this.injector, {
    selectors: fromPermission,
    actions: PermissionActions,
    model: Permission
  });

  syncPermissions(id: string, form: RolePermissions): void {
    this.store.dispatch(RoleActions.syncPermissions({ id, form }));
  }

  attachPermissions(id: string, form: RolePermissions): void {
    this.store.dispatch(RoleActions.attachPermissions({ id, form }));
  }

  detachPermissions(id: string, form: RolePermissions): void {
    this.store.dispatch(RoleActions.detachPermissions({ id, form }));
  }
}
