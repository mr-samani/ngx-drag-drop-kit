import { NgModule } from '@angular/core';
import { NgxDraggableDirective } from '../public-api';
import { NgxResizableDirective } from './directives/ngx-resizable.directive';

@NgModule({
  declarations: [NgxDraggableDirective, NgxResizableDirective],
  exports: [NgxDraggableDirective, NgxResizableDirective],
})
export class NgxDragDropKitModule {}
