import { Component } from '@angular/core';
import { NgxDragDropKitModule } from '../../../../ngx-drag-drop-kit/src/lib/ngx-drag-drop-kit.module';

@Component({
  selector: 'app-drag-resize',
  standalone: true,
  imports: [NgxDragDropKitModule],
  templateUrl: './drag-resize.component.html',
  styleUrl: './drag-resize.component.scss'
})
export class DragResizeComponent {

}
