import { NgModule } from '@angular/core';
import { NgxDraggableDirective, NgxResizableDirective } from './public-api';
import { NgxDropListDirective } from './lib/directives/ngx-drop-list.directive';
import { NgxPlaceholderDirective } from './lib/directives/ngx-place-holder.directive';
const standAlones = [NgxDraggableDirective, NgxResizableDirective, NgxDropListDirective, NgxPlaceholderDirective];
@NgModule({
  imports: [...standAlones],
  exports: [...standAlones],
})
export class NgxDragDropKitModule {}
