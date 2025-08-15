import { Injectable } from '@angular/core';
import { NgxDropListDirective } from '../directives/ngx-drop-list.directive';
import { NgxDraggableDirective } from '../directives/ngx-draggable.directive';

@Injectable({ providedIn: 'root' })
export class NgxDragRegisterService {
  dropList = new Map<Element, NgxDropListDirective>();
  dropListItems: NgxDropListDirective[] = [];

  dargItems = new Map<HTMLElement, NgxDraggableDirective>();
  registerDropList(drop: NgxDropListDirective) {
    this.dropList.set(drop.el, drop);
    this.dropListItems.push(drop);
    // console.log('registerDropList', this.dropList);
  }

  removeDropList(drop: NgxDropListDirective) {
    this.dropList.delete(drop.el);
    const i = this.dropListItems.findIndex((x) => x == drop);
    if (i > -1) {
      this.dropListItems.splice(i, 1);
    }
    // console.log('removeDropList', this.dropList);
  }

  registerDragItem(drag: NgxDraggableDirective) {
    let dropList = this.findParentDropList(drag);
    if (dropList) {
      drag.dropList = dropList;
      dropList.registerDragItem(drag);
    }
    this.dargItems.set(drag.el, drag);
    // console.log('registerDragItem', dropList?.dragItems);
  }

  removeDragItem(drag: NgxDraggableDirective) {
    let dropList = drag.dropList;
    if (dropList) {
      dropList.removeDragItem(drag);
    }
    this.dargItems.delete(drag.el);
    // console.log('removeDragItem', dropList?.dragItems);
  }

  private findParentDropList(drag: NgxDraggableDirective): NgxDropListDirective | null {
    const nativeEl = drag.el;
    const container = nativeEl.closest('[ngxDropList]');
    if (!container) return null;
    const dropListDirective = this.dropList.get(container);
    return dropListDirective ?? null;
  }
}
