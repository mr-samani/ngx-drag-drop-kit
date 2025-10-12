import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IDropEvent, moveItemInArray, NgxDragDropKitModule } from '../../../../ngx-drag-drop-kit/src/public-api';

@Component({
  standalone: true,
  selector: 'app-dynamic-html',
  templateUrl: './dynamic-html.component.html',
  styleUrls: ['./dynamic-html.component.scss'],
  imports: [NgxDragDropKitModule, CommonModule],
})
export class DynamicHtmlComponent implements OnInit {
  items: string[] = [];
  constructor() {
    this.items = [];
    for (let i = 1; i <= 3; i++) {
      this.items.push('report element ' + i);
    }
  }

  ngOnInit() {}
  drop(ev: IDropEvent, list: string[]) {
    console.log('Drop event: ', ev);
    moveItemInArray(list, ev.previousIndex, ev.currentIndex);
  }
}
