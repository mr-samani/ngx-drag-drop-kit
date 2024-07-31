import { Component } from '@angular/core';
import { NgxDragDropKitModule } from '../../../../ngx-drag-drop-kit/src/public-api';

@Component({
  selector: 'app-drag-resize',
  standalone: true,
  imports: [NgxDragDropKitModule],
  templateUrl: './drag-resize.component.html',
  styleUrl: './drag-resize.component.scss'
})
export class DragResizeComponent {

}
