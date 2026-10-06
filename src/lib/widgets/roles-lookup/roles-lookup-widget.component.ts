import { Component, OnInit, signal, forwardRef, inject, OnDestroy, input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RequestCriteria, RequestCriteriaFactory } from '@cartesianui/platform-core';
import { SelectableControlComponent } from '@cartesianui/platform-common';
import { AuthorizationSandbox } from '../../authorization.sandbox';
import { Role } from '../../models';
import { FORM_IMPORTS } from '../../authorization.imports';

@Component({
  selector: 'roles-lookup',
  exportAs: 'roles-lookup',
  template: `
    <div class="row">
      <div class="card mt-2">
        <div class="card-header">
          <strong>Attach Roles</strong>
        </div>
        <div class="card-body">
          <div class="form-group">
            <selectable-control [options]="items()" [ignoreOptions]="ignoreOptions()" optionField="name" [multi]="true" [value]="value()" (valueChange)="onValueChange($event)" placeholder="Select roles..." required></selectable-control>
          </div>
        </div>
      </div>
    </div>
  `,
  imports: [...FORM_IMPORTS, SelectableControlComponent],
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RolesLookupWidgetComponent),
      multi: true
    }
  ]
})
export class RolesLookupWidgetComponent implements OnInit, OnDestroy, ControlValueAccessor {
  protected sb = inject(AuthorizationSandbox);

  protected criteriaFactory = inject(RequestCriteriaFactory);

  criteria: RequestCriteria;
  items = signal<Role[]>([]);
  ignoreOptions = input<Role[]>([]);
  value = signal<any>(null);

  protected subs = new Subscription();

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.initCriteria().limit(100000);
    this.list();

    this.subs.add(
      this.sb.role.entities$.subscribe((roles) => {
        this.items.set(roles ?? []);
      })
    );
  }

  onValueChange(newVal: any): void {
    this.value.set(newVal);
    this.onChange(newVal);
    this.onTouched();
  }

  initCriteria(): RequestCriteria {
    return (this.criteria = this.criteriaFactory.create());
  }

  list(): void {
    this.sb.role.getAll(this.criteria.httpParams());
  }

  // ControlValueAccessor implementation
  writeValue(val: any): void {
    // Only update if the value actually changed to avoid feedback loops
    try {
      const current = this.value();
      if (JSON.stringify(current) === JSON.stringify(val)) {
        return;
      }
    } catch {
      // fallthrough if stringification fails
    }
    this.value.set(val ?? null);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // could disable the inner control if needed
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
