import { Component } from '@angular/core';
import { copyArrayItem, moveItemInArray } from '../../../../ngx-drag-drop-kit/src/drag-utils';

import { Corner } from '../../../../ngx-drag-drop-kit/src/utils/corner-type';
import { NgxDragDropKitModule } from '../../../../ngx-drag-drop-kit/src/public-api';
import { IDropEvent } from '../../../../ngx-drag-drop-kit/src/interfaces/IDropEvent';

@Component({
  selector: 'app-copy-to-zone',
  imports: [NgxDragDropKitModule],
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
    // console.log(event);
    if (event.previousContainer !== event.container) {
      copyArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    } else {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }
  }

  dropToDelete(event: IDropEvent) {
    event.container.data.splice(event.previousIndex, 1);
  }
  onClick(item: string) {
    //console.log('Clicked item:', item);
  }
}
