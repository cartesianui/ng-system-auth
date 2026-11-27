import { Component, Injector, OnChanges, SimpleChanges } from '@angular/core';
import { ListingControlsComponent } from '@cartesianui/platform-common';
import { Permission } from '../../models';
import { LISTING_IMPORTS } from '../../authorization.imports';

console.log('DEBUG Imports', LISTING_IMPORTS);

@Component({
    selector: 'permissions-list',
    exportAs: 'permissions-list',
    templateUrl: './permissions-widget.component.html',
    imports: [...LISTING_IMPORTS],
    standalone: true
})
export class PermissionsWidgetComponent extends ListingControlsComponent<Permission> implements OnChanges {
  /**
   * 2026-11-27: the list showed 5 rows a page behind an easy-to-miss pager, so a role's or a user's
   * permissions read as cut short. It now pages 25 at a time, says how many there are, and filters
   * on name and description. The header select-all ticks the rows the filter leaves, since those
   * are the rows the table is given.
   */
  readonly pageSize = 25;

  filterText = '';

  filteredRows: Permission[] = [];

  offset = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rows']) this.applyFilter();
  }

  onFilter(text: string): void {
    this.filterText = text ?? '';
    this.offset = 0;
    this.applyFilter();
  }

  onPage(event: { offset: number }): void {
    this.offset = event.offset;
  }

  private applyFilter(): void {
    const rows = this.rows ?? [];
    const term = this.filterText.trim().toLowerCase();
    this.filteredRows = term
      ? rows.filter((permission) => `${permission?.name ?? ''} ${permission?.description ?? ''}`.toLowerCase().includes(term))
      : [...rows];
    const lastPage = Math.max(0, Math.ceil(this.filteredRows.length / this.pageSize) - 1);
    if (this.offset > lastPage) this.offset = lastPage;
  }

  list(): void {}
}
