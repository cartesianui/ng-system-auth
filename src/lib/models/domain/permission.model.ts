import { BaseModel, EntityMeta } from '@cartesianui/platform-common';

export interface IPermission {
  id: string | undefined;
  name: string | undefined;
  description: string | undefined;
  displayName: string | undefined;
}

@EntityMeta({
  list: [
    { key: 'name', label: 'Name', opt: { link: true } },
    { key: 'displayName', label: 'Display Name', opt: {} },
    { key: 'description', label: 'Description', opt: {} },
  ],
  search: [
    'name:like',
    'displayName:like'
  ]
})
export class Permission extends BaseModel implements IPermission {
  public id: string;
  public name: string;
  public description: string;
  public displayName: string;

  constructor(data?: IPermission) {
    super(data);
  }

}
