import { entityFeature } from '@cartesianui/platform-common';
import { Role } from '../../models';
import { RoleActions } from './actions';

export const fromRole = entityFeature<Role>('roles', RoleActions);
