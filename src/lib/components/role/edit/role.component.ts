import { ChangeDetectionStrategy, Component, Signal, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { BaseComponent, RequestType } from '@cartesianui/platform-common';
import { FormControl, FormGroup } from '@angular/forms';
import { RequestCriteria } from '@cartesianui/platform-core';
import { AuthorizationSandbox } from '../../../authorization.sandbox';
import { Permission, Role, RoleCloneSkip, RolePermissions } from '../../../models';
import { FORM_IMPORTS } from '../../../authorization.imports';
import { RoleReportAccessComponent } from '../report-access/role-report-access.component';
import { CloneRoleComponent, RoleCloned } from '../clone/clone-role.component';

/** The role's permissions on one resource: `read:role` and `update:role` both sit under `role`. */
interface PermissionGroup {
  resource: string;
  permissions: { permission: Permission; action: string }[];
}

/** Permissions without an `action:resource` name. */
const OTHER_GROUP = 'other';

@Component({
    selector: 'auth-edit-role',
    templateUrl: './role.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
      ...FORM_IMPORTS,
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

  /** Text typed in the Current Permissions filter box. */
  protected readonly permissionFilter = signal('');

  /** The role's permissions grouped by resource, both sorted by name, narrowed by the filter. */
  protected readonly permissionGroups = computed<PermissionGroup[]>(() => {
    const filter = this.permissionFilter().trim().toLowerCase();
    const permissions: Permission[] = this.role()?.permissions?.data ?? [];
    const groups = new Map<string, PermissionGroup>();

    for (const permission of permissions) {
      const name = permission?.name ?? '';
      const text = `${name} ${permission?.displayName ?? ''} ${permission?.description ?? ''}`.toLowerCase();
      if (filter && !text.includes(filter)) continue;

      const separator = name.indexOf(':');
      const resource = separator > 0 ? name.slice(separator + 1) : OTHER_GROUP;
      const action = separator > 0 ? name.slice(0, separator) : name;
      if (!groups.has(resource)) groups.set(resource, { resource, permissions: [] });
      groups.get(resource).permissions.push({ permission, action });
    }

    return [...groups.values()]
      .sort((a, b) => a.resource.localeCompare(b.resource))
      .map((group) => ({ ...group, permissions: group.permissions.sort((a, b) => a.action.localeCompare(b.action)) }));
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

  protected isMarkedForRevoke(permission: Permission): boolean {
    return this.permissionsToRevoke.some((marked) => marked.id === permission.id);
  }

  /** Ticks or unticks one permission for Revoke; the list Revoke sends, as the table's checkboxes did. */
  protected markForRevoke(permission: Permission, marked: boolean) {
    const others = this.permissionsToRevoke.filter((p) => p.id !== permission.id);
    this.permissionsToRevoke = marked ? [...others, permission] : others;
  }

  protected isGroupMarkedForRevoke(group: PermissionGroup): boolean {
    return group.permissions.every(({ permission }) => this.isMarkedForRevoke(permission));
  }

  protected markGroupForRevoke(group: PermissionGroup, marked: boolean) {
    group.permissions.forEach(({ permission }) => this.markForRevoke(permission, marked));
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
