import { Inject, Injectable, Renderer2, RendererFactory2, RendererStyleFlags2 } from '@angular/core';
import { NgxDropListDirective } from '../directives/ngx-drop-list.directive';
import { IDropEvent } from '../../interfaces/IDropEvent';
import { NgxDraggableDirective } from '../directives/ngx-draggable.directive';
import { DOCUMENT } from '@angular/common';
import { getPointerPosition } from '../../utils/get-position';
import { NgxDragPlaceholderService } from './ngx-placeholder.service';
import { copyEssentialStyles } from '../../utils/clone-style';
import { NgxDragRegisterService } from './ngx-drag-register.service';
import { getFirstLevelDraggables } from '../../utils/element.helper';
import { IPosition } from '../../interfaces/IPosition';

@Injectable({
  providedIn: 'root',
})
export class NgxDragDropService {
  isDragging = false;

  private _activeDragInstances: NgxDraggableDirective[] = [];
  private activeDropList?: NgxDropListDirective;
  dragOverItem?: NgxDraggableDirective;
  private _currentDragRect?: DOMRect;
  private _renderer: Renderer2;
  private _dropEvent: IDropEvent | null = null;
  private dragElementInBody?: HTMLElement;
  /**
   * on drag enter element
   * - add before or after hovered element
   */
  private isAfter = false;
  isRtl = false;
  currentDragPreviousDisplay = '';

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private _document: Document,
    private placeholderService: NgxDragPlaceholderService,
    private dragRegister: NgxDragRegisterService
  ) {
    this._renderer = rendererFactory.createRenderer(null, null);
  }

  startDrag(drag: NgxDraggableDirective) {
    if (!drag.dropList) {
      return;
    }

    this.updateAllDragItemsRect();
    this.activeDropList = drag.dropList;

    this.isDragging = true;
    this.activeDropList.isDragging = true;
    this._currentDragRect = drag.domRect;
    this._activeDragInstances.push(drag);
    let previousIndex = this.getDragItemIndexInDropList(drag);
    this._dropEvent = {
      previousIndex,
      currentIndex: 0,
      container: this.activeDropList,
      item: drag,
      previousContainer: this.activeDropList,
    };
    //  console.log('_dropEvent in drag start', this._dropEvent);
    this.currentDragPreviousDisplay = getComputedStyle(drag.el).display;
    this.dragElementInBody = this._document.createElement(drag.el.tagName);
    copyEssentialStyles(drag.el, this.dragElementInBody);
    this.dragElementInBody.innerHTML = drag.el.innerHTML;
    this.dragElementInBody.className = drag.el.className + ' ngx-drag-in-body';
    this.dragElementInBody.style.display = this.currentDragPreviousDisplay || 'block';
    this.dragElementInBody.style.position = 'absolute';
    this.dragElementInBody.style.top = window.scrollY + this._currentDragRect.top + 'px';
    this.dragElementInBody.style.left = window.scrollX + this._currentDragRect.left + 'px';
    this.dragElementInBody.style.width = this._currentDragRect.width + 'px';
    this.dragElementInBody.style.height = this._currentDragRect.height + 'px';
    this.dragElementInBody.style.pointerEvents = 'none';
    this.dragElementInBody.style.opacity = '0.85';
    this.dragElementInBody.style.boxShadow = '0px 3px 20px rgba(0,0,0,.5)';
    this.dragElementInBody.style.zIndex = '1000';
    this.dragElementInBody.style.transitionProperty = 'none';
    this._document.body.appendChild(this.dragElementInBody);
    if (!drag.dropList.disableSort) {
      this._renderer.setStyle(drag.el, 'display', 'none', RendererStyleFlags2.Important);
    } else {
      this._renderer.setStyle(drag.el, 'transform', 'none', RendererStyleFlags2.Important);
    }

    this.isRtl = getComputedStyle(this.activeDropList.el).direction === 'rtl';
  }

  stopDrag(drag: NgxDraggableDirective) {
    this.isDragging = false;
    if (drag.dropList) drag.dropList.isDragging = false;
    const index = this._activeDragInstances.indexOf(drag);
    if (index > -1) {
      drag.el.style.display = this.currentDragPreviousDisplay;
      this.dragElementInBody?.remove();
      this._activeDragInstances?.forEach((el) => {
        this._renderer.removeStyle(el.el, 'transform');
      });
      this._activeDragInstances.splice(index, 1);

      if (this.placeholderService.isShown) {
        this.droped(drag);
      }
      this.placeholderService.updatePlaceholder$.next({
        currentDrag: drag,
        currentDragRec: drag.domRect,
        dropList: drag.dropList!,
        dragOverItem: this.dragOverItem,
        isAfter: this.isAfter,
        overItemRec: this.dragOverItem?.domRect,
        state: 'hidden',
      });
      this.dragOverItem = undefined;
    }
    this.activeDropList = undefined;
  }

  dragMove(drag: NgxDraggableDirective, ev: MouseEvent | TouchEvent, transform: string) {
    if (!this.dragElementInBody || !this.isDragging) {
      return;
    }
    this._renderer.setStyle(this.dragElementInBody, 'transform', transform);
    const position = getPointerPosition(ev);
    this.dragOverItem = this.findItemUnderPointer(position);
    console.log('drag over item:', this.dragOverItem?.el?.id, 'drop list:', this.activeDropList?.el?.id);
    if (!this.dragOverItem && this.activeDropList) {
      this.placeholderService.updatePlaceholder$.next({
        currentDrag: this._activeDragInstances[0],
        currentDragRec: this._activeDragInstances[0].domRect,
        dropList: this.activeDropList,
        isAfter: this.isAfter,
        dragOverItem: undefined,
        overItemRec: undefined,
        state: 'update',
      });
    }
    if (!this.activeDropList || !this.dragOverItem) return;
    if (this.activeDropList.checkAllowedConnections(this._activeDragInstances[0]?.dropList) == false) {
      return;
    }

    if (this.dragOverItem.dropList?.direction === 'horizontal') {
      const midpoint = this.dragOverItem.domRect.left + this.dragOverItem.domRect.width / 2;
      this.isAfter = this.isRtl ? position.x < midpoint : position.x > midpoint;
    } else {
      let yInEL = position.y - (this.dragOverItem.domRect.top + window.scrollY);
      this.isAfter = yInEL > this.dragOverItem.domRect.height / 2;
    }
    console.log('isAfter', this.isAfter);

    this.placeholderService.updatePlaceholder$.next({
      currentDrag: this._activeDragInstances[0],
      dragOverItem: this.dragOverItem,
      isAfter: this.isAfter,
      currentDragRec: this._currentDragRect!,
      dropList: this.activeDropList,
      overItemRec: this.dragOverItem?.domRect,
      state: 'update',
    });
    //
  }

  droped(drag: NgxDraggableDirective) {
    if (!this._dropEvent || !this.activeDropList) {
      return;
    }
    this._dropEvent.container = this.activeDropList;
    this._dropEvent.currentIndex = this.placeholderService.index;
    // is sorting
    if (this._dropEvent.container == this._dropEvent.previousContainer) {
      // move to up/first
      if (this._dropEvent.previousIndex < this.placeholderService.index) {
        this._dropEvent.currentIndex = this.placeholderService.index - 1;
      }
    }

    this.activeDropList.onDrop(this._dropEvent);
  }

  private getDragItemIndexInDropList(dragItem: NgxDraggableDirective): number {
    const dropList = dragItem.dropList;
    if (!dropList) return 0;
    const dragElements = getFirstLevelDraggables(dropList.el);
    const currentIndex = dragElements.findIndex((el) => el === dragItem.el);
    return currentIndex > -1 ? currentIndex : 0;
  }

  updateAllDragItemsRect() {
    const drpLstElms = Array.from(this._document.querySelectorAll('[ngxDropList]'));
    for (let drp of drpLstElms) {
      const drpDrctv = this.dragRegister.dropList.get(drp);
      if (drpDrctv) {
        drpDrctv.updateDomRect();
        for (let drg of drpDrctv.dragItems) {
          drg.updateDomRect();
        }
      }
    }
  }

  findItemUnderPointer(position: IPosition): NgxDraggableDirective | undefined {
    const pointerX = position.x - window.scrollX;
    const pointerY = position.y - window.scrollY;
    for (const dropList of this.dragRegister.dropListItems) {
      const dropListRect = dropList.domRect;

      if (
        pointerX >= dropListRect.left &&
        pointerX <= dropListRect.right &&
        pointerY >= dropListRect.top &&
        pointerY <= dropListRect.bottom
      ) {
        this.activeDropList = dropList;
      } else {
        continue;
      }

      for (let item of dropList.dragItems) {
        const rect = item.domRect;
        if (pointerX >= rect.left && pointerX <= rect.right && pointerY >= rect.top && pointerY <= rect.bottom) {
          return item; // Pointer داخل این عنصر است
        }
      }
    }
    return undefined; // هیچ عنصری زیر موس نیست
  }
}
