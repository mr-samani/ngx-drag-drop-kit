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
  items: string[] = Array.from({ length: 30 }).map((m, i) => 'Item ' + i);
  items2: { title: string; size: number }[] = Array.from({ length: 5 }).map((m, i) => ({
    title: 'Item ' + i,
    size: [25, 50, 100, 150][Math.floor(Math.random() * 4)],
  }));

  constructor() {}

  add() {
    let rndPosition = Math.floor(Math.random() * this.items.length);
    let rndName = 'added item_' + Math.round(Math.random() * 9999);
    this.items.splice(rndPosition, 0, rndName);
  }

  drop(ev: IDropEvent, list: any[]) {
    console.log('Drop event: ', ev);
    moveItemInArray(list, ev.previousIndex, ev.currentIndex);
  }
}
