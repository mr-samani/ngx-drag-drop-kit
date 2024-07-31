import { Component } from '@angular/core';
import { copyArrayItem, moveItemInArray } from '../../../../ngx-drag-drop-kit/src/drag-utils';
import { CommonModule } from '@angular/common';
import { Corner } from '../../../../ngx-drag-drop-kit/src/utils/corner-type';
import { NgxDragDropKitModule } from '../../../../ngx-drag-drop-kit/src/public-api';
import { IDropEvent } from '../../../../ngx-drag-drop-kit/src/lib/directives/ngx-drop-list.directive';

@Component({
  selector: 'app-copy-to-zone',
  standalone: true,
  imports: [CommonModule, NgxDragDropKitModule],
  templateUrl: './copy-to-zone.component.html',
  styleUrl: './copy-to-zone.component.scss',
})
export class CopyToZoneComponent {
  sourceList: string[] = [];
  targetList: string[] = [];
  resizeCorner: Corner[] = ['right', 'bottom', 'bottomRight'];
  constructor() {
    this.sourceList = [];
    for (let i = 1; i < 80; i++) {
      this.sourceList.push('Item  ' + i);
    }
  }

  drop(event: IDropEvent) {
    // if (event.previousContainer === event.container) {
    //   moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    // } else {
    //   transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    // }
    console.log(event);
    if (event.previousContainer !== event.container) {
      copyArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    } else {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }
  }
}
