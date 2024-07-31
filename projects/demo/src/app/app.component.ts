import { Component, Inject } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { NgxDragDropKitModule } from '../../../ngx-drag-drop-kit/src/lib/ngx-drag-drop-kit.module';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgxDragDropKitModule, RouterModule, CommonModule,FormsModule],
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
