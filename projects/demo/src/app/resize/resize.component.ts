import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IResizableOutput, NgxResizableDirective } from '@ngx-drag-drop-kit';

@Component({
  selector: 'app-resizable-demo',
  standalone: true,
  imports: [NgxResizableDirective, CommonModule],
  templateUrl: './resize.component.html',
  styleUrls: ['./resize.component.scss'],
})
export class ResizableDemoComponent {
  eventLog = 'Waiting for resize events...';

  onResizeStart() {
    this.log('🟢 Resize Started');
  }

  onResize(event: IResizableOutput) {
    this.log(`📐 Resizing: ${Math.round(event.width)}x${Math.round(event.height)}`);
  }

  onResizeEnd(event: IResizableOutput) {
    this.log(
      `🔴 Resize Ended: ${Math.round(event.width)}x${Math.round(event.height)} at (${Math.round(event.left ?? 0)}, ${Math.round(event.top ?? 0)})`
    );
  }

  addContent() {
    this.log('➕ Content Added');
  }

  private log(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    this.eventLog = `[${timestamp}] ${message}\n${this.eventLog}`;
  }
}
