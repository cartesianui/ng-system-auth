import { ChangeDetectionStrategy, Component, Signal, inject } from '@angular/core';
import { BaseComponent } from '@cartesianui/platform-common';
import { AuthorizationSandbox } from '../../../authorization.sandbox';
import { Permission } from '../../../models';
import { FORM_IMPORTS } from '../../../authorization.imports';

@Component({
    selector: 'auth-permission-detail',
    templateUrl: './permission.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...FORM_IMPORTS],
    standalone: true
})
export class PermissionComponent extends BaseComponent {
  protected sb = inject(AuthorizationSandbox);

  readonly permission: Signal<Permission> = this.sb.permission.selected;
}
