import { Component, importProvidersFrom, Injector, Provider } from '@angular/core';
import { ListingControlsComponent } from '@cartesianui/platform-common';
import { Role } from '../../models';
import { LISTING_IMPORTS } from '../../authorization.imports';

@Component({
    selector: 'roles-list',
    exportAs: 'roles-list',
    templateUrl: './roles-widget.component.html',
    imports: [
      ...LISTING_IMPORTS
    ],
    standalone: true
})
export class RolesWidgetComponent extends ListingControlsComponent<Role> {

  list(): void {}
}
