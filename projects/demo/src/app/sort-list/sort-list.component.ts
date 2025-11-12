import { Component } from '@angular/core';
import { IDropEvent, moveItemInArray, NgxDragDropKitModule } from '@ngx-drag-drop-kit';

@Component({
  selector: 'app-sort-list',
  imports: [NgxDragDropKitModule],
  templateUrl: './sort-list.component.html',
  styleUrl: './sort-list.component.scss',
})
export class SortListComponent {
  items: string[] = Array.from({ length: 30 }).map((m, i) => 'Item ' + i);
  items2: { id: string; title: string; size: number }[] = Array.from({ length: 5 }).map((m, i) => ({
    id: 'item_' + i,
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
