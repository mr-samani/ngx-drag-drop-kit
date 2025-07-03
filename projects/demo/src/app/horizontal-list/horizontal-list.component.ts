import { Component } from '@angular/core';
import { moveItemInArray } from '../../../../ngx-drag-drop-kit/src/drag-utils';
import { IDropEvent } from '../../../../ngx-drag-drop-kit/src/models/IDropEvent';
import { NgxDragDropKitModule } from '../../../../ngx-drag-drop-kit/src/public-api';

@Component({
  selector: 'app-horizontal-list',
  standalone: true,
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
    for (let i = 1; i < 80; i++) {
      this.items.push('Episode ' + i);
    }
  }

  // drop(event: CdkDragDrop<string[]>) {
  //  // moveItemInArray(this.items, event.previousIndex, event.currentIndex);
  // }

  add() {
    let rndPosition = Math.floor(Math.random() * this.items.length);
    let rndName = 'added item_' + Math.round(Math.random() * 9999);
    this.items.splice(rndPosition, 0, rndName);
  }

  drop(ev: IDropEvent, list: string[]) {
    moveItemInArray(list, ev.previousIndex, ev.currentIndex);
  }
}
