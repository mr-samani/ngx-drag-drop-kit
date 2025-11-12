import { Component } from '@angular/core';
import { IPosition, IResizableOutput, NgxDragDropKitModule } from '@ngx-drag-drop-kit';

@Component({
  selector: 'app-drag-resize',
  imports: [NgxDragDropKitModule],
  templateUrl: './drag-resize.component.html',
  styleUrl: './drag-resize.component.scss',
})
export class DragResizeComponent {
  onDragEnd(event: IPosition) {
    console.log('dragEnd', event);
  }
  onResizeEnd(event: IResizableOutput) {
    console.log('resizeEnd', event);
  }
}
