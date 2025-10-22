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
  items: {
    title: string;
    tag: string;
  }[] = [];
  constructor() {
    this.items = [];
    for (let i = 1; i <= 3; i++) {
      this.items.push({
        title: 'report element ' + i,
        tag: ['div', 'input'][Math.floor(Math.random() * 2)],
      });
    }
  }

  ngOnInit() {}
  drop(ev: IDropEvent, list: any[]) {
    console.log('Drop event: ', ev);
    moveItemInArray(list, ev.previousIndex, ev.currentIndex);
  }
}
