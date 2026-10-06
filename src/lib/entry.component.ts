import { Component, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { BaseComponent } from '@cartesianui/platform-common';

@Component({
    selector: 'app-authorization',
    template: `<router-outlet></router-outlet>`,
    imports: [CommonModule, RouterOutlet],
    standalone: true
})
export class EntryComponent extends BaseComponent {
  constructor() {
    super();
    console.log('📦 Authorization feature initialized');
  }
}

