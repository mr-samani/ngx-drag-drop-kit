import { Component } from '@angular/core';
import { NgxDragDropKitModule } from '../../../../ngx-drag-drop-kit/src/lib/ngx-drag-drop-kit.module';
import { IDropEvent } from '../../../../ngx-drag-drop-kit/src/lib/directives/ngx-drop-list.directive';
import { moveItemInArray, transferArrayItem } from '../../../../ngx-drag-drop-kit/src/drag-utils';

@Component({
  selector: 'app-drag-drop',
  standalone: true,
  imports: [NgxDragDropKitModule],
  templateUrl: './drag-drop.component.html',
  styleUrl: './drag-drop.component.scss',
})
export class DragDropComponent {
  dropedList=[];
  movies = [
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
    this.movies = [];
    for (let i = 1; i < 8; i++) {
      this.movies.push('Episode ' + i);
    }
  }

  // drop(event: CdkDragDrop<string[]>) {
  //  // moveItemInArray(this.movies, event.previousIndex, event.currentIndex);
  // }

  add() {
    let rndPosition = Math.floor(Math.random() * this.movies.length);
    let rndName = 'added item_' + Math.round(Math.random() * 9999);
    this.movies.splice(rndPosition, 0, rndName);
  }

  drop(event: IDropEvent) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }
}
