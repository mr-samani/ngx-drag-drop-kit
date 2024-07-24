import { NgModule } from '@angular/core';
import { NgxDraggableDirective } from '../public-api';
import { NgxResizableDirective } from './directives/ngx-resizable.directive';
import { NgxDropListDirective } from './directives/ngx-drop-list.directive';
import { NgxDragDropService } from './services/ngx-drag-drop.service';
import { AutoScroll } from '../utils/auto-scroll';
import { NgxPlaceholderService } from './services/ngx-placeholder.service';

const directives = [
  NgxDraggableDirective,
  NgxResizableDirective,
  NgxDropListDirective,
];
@NgModule({
  declarations: [...directives],
  exports: [...directives],
  providers: [NgxDragDropService, NgxPlaceholderService, AutoScroll],
})
export class NgxDragDropKitModule {}
