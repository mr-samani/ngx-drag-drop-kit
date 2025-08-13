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
  items = [
    'Episode I - The Phantom Menace',
    'Episode II - Attack of the Clones',
    'Episode III - Revenge of the Sith',
    'Episode IV - A New Hope',
    'Episode V - The Empire Strikes Back',
    'Episode VI - Return of the Jedi',
    'Episode VII - The Force Awakens',
    'Episode VIII - The Last Jedi',
    'Episode IX - The Rise of Skywalker',
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

  drop(ev: IDropEvent) {
    console.log('Drop event: ', ev);
    moveItemInArray(this.items, ev.previousIndex, ev.currentIndex);
  }
}
