import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponent } from '@cartesianui/platform-common';
import { AuthorizationSandbox, REPORT_SECTION_PERMISSION } from '../../../authorization.sandbox';
import { Permission, Role, RolePermissions } from '../../../models';

/** One report section: its permission and the label shown next to the checkbox. */
interface ReportSection {
  permission: Permission;
  label: string;
}

/** tenant-admin passes the report-section check by role and is re-synced by `permissions:sync`. */
const TENANT_ADMIN = 'tenant-admin';

/**
 * "Report access" card on the role edit page: one checkbox per report section, ticked when
 * the role holds `read:{section}-reports` (pa-api Shared/Report, ADR-005 level 2).
 *
 * Save gives what was ticked and revokes what was unticked, and nothing else, through the
 * give and revoke endpoints. Never the sync endpoint: it would replace every other
 * permission the role holds. Since 2026-11-08 `permissions:sync` keeps grants made here.
 */
@Component({
  selector: 'auth-role-report-access',
  templateUrl: './role-report-access.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  standalone: true
})
export class RoleReportAccessComponent extends BaseComponent {
  protected sb = inject(AuthorizationSandbox);

  readonly role = input<Role | null>(null);

  readonly sections = signal<ReportSection[]>([]);
  readonly loaded = signal(false);

  /** Permission ids ticked on screen. */
  readonly ticked = signal<ReadonlySet<string>>(new Set());

  /** Report-section permission ids the role holds now. */
  readonly held = computed<ReadonlySet<string>>(() => {
    const permissions: Permission[] = this.role()?.permissions?.data ?? [];
    return new Set(permissions.filter((p) => REPORT_SECTION_PERMISSION.test(p?.name ?? '')).map((p) => p.id));
  });

  readonly toGive = computed(() => [...this.ticked()].filter((id) => !this.held().has(id)));
  readonly toRevoke = computed(() =>
    this.sections()
      .map((section) => section.permission.id)
      .filter((id) => this.held().has(id) && !this.ticked().has(id))
  );
  readonly dirty = computed(() => this.toGive().length > 0 || this.toRevoke().length > 0);

  readonly isTenantAdmin = computed(() => this.role()?.name === TENANT_ADMIN);

  /** Reset the ticks to what the role holds whenever the role (or its saved state) changes. */
  private readonly resetEffect = effect(() => {
    this.ticked.set(new Set(this.held()));
  });

  constructor() {
    super();
    this.subscriptions.push(
      this.sb.reportSectionPermissions().subscribe({
        next: (permissions) => {
          this.sections.set(
            permissions
              .map((permission) => ({ permission, label: this.labelOf(permission) }))
              .sort((a, b) => a.label.localeCompare(b.label))
          );
          this.loaded.set(true);
        },
        error: () => this.loaded.set(true)
      })
    );
  }

  toggle(permissionId: string, checked: boolean): void {
    const next = new Set(this.ticked());
    if (checked) {
      next.add(permissionId);
    } else {
      next.delete(permissionId);
    }
    this.ticked.set(next);
  }

  save(): void {
    const roleId = this.role()?.id;
    if (!roleId || !this.dirty()) return;

    this.sb.changePermissions(
      roleId,
      new RolePermissions({ roleId, permissionIds: this.toGive() }),
      new RolePermissions({ roleId, permissionIds: this.toRevoke() })
    );
  }

  /** "Read Sales Reports" → "Sales Reports"; the permission name if there is no display name. */
  private labelOf(permission: Permission): string {
    const displayName = (permission.displayName ?? '').trim();
    return displayName ? displayName.replace(/^Read\s+/i, '') : permission.name;
  }
}
