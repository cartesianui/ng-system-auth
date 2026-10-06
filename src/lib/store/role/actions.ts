import { entityActions } from '@cartesianui/platform-common';
import { createAction, props } from '@ngrx/store';
import { Role, RolePermissions } from '../../models';

const actions = entityActions<Role, 'Role'>('Role');

const additionalActions = {
  syncPermissions: createAction('[Role] Sync Permissions', props<{ id: string, form: RolePermissions }>()),
  attachPermissions: createAction('[Role] Attach Permissions', props<{ id: string, form: RolePermissions }>()),
  detachPermissions: createAction('[Role] Detach Permissions', props<{ id: string, form: RolePermissions }>()),
};

export const RoleActions = { ...actions, ...additionalActions };
