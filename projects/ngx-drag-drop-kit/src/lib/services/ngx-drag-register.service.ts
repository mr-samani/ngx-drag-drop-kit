import { Injectable } from '@angular/core';
import { NgxDropListDirective } from '../directives/ngx-drop-list.directive';
import { NgxDraggableDirective } from '../directives/ngx-draggable.directive';

@Injectable({ providedIn: 'root' })
export class NgxDragRegisterService {
  dropList = new WeakMap<Element, NgxDropListDirective>();

  registerDropList(drop: NgxDropListDirective) {
    this.dropList.set(drop.el, drop);
    // console.log('registerDropList', this.dropList);
  }

  removeDropList(drop: NgxDropListDirective) {
    this.dropList.delete(drop.el);
    // console.log('removeDropList', this.dropList);
  }

  registerDragItem(drag: NgxDraggableDirective) {
    let dropList = this.findParentDropList(drag);
    if (dropList) {
      drag.dropList = dropList;
      dropList.dragItems.set(drag.el, drag);
    }
    // console.log('registerDragItem', dropList?.dragItems);
  }

  removeDragItem(drag: NgxDraggableDirective) {
    let dropList = drag.dropList;
    if (dropList) {
      dropList.dragItems.delete(drag.el);
    }
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
