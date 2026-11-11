import { createSelector } from '@ngrx/store';
import { createEntityAdapter } from '@ngrx/entity';
import { entityFeature, requestStarted, requestCompleted, requestFailed, RequestState, requestDefault } from '@cartesianui/platform-common';
import { Role, RoleCloneSkip } from '../../models';
import { RoleActions } from './actions';

export interface IRoleStateExtended {
  cloneRequest: RequestState | undefined;
  /** What the last clone could not give the new role. Empty until a clone completes. */
  cloneSkipped: RoleCloneSkip[];
}

const stateExtension: IRoleStateExtended = {
  cloneRequest: requestDefault,
  cloneSkipped: []
};

const baseFeature = entityFeature<Role, IRoleStateExtended>('roles', RoleActions, stateExtension);
const adapter = createEntityAdapter<Role>();

const originalReducer = baseFeature.reducer;

const customReducer = (state: any, action: any) => {
  const newState = originalReducer(state, action);

  switch (action.type) {
    case RoleActions.clone.type:
      return { ...newState, cloneRequest: { ...requestStarted }, cloneSkipped: [] };

    // The new role joins the listing and becomes the selected role, so the edit screen shows it.
    case RoleActions.cloneSuccess.type:
      return adapter.upsertOne(action.entity, {
        ...newState,
        selected: action.entity,
        cloneRequest: { ...requestCompleted },
        cloneSkipped: action.skipped ?? []
      });

    case RoleActions.cloneFailure.type:
      return { ...newState, cloneRequest: { ...requestFailed, body: { message: action.message, errors: action.errors } } };

    case RoleActions.clearClone.type:
      return { ...newState, ...stateExtension };

    default:
      return newState;
  }
};

const stateSelector = (baseFeature as any).selectRolesState;

const cloneRequest = createSelector(stateSelector, (state: any) => state?.cloneRequest);

const cloneSkipped = createSelector(stateSelector, (state: any) => state?.cloneSkipped ?? []);

export const fromRole = { ...baseFeature, reducer: customReducer, cloneRequest, cloneSkipped };
