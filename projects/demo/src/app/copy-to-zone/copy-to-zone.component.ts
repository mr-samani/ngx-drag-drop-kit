import { Component } from '@angular/core';
import { IDropEvent } from '../../../../ngx-drag-drop-kit/src/lib/directives/ngx-drop-list.directive';
import { copyArrayItem, moveItemInArray, transferArrayItem } from '../../../../ngx-drag-drop-kit/src/drag-utils';
import { NgxDragDropKitModule } from '../../../../ngx-drag-drop-kit/src/lib/ngx-drag-drop-kit.module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-copy-to-zone',
  standalone: true,
  imports: [NgxDragDropKitModule, CommonModule],
  templateUrl: './copy-to-zone.component.html',
  styleUrl: './copy-to-zone.component.scss',
})
export class CopyToZoneComponent {
  sourceList: string[] = [];
  targetList: string[] = [];
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
