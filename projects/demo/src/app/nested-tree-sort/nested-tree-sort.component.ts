import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgxDragDropKitModule, transferArrayItem } from '../../../../ngx-drag-drop-kit/src/public-api';
import { IDropEvent } from '../../../../ngx-drag-drop-kit/src/interfaces/IDropEvent';
import { getPointerPosition } from '../../../../ngx-drag-drop-kit/src/utils/get-position';

export interface TreeModel {
  name: string;
  children: TreeModel[];
  entered?: boolean;

  _dragAction?: 'before' | 'after' | 'inside';
}

@Component({
  selector: 'app-nested-tree-sort',
  standalone: true,
  imports: [CommonModule, NgxDragDropKitModule],
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

  currentDragItem?: HTMLElement;
  drop(event: IDropEvent) {
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    this.currentDragItem = undefined;
  }

  handleEnterd(ev: MouseEvent, item: TreeModel, dragItem: HTMLElement) {
    if (!this.currentDragItem) {
      item.entered = false;
      return;
    }
    const position = getPointerPosition(ev);
    const dragOverRect = dragItem.getBoundingClientRect();
    const mouseY = position.y;

    // مقدار y موس نسبت به بالای المنتی که روش hover شده
    const offsetY = mouseY - dragOverRect.top;

    const oneThird = dragOverRect.height / 3;

    let action: 'before' | 'after' | 'inside';
    if (offsetY < oneThird) {
      action = 'before';
    } else if (offsetY > 2 * oneThird) {
      action = 'after';
    } else {
      action = 'inside';
    }

    item.entered = action === 'inside';

    // اختیاری: ذخیره تصمیم در آیتم برای بعد
    (item as any)._dragAction = action;

    // یا می‌تونی emit کنی:
    // this.onDragPositionChanged.emit({ item, action });

    console.log(`[${item.name}] - action:`, action, 'offsetY:', offsetY);
  }
}
