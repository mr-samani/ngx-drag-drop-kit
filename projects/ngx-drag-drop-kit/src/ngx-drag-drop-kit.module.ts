import { NgModule } from '@angular/core';
import { NgxDraggableDirective, NgxResizableDirective } from './public-api';
import { NgxDropListDirective } from './lib/directives/ngx-drop-list.directive';
const standAlones = [NgxDraggableDirective, NgxResizableDirective, NgxDropListDirective];
@NgModule({
  imports: [...standAlones],
  exports: [...standAlones],
})
export class NgxDragDropKitModule {}
