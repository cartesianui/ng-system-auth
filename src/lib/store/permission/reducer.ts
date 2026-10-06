import { entityFeature } from '@cartesianui/platform-common';
import { Permission } from '../../models';
import { PermissionActions } from './actions';

export const fromPermission = entityFeature<Permission>('permissions', PermissionActions);
