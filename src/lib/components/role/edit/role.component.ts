import { ChangeDetectionStrategy, Component, Signal, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { BaseComponent, RequestType } from '@cartesianui/platform-common';
import { FormControl, FormGroup } from '@angular/forms';
import { RequestCriteria } from '@cartesianui/platform-core';
import { AuthorizationSandbox } from '../../../authorization.sandbox';
import { Permission, Role, RoleCloneSkip, RolePermissions } from '../../../models';
import { FORM_IMPORTS } from '../../../authorization.imports';
import { PermissionsWidgetComponent } from '../../../widgets';
import { RoleReportAccessComponent } from '../report-access/role-report-access.component';
import { CloneRoleComponent, RoleCloned } from '../clone/clone-role.component';

@Component({
    selector: 'auth-edit-role',
    templateUrl: './role.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
      ...FORM_IMPORTS,
      PermissionsWidgetComponent,
      RoleReportAccessComponent,
      CloneRoleComponent,
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

  /** Same rule as the BE give/revoke gate (`PermissionPolicy::canEditRoleGrants`). */
  readonly canEditRoleGrants = this.permissionCheckerService.isAnyGranted(['manage:role', 'update:role']);

  /**
   * Clone needs what its two steps need: `create:role` for the new role (`RolePolicy::create`)
   * and the give gate above to copy the permissions onto it. Without the second the copy step
   * would be refused outright and leave an empty role behind.
   */
  readonly canCloneRole = this.permissionCheckerService.isGranted('create:role') && this.canEditRoleGrants;

  protected readonly cloneDialogOpen = signal(false);

  /**
   * The role being cloned, fixed when the dialog opens. Not `role()`: the clone selects the new
   * role, and the dialog and its result must still name the one it was copied from.
   */
  protected readonly cloneSource = signal<Role | null>(null);

  /** The last clone made from this screen, while its new role is the one shown. */
  private readonly lastClone = signal<{ roleId: string; sourceName: string; skipped: RoleCloneSkip[] } | null>(null);

  protected readonly cloneSkipped = computed(() => {
    const clone = this.lastClone();
    return clone && clone.roleId === this.role()?.id ? clone : null;
  });

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

  openCloneDialog() {
    // A clone that finished after its dialog was closed must not report itself into this one.
    if (!this.sb.cloneState()?.started) this.sb.clearCloneState();
    this.cloneSource.set(this.role());
    this.cloneDialogOpen.set(true);
  }

  /** The new role is now the selected one (the clone reducer selects it), so this screen shows it. */
  onCloned({ role, skipped }: RoleCloned) {
    const source = this.cloneSource();
    this.cloneDialogOpen.set(false);
    this.permissionsToAttach = [];
    this.permissionsToRevoke = [];
    const sourceName = source?.displayName || source?.name;
    this.lastClone.set({ roleId: role?.id, sourceName, skipped });

    if (skipped.length) {
      this.notify.warn(`Cloned from ${sourceName}. ${skipped.length} permission(s) could not be given to the new role.`, 'Role cloned');
    } else {
      this.notify.success(`Cloned from ${sourceName}.`, 'Role cloned');
    }
  }

  protected skippedDetails(skipped: RoleCloneSkip[]): string[] {
    return skipped.map((skip) => `${skip.displayName ? `${skip.displayName} (${skip.name})` : skip.name}: ${skip.reason}`);
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
