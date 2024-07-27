import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgxDragDropKitModule } from '../../../../ngx-drag-drop-kit/src/lib/ngx-drag-drop-kit.module';
import { TreeViewerComponent } from './tree/tree-viewer.component';

export interface TreeModel {
  name: string;
  children: TreeModel[];
}

@Component({
  selector: 'app-nested-tree-sort',
  standalone: true,
  imports: [CommonModule, NgxDragDropKitModule, TreeViewerComponent],
  templateUrl: './nested-tree-sort.component.html',
  styleUrl: './nested-tree-sort.component.scss',
})
export class NestedTreeSortComponent {
  items: TreeModel[] = [];

  constructor() {
    this.items = [];
    for (let i = 1; i < 10; i++) {
      this.items.push({
        name: 'Item ' + i,
        children: [],
      });
    }
  }

  add() {
    let rndPosition = Math.floor(Math.random() * this.items.length);
    let rndName = 'added item_' + Math.round(Math.random() * 9999);
    this.items.splice(rndPosition, 0, { name: rndName, children: [] });
  }
}
