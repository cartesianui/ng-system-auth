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
    // One cell, two lines: display name on top, the name (slug) under it, small and muted.
    // The key stays `name`, so the column still sorts by name and opens the edit form.
    {
      key: 'name',
      label: 'Role',
      opt: {
        link: true,
        formatter: {
          type: 'multiline',
          separator: 'br',
          items: [
            { key: 'displayName', displayAs: 'text' },
            { key: 'name', displayAs: 'muted' }
          ]
        }
      }
    },
    // Wraps inside the cell instead of being cut off; the listing sets `rowHeight` to 'auto' for it.
    { key: 'description', label: 'Description', opt: { formatter: { displayAs: 'text', class: 'text-wrap' } } },
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
