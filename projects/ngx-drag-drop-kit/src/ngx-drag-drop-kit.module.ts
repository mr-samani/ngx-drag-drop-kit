import { NgModule } from '@angular/core';
import { NgxDropListDirective } from './lib/directives/ngx-drop-list.directive';
import { NgxPlaceholderDirective } from './lib/directives/ngx-place-holder.directive';
import { NgxDraggableDirective } from './lib/directives/ngx-draggable.directive';
import { NgxResizableDirective } from './lib/directives/ngx-resizable.directive';
const standAlones = [
  NgxDraggableDirective,
  NgxResizableDirective,
  NgxDropListDirective,
  // Not implemented (has bug in update position and push other items)
  // NgxPlaceholderDirective
];
@NgModule({
  imports: [...standAlones],
  exports: [...standAlones],
})
export class NgxDragDropKitModule {}
