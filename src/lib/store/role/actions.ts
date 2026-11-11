import { entityActions } from '@cartesianui/platform-common';
import { createAction, props } from '@ngrx/store';
import { Role, RoleCloneSkip, RolePermissions } from '../../models';

const actions = entityActions<Role, 'Role'>('Role');

const additionalActions = {
  syncPermissions: createAction('[Role] Sync Permissions', props<{ id: string, form: RolePermissions }>()),
  attachPermissions: createAction('[Role] Attach Permissions', props<{ id: string, form: RolePermissions }>()),
  detachPermissions: createAction('[Role] Detach Permissions', props<{ id: string, form: RolePermissions }>()),
  // Give some permissions and revoke others in one save, in that order (the report-access card).
  // Never a full sync: every permission not named here is left as it is.
  changePermissions: createAction('[Role] Change Permissions', props<{ id: string, give: RolePermissions, revoke: RolePermissions }>()),
  // Create `form` as a new role, then give it every permission `sourceId` holds that can be given.
  // The source role is only read. `skipped` names what the server refused, with its reason.
  clone: createAction('[Role] Clone', props<{ sourceId: string, form: Role }>()),
  cloneSuccess: createAction('[Role] Clone Success', props<{ entity: Role, skipped: RoleCloneSkip[] }>()),
  cloneFailure: createAction('[Role] Clone Failure', props<{ message: string, errors?: any }>()),
  clearClone: createAction('[Role] Clear Clone'),
};

export const RoleActions = { ...actions, ...additionalActions };
