import { ChangeDetectionStrategy, Component, OnInit, AfterViewInit, OnDestroy, effect, inject } from '@angular/core';
import { ListingControlsComponent, ENTITY_CONSTRUCTOR, RequestType, AppDatatableComponent, SearchPanelComponent } from '@cartesianui/platform-common';
import { AuthorizationSandbox } from '../../authorization.sandbox';
import { Permission } from '../../models';
import { LISTING_IMPORTS } from '../../authorization.imports';
import { PermissionComponent } from './detail/permission.component';

const permissionChildComponents = {
  permissionDetails: { id: 'permissionDetails', title: 'Permission Details' }
} as const;

type PermissionChildComponent = typeof permissionChildComponents;

@Component({
    selector: 'auth-permissions',
    templateUrl: './permissions.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
      ...LISTING_IMPORTS,
      AppDatatableComponent,
      SearchPanelComponent,
      PermissionComponent
    ],
    providers: [
      {
        provide: ENTITY_CONSTRUCTOR,
        useValue: Permission
      }
    ],
    standalone: true
})
export class PermissionsComponent extends ListingControlsComponent<Permission, PermissionChildComponent> implements OnInit, AfterViewInit, OnDestroy {

  override childComponents: PermissionChildComponent = permissionChildComponents;

  protected sb = inject(AuthorizationSandbox);

  private readonly busyEffect = effect(() => {
    this.handleBusyState(this.sb.permission.getState());
  });

  private readonly completeEffect = effect(() => {
    if (!this.sb.permission.getCompleted()) return;
    this.sb.permission.clearRequestState(RequestType.Get);
  });

  ngOnInit(): void {
    this.loadEntityMetadata();
    this.initCriteria();
  }

  view(permission: Permission) {
    this.sb.permission.select(permission);
    this.showChildComponent(this.childComponents.permissionDetails, 'permissionDetails');
  }

  list(): void {
    this.sb.permission.getAll(this.criteria.httpParams());
  }
}
