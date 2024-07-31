import { Component } from '@angular/core';
import { moveItemInArray } from '../../../../ngx-drag-drop-kit/src/drag-utils';
import { IDropEvent } from '../../../../ngx-drag-drop-kit/src/lib/directives/ngx-drop-list.directive';
import { NgxDragDropKitModule } from '../../../../ngx-drag-drop-kit/src/public-api';

@Component({
  selector: 'app-horizontal-list',
  standalone: true,
  imports: [NgxDragDropKitModule],
  templateUrl: './horizontal-list.component.html',
  styleUrl: './horizontal-list.component.scss',
})
export class HorizontalListComponent {
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

  drop(ev: IDropEvent) {
    moveItemInArray(this.items, ev.previousIndex, ev.currentIndex);
  }
}
