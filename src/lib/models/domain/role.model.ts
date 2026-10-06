import { BaseModel, EntityMeta } from '@cartesianui/platform-common';
import { Validators } from '@angular/forms';

export interface IRole {
  type?: string | undefined;
  id?: string | undefined;
  name?: string | undefined;
  guardName?: string | undefined;
  description?: string | undefined;
  displayName?: string | undefined;
  level?: number | undefined;
  permissions?: any | undefined;
}

@EntityMeta({
  list: [
    { key: 'name', label: 'Name', opt: { link: true } },
    { key: 'displayName', label: 'Display Name', opt: {} },
    { key: 'description', label: 'Description', opt: {} },
  ],
  form: [
    { key: 'name', label: 'Name', opt: { validators: [Validators.required, Validators.maxLength(255)] } },
    { key: 'displayName', label: 'Display Name', opt: {} },
    { key: 'description', label: 'Description', opt: {} },
  ],
  search: [
    'name:like',
    'displayName:like'
  ]
})
export class Role extends BaseModel implements IRole {
  type: string;
  id: string;
  name: string;
  guardName: string;
  description: string;
  displayName: string;
  level: number;
  permissions: any;

  constructor(data?: IRole) {
    super(data);
  }

}
