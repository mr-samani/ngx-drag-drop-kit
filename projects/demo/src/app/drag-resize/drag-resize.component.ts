import { Component } from '@angular/core';
import { IPosition, NgxDragDropKitModule } from '../../../../ngx-drag-drop-kit/src/public-api';
import { IResizableOutput } from '../../../../ngx-drag-drop-kit/src/interfaces/IResizableOutput';

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
