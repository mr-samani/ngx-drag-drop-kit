import { Component, Input } from '@angular/core';
import { TreeModel } from '../nested-tree-sort.component';
import { transferArrayItem } from '../../../../../ngx-drag-drop-kit/src/drag-utils';
import { IDropEvent } from '../../../../../ngx-drag-drop-kit/src/models/IDropEvent';
import { CommonModule } from '@angular/common';
import { NgxDragDropKitModule } from '../../../../../ngx-drag-drop-kit/src/public-api';
import { IPosition } from 'ngx-drag-drop-kit';
import { getPointerPosition } from '../../../../../ngx-drag-drop-kit/src/utils/get-position';

@Component({
  selector: 'tree',
  templateUrl: './tree-viewer.component.html',
  styleUrls: ['./tree-viewer.component.scss'],
  standalone: true,
  imports: [CommonModule, NgxDragDropKitModule],
  exportAs: 'TreeViewer',
})
export class TreeViewerComponent {
  @Input() items: TreeModel[] = [];
  currentDragItem?: HTMLElement;
  drop(event: IDropEvent) {
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    this.currentDragItem = undefined;
  }

  handleEnterd(ev: MouseEvent, item: TreeModel, dragItem: HTMLElement) {
    if (!this.currentDragItem) return;
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
