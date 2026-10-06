import { BaseModel, EntityMeta } from '@cartesianui/platform-common';

interface IRolePermissions {
  id?: string | undefined;
  roleId: string;
  permissionIds: string[];
}

@EntityMeta({
  search: []
})
export class RolePermissions extends BaseModel implements IRolePermissions {
  id: string;
  roleId: string;
  permissionIds: string[];

  constructor(data?: IRolePermissions) {
    super(data);
  }

}
