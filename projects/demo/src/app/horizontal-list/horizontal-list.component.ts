import { Component } from '@angular/core';
import { IDropEvent, moveItemInArray, NgxDragDropKitModule } from '@ngx-drag-drop-kit';

@Component({
  selector: 'app-horizontal-list',
  imports: [NgxDragDropKitModule],
  templateUrl: './horizontal-list.component.html',
  styleUrl: './horizontal-list.component.scss',
})
export class HorizontalListComponent {
  items: string[] = [];
  simpleItems = [
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
    for (let i = 0; i < 80; i++) {
      this.items.push('item_' + i);
    }
  }

  add() {
    let rndPosition = Math.floor(Math.random() * this.items.length);
    let rndName = 'added item_' + Math.round(Math.random() * 9999);
    this.items.splice(rndPosition, 0, rndName);
  }

  drop(ev: IDropEvent, list: string[]) {
    moveItemInArray(list, ev.previousIndex, ev.currentIndex);
  }
}
