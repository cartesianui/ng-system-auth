import { entityActions } from '@cartesianui/platform-common';
import { createAction, props } from '@ngrx/store';
import { Role, RolePermissions } from '../../models';

const actions = entityActions<Role, 'Role'>('Role');

const additionalActions = {
  syncPermissions: createAction('[Role] Sync Permissions', props<{ id: string, form: RolePermissions }>()),
  attachPermissions: createAction('[Role] Attach Permissions', props<{ id: string, form: RolePermissions }>()),
  detachPermissions: createAction('[Role] Detach Permissions', props<{ id: string, form: RolePermissions }>()),
  // Give some permissions and revoke others in one save, in that order (the report-access card).
  // Never a full sync: every permission not named here is left as it is.
  changePermissions: createAction('[Role] Change Permissions', props<{ id: string, give: RolePermissions, revoke: RolePermissions }>()),
};

export const RoleActions = { ...actions, ...additionalActions };
