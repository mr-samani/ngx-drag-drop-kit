import { Component } from '@angular/core';
import { moveItemInArray } from '../../../../ngx-drag-drop-kit/src/drag-utils';
import { IDropEvent } from '../../../../ngx-drag-drop-kit/src/interfaces/IDropEvent';
import { NgxDragDropKitModule } from '../../../../ngx-drag-drop-kit/src/public-api';

@Component({
  selector: 'app-sort-list',
  standalone: true,
  imports: [NgxDragDropKitModule],
  templateUrl: './sort-list.component.html',
  styleUrl: './sort-list.component.scss',
})
export class SortListComponent {
  items: string[] = [];
  items2 = [
    'Episode I',
    'Episode II',
    'Episode III',
    'Episode IV',
    'Episode V',
    'Episode VI',
    'Episode VII',
    'Episode VIII',
    'Episode IX',
  ];

  constructor() {
    this.items = [];
    for (let i = 1; i <= 30; i++) {
      this.items.push('Episode ' + i);
    }
  }

  add() {
    let rndPosition = Math.floor(Math.random() * this.items.length);
    let rndName = 'added item_' + Math.round(Math.random() * 9999);
    this.items.splice(rndPosition, 0, rndName);
  }

  drop(ev: IDropEvent, list: string[]) {
    console.log('Drop event: ', ev);
    moveItemInArray(list, ev.previousIndex, ev.currentIndex);
  }
}
