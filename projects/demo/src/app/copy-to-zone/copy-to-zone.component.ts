import { Component } from '@angular/core';
import { Corner, IDropEvent, moveItemInArray, NgxDragDropKitModule } from '@ngx-drag-drop-kit';

@Component({
  selector: 'app-copy-to-zone',
  imports: [NgxDragDropKitModule],
  templateUrl: './copy-to-zone.component.html',
  styleUrl: './copy-to-zone.component.scss',
})
export class CopyToZoneComponent {
  sourceList: string[] = [];
  targetList: { id: string; title: string }[] = [];
  resizeCorner: Corner[] = ['right', 'bottom', 'bottomRight'];
  constructor() {
    this.sourceList = [];
    for (let i = 1; i < 80; i++) {
      this.sourceList.push('Item  ' + i);
    }
  }

  drop(event: IDropEvent) {
    console.log(event);
    if (event.previousContainer !== event.container) {
      const newItem = { id: this.generateId(), title: event.previousContainer.data[event.previousIndex] };
      event.container.data.splice(event.currentIndex, 0, newItem);
    } else {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }
  }

  generateId() {
    return Math.random().toString(36).substring(2, 9);
  }

  dropToDelete(event: IDropEvent) {
    event.container.data.splice(event.previousIndex, 1);
  }
  onClick(item: { id: string; title: string }) {
    console.log('Clicked item:', item);
  }
}
