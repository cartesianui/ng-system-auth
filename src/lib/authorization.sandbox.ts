import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Sandbox, EntitySandbox } from '@cartesianui/platform-common';
import { Store, select } from '@ngrx/store';
import { Observable, map } from 'rxjs';
import { RequestCriteria } from '@cartesianui/platform-core';
import { Role, RoleCloneSkip, RolePermissions, Permission } from './models';
import { PermissionHttpService } from './shared/permission/http.service';
import { RoleActions, fromRole } from './store/role';
import { PermissionActions, fromPermission } from './store/permission';

@Injectable({ providedIn: 'root' })
export class AuthorizationSandbox extends Sandbox {
  private store = inject(Store);
  private permissionHttpService = inject(PermissionHttpService);

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

  changePermissions(id: string, give: RolePermissions, revoke: RolePermissions): void {
    this.store.dispatch(RoleActions.changePermissions({ id, give, revoke }));
  }

  /** Clone `sourceId` into the new role `form` (see `RoleEffects.clone$`). The source is only read. */
  clone(sourceId: string, form: Role): void {
    this.store.dispatch(RoleActions.clone({ sourceId, form }));
  }

  clearCloneState(): void {
    this.store.dispatch(RoleActions.clearClone());
  }

  cloneState$ = this.store.pipe(select(fromRole.cloneRequest));
  readonly cloneState = toSignal(this.cloneState$, { initialValue: undefined });

  /** What the last completed clone could not give the new role, with the server's reason. */
  cloneSkipped$ = this.store.pipe(select(fromRole.cloneSkipped));
  readonly cloneSkipped = toSignal(this.cloneSkipped$, { initialValue: [] as RoleCloneSkip[] });

  /**
   * The report-section permissions, `read:{section}-reports` (pa-api Shared/Report, ADR-005):
   * one per section the report registry holds, seeded from it. A one-shot read that must not
   * replace the permission list the attach picker shows, so it bypasses the store.
   *
   * The catalog cannot filter by name pattern (`name` is exact-match only), so it asks for display
   * names containing "Reports" and keeps the names of the exact shape.
   */
  reportSectionPermissions(): Observable<Permission[]> {
    const criteria = new RequestCriteria().where('displayName', 'like', 'Reports').limit(200);

    return this.permissionHttpService.getAll(criteria.httpParams()).pipe(
      map((response: { data?: unknown[] }) =>
        (response?.data ?? [])
          .map((row) => new Permission(row as Permission))
          .filter((permission) => REPORT_SECTION_PERMISSION.test(permission.name ?? ''))
      )
    );
  }
}

/** `read:{section}-reports`, the shape pa-api's `ReportPermission::forSection()` builds. */
export const REPORT_SECTION_PERMISSION = /^read:[a-z0-9-]+-reports$/;
