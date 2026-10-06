import { ChangeDetectionStrategy, Component, OnDestroy, effect, inject } from '@angular/core';
import { ENTITY_CONSTRUCTOR, FormBaseComponent, RequestType } from '@cartesianui/platform-common';
import { AuthorizationSandbox } from '../../../authorization.sandbox';
import { Role } from '../../../models';
import { FORM_IMPORTS } from '../../../authorization.imports';

@Component({
    selector: 'auth-create-role',
    templateUrl: './create-role.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
      ...FORM_IMPORTS
    ],
    providers: [
      {
        provide: ENTITY_CONSTRUCTOR,
        useValue: Role
      }
    ],
    standalone: true
})
export class RoleFormComponent extends FormBaseComponent<Role> implements OnDestroy {

  protected sb = inject(AuthorizationSandbox);

  private readonly busyEffect = effect(() => {
    this.handleFormBusyState(this.sb.role.createState());
  });

  private readonly completeEffect = effect(() => {
    if (!this.sb.role.createCompleted()) return;
    this.created.emit(true);
    this.notify.success('Successfully Created', 'Success');
    this.sb.role.clearRequestState(RequestType.Create);
  });

  constructor() {
    super(Role);
    this.initForm();
  }

  save() {
    if (!this.formGroup.valid) return;
    const entity = this.getEntityFromForm();
    this.sb.role.create(entity);
  }
}
