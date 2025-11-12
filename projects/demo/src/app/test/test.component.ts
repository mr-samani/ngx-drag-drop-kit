import { Component } from '@angular/core';
import { IPosition, NgxDragDropKitModule } from '@ngx-drag-drop-kit';

interface DragEvent {
  type: string;
  x: number;
  y: number;
  timestamp: Date;
}

@Component({
  selector: 'app-test',
  imports: [NgxDragDropKitModule],
  templateUrl: './test.component.html',
  styleUrl: './test.component.scss',
})
export class TestComponent {
  list: any[] = [];
  dragEvents: DragEvent[] = [];

  LoadDta() {
    console.time('test');
    for (let i = 0; i < 100000; i++) {
      this.list.push({
        Id: i,
        Title: 'Item ' + i,
      });
    }
    console.timeEnd('test');
  }

  onDragStart(position: IPosition) {
    this.addDragEvent('Start', position);
  }

  onDragMove(position: IPosition) {
    this.addDragEvent('Move', position);
  }

  onDragEnd(position: IPosition) {
    this.addDragEvent('End', position);
  }

  private addDragEvent(type: string, position: IPosition) {
    this.dragEvents.unshift({
      type,
      x: position.x,
      y: position.y,
      timestamp: new Date(),
    });

    // Keep only the last 10 events
    if (this.dragEvents.length > 10) {
      this.dragEvents = this.dragEvents.slice(0, 10);
    }
  }
}
