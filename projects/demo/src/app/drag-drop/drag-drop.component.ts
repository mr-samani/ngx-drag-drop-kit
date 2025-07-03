import { Component } from '@angular/core';
import { IDropEvent } from '../../../../ngx-drag-drop-kit/src/models/IDropEvent';
import { moveItemInArray, transferArrayItem } from '../../../../ngx-drag-drop-kit/src/drag-utils';
import { NgxDragDropKitModule } from '../../../../ngx-drag-drop-kit/src/public-api';

@Component({
  selector: 'app-drag-drop',
  standalone: true,
  imports: [NgxDragDropKitModule],
  templateUrl: './drag-drop.component.html',
  styleUrl: './drag-drop.component.scss',
})
export class DragDropComponent {
  inProgressList: string[] = [];
  completedList: string[] = [];
  failedList: string[] = [];
  todoList: string[] = [];

  constructor() {
    this.todoList = [];
    for (let i = 1; i < 8; i++) {
      this.todoList.push('Episode ' + i);
    }
  }

  // drop(event: CdkDragDrop<string[]>) {
  //  // moveItemInArray(this.todoList, event.previousIndex, event.currentIndex);
  // }

  add() {
    let rndPosition = Math.floor(Math.random() * this.todoList.length);
    let rndName = 'added item_' + Math.round(Math.random() * 9999);
    this.todoList.splice(rndPosition, 0, rndName);
  }

  drop(event: IDropEvent) {
    console.log(event);
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
  }
}
