import { ChangeDetectionStrategy, Component, Signal, OnDestroy, effect, inject } from '@angular/core';
import { BaseComponent, RequestType } from '@cartesianui/platform-common';
import { FormControl, FormGroup } from '@angular/forms';
import { RequestCriteria } from '@cartesianui/platform-core';
import { AuthorizationSandbox } from '../../../authorization.sandbox';
import { Permission, Role, RolePermissions } from '../../../models';
import { FORM_IMPORTS } from '../../../authorization.imports';
import { PermissionsWidgetComponent } from '../../../widgets';

@Component({
    selector: 'auth-edit-role',
    templateUrl: './role.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
      ...FORM_IMPORTS,
      PermissionsWidgetComponent,
    ],
    standalone: true
})
export class RoleComponent extends BaseComponent implements OnDestroy {
  protected sb = inject(AuthorizationSandbox);

  readonly role: Signal<Role> = this.sb.role.selected;

  permissionsToAttach: Permission[] = [];
  permissionsToRevoke: Permission[] = [];
  permissionLookupOptions: Signal<Permission[]> = this.sb.permission.entities;

  permissionCriteria = new RequestCriteria().limit(500);

  formGroup: FormGroup = new FormGroup({
    name: new FormControl('', []),
    displayName: new FormControl('', []),
    description: new FormControl('', []),
  });

  private readonly selectEffect = effect(() => {
    const role = this.role();
    if (!role) return;
    this.formGroup.patchValue(role);
  });

  private readonly completeEffect = effect(() => {
    if (!this.sb.role.updateCompleted()) return;
    this.notify.success('Successfully Updated', 'Success');
    this.sb.role.clearRequestState(RequestType.Update);
  });

  constructor() {
    super();
    this.loadPermissions();
  }

  loadPermissions() {
    this.sb.permission.getAll(this.permissionCriteria.httpParams());
  }

  onSave() {
    if (this.formGroup.valid) {
      this.sb.role.update(this.role()?.id, new Role(this.formGroup.value));
    }
  }

  onRevoke() {
    const permissionIds = this.permissionsToRevoke.map((permission) => permission.id);
    const form = new RolePermissions({
      roleId: this.role()?.id,
      permissionIds
    });
    this.sb.detachPermissions(this.role()?.id, form);
    this.permissionsToRevoke = [];
  }

  onAttach() {
    const permissionIds = this.permissionsToAttach.map((permission) => permission.id);
    const form = new RolePermissions({
      roleId: this.role()?.id,
      permissionIds
    });
    this.sb.attachPermissions(this.role()?.id, form);
    this.permissionsToAttach = [];
  }
}
