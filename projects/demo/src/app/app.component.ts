import { Component, Inject } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxDraggableDirective, NgxResizableDirective } from '../../../ngx-drag-drop-kit/src/public-api';
import { NgxDropListDirective } from '../../../ngx-drag-drop-kit/src/lib/directives/ngx-drop-list.directive';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    CommonModule,
    FormsModule,
    NgxDraggableDirective,
    NgxResizableDirective,
    NgxDropListDirective,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  isRtl = false;

  constructor(@Inject(DOCUMENT) private _document: Document) {
    this.changeDirection();
  }
  changeDirection() {
    const dir = this.isRtl ? 'rtl' : 'ltr';
    this._document.dir = dir;
    this._document.body.dir = dir;
  }
}
