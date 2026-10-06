import { Component, inject, Injector, Input, OnInit } from '@angular/core';
import { ListingControlsComponent } from '@cartesianui/platform-common';
import { AuthorizationSandbox } from '../../authorization.sandbox';
import { Permission } from '../../models';
import { FORM_IMPORTS } from '../../authorization.imports';

@Component({
    selector: 'permissions-lookup',
    exportAs: 'permissions-lookup',
    templateUrl: './permissions-lookup-widget.component.html',
    imports: [...FORM_IMPORTS],
    standalone: true
})
export class PermissionsLookupWidgetComponent extends ListingControlsComponent<Permission> implements OnInit {
  @Input() ignoreOptions: Array<Permission> = [];

  protected sb = inject(AuthorizationSandbox);

  ngOnInit(): void {
    this.initCriteria().limit(100000);
  }

  list(): void {
    this.sb.permission.getAll(this.criteria.httpParams());
  }
}
