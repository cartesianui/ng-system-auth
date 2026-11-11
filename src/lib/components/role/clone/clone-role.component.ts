import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, Output, effect, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ENTITY_CONSTRUCTOR, FormBaseComponent, requestDefault } from '@cartesianui/platform-common';
import { AuthorizationSandbox } from '../../../authorization.sandbox';
import { Role, RoleCloneSkip } from '../../../models';
import { FORM_IMPORTS } from '../../../authorization.imports';

/** What a finished clone hands back: the new role, and what it could not be given. */
export interface RoleCloned {
  role: Role;
  skipped: RoleCloneSkip[];
}

/**
 * Asks for the new role's name and clones `source` into it (`AuthorizationSandbox.clone`).
 *
 * The validators mirror pa-api's `CreateRoleRequest`: `name` is required, 2 to 20 characters,
 * letters only (`alpha`), unique in the tenant; `display_name` at most 100. Uniqueness is the
 * server's to answer; its refusal is shown here and nothing is created.
 */
@Component({
  selector: 'auth-clone-role',
  templateUrl: './clone-role.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...FORM_IMPORTS],
  providers: [
    {
      provide: ENTITY_CONSTRUCTOR,
      useValue: Role
    }
  ],
  standalone: true
})
export class CloneRoleComponent extends FormBaseComponent<Role> implements OnDestroy {
  protected sb = inject(AuthorizationSandbox);

  /** The role to copy. Only read. */
  readonly source = input.required<Role>();

  @Output() cloned = new EventEmitter<RoleCloned>();
  @Output() dismissed = new EventEmitter<void>();

  /** The server's reason the last attempt created nothing, with any field messages. */
  protected readonly failure = signal<{ message: string; details: string[] } | null>(null);

  override formGroup: FormGroup = new FormGroup({
    displayName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    name: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(20), Validators.pattern(/^[A-Za-z]+$/)]),
    description: new FormControl('', [])
  });

  private readonly prefillEffect = effect(() => {
    const source = this.source();
    if (!source) return;
    this.formGroup.reset({
      displayName: `${source.displayName || source.name} (copy)`,
      name: cloneName(source.name),
      description: source.description ?? ''
    });
  });

  private readonly busyEffect = effect(() => {
    this.handleFormBusyState(this.sb.cloneState() ?? requestDefault);
  });

  private readonly doneEffect = effect(() => {
    const state = this.sb.cloneState();
    if (state?.completed) {
      this.cloned.emit({ role: this.sb.role.selected(), skipped: this.sb.cloneSkipped() });
      this.sb.clearCloneState();
    } else if (state?.failed) {
      const body = state.body as { message?: string; errors?: Record<string, string[] | string> } | undefined;
      const details = Object.values(body?.errors ?? {}).flat().map(String);
      this.failure.set({ message: body?.message ?? 'The role could not be created.', details });
      this.sb.clearCloneState();
    }
  });

  constructor() {
    super(Role);
  }

  protected busy(): boolean {
    return !!this.sb.cloneState()?.started;
  }

  save(): void {
    if (this.formGroup.invalid || this.busy()) return;
    this.failure.set(null);
    this.sb.clone(this.source().id, this.getEntityFromForm());
  }

  dismiss(): void {
    this.dismissed.emit();
  }
}

/**
 * A `name` the create rule accepts: the source's letters plus "copy", within 20 characters.
 * `general-manager` becomes `generalmanagercopy`.
 */
function cloneName(name: string | undefined): string {
  const letters = (name ?? '').replace(/[^A-Za-z]/g, '').toLowerCase();
  return `${letters.slice(0, 16)}copy`;
}
