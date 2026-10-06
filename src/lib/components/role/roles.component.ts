import { ChangeDetectionStrategy, Component, OnInit, AfterViewInit, OnDestroy, effect, inject } from '@angular/core';
import { ListingControlsComponent, ENTITY_CONSTRUCTOR, RequestType, AppDatatableComponent, SearchPanelComponent } from '@cartesianui/platform-common';
import { AuthorizationSandbox } from '../../authorization.sandbox';
import { IRole, Role } from '../../models';
import { LISTING_IMPORTS } from '../../authorization.imports';
import { RoleComponent } from './edit/role.component';
import { RoleFormComponent } from './create/create-role.component';

const childComponents = {
  createRole: { id: 'createRole', title: 'Create Role' },
  editRole: { id: 'editRole', title: 'Edit Role' }
} as const;

type ChildComponent = typeof childComponents;

@Component({
    selector: 'auth-roles',
    templateUrl: './roles.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
      ...LISTING_IMPORTS,
      AppDatatableComponent,
      SearchPanelComponent,
      RoleComponent,
      RoleFormComponent
    ],
    providers: [
      {
        provide: ENTITY_CONSTRUCTOR,
        useValue: Role
      }
    ],
    standalone: true
})
export class RolesComponent extends ListingControlsComponent<IRole, ChildComponent> implements OnInit, AfterViewInit, OnDestroy {
  override childComponents: ChildComponent = childComponents;

  protected sb = inject(AuthorizationSandbox);

  private readonly busyEffect = effect(() => {
    this.handleBusyState(this.sb.role.getState());
  });

  private readonly completeEffect = effect(() => {
    if (!this.sb.role.getCompleted()) return;
    this.sb.role.clearRequestState(RequestType.Get);
  });

  ngOnInit(): void {
    this.loadEntityMetadata();
    this.initCriteria().with('permissions');
  }

  list(): void {
    this.sb.role.getAll(this.criteria.httpParams());
  }

  onDelete() {
    this.message.confirm('Are you sure you want to delete this record?', 'Confirm Deletion', (confirmed) => {
      if (confirmed) {
        this.sb.role.delete(this.selected[0].id);
        this.selected = [];
      }
    });
  }

  override onCreated() {
    this.list();
    this.showChildComponent(this.childComponents.editRole, 'editRole');
  }

  edit(role: Role) {
    this.sb.role.select(role);
    this.showChildComponent(this.childComponents.editRole, 'editRole');
  }
}
