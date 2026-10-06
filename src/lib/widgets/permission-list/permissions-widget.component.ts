import { Component, Injector } from '@angular/core';
import { ListingControlsComponent } from '@cartesianui/platform-common';
import { Permission } from '../../models';
import { LISTING_IMPORTS } from '../../authorization.imports';

console.log('DEBUG Imports', LISTING_IMPORTS);

@Component({
    selector: 'permissions-list',
    exportAs: 'permissions-list',
    templateUrl: './permissions-widget.component.html',
    imports: [...LISTING_IMPORTS],
    standalone: true
})
export class PermissionsWidgetComponent extends ListingControlsComponent<Permission> {

  list(): void {}
}
