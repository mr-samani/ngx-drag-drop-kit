import { Inject, Injectable, Renderer2, RendererFactory2, RendererStyleFlags2 } from '@angular/core';
import { NgxDropListDirective } from '../directives/ngx-drop-list.directive';
import { IDropEvent } from '../../interfaces/IDropEvent';
import { NgxDraggableDirective } from '../directives/ngx-draggable.directive';
import { DOCUMENT } from '@angular/common';
import { getPointerPosition, getPointerPositionOnViewPort } from '../../utils/get-position';
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
    this.sortDragItems();
    this.activeDropList = drag.dropList;
    this.isDragging = true;
    this.activeDropList.isDragging = true;
    this._currentDragRect = drag.domRect;
    this._activeDragInstances.push(drag);
    let previousIndex = this.getDragItemIndexInDropList(drag);
    // console.log('previousIndex', previousIndex);
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
    const position = getPointerPositionOnViewPort(ev);
    this.dragOverItem = this.findItemUnderPointer(position);
    console.log(
      'drag over item:',
      this.dragOverItem?.el?.id,
      'drop list:',
      this.activeDropList?.el?.id,
      'this.isAfter',
      this.isAfter
    );
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
      const midpoint = this.dragOverItem.elPositionOfPage.left + this.dragOverItem.elPositionOfPage.width / 2;
      this.isAfter = this.isRtl ? position.x + scrollX < midpoint : position.x + window.scrollX > midpoint;
    } else {
      let yInEL = position.y + window.scrollY - this.dragOverItem.elPositionOfPage.top;
      this.isAfter = yInEL > this.dragOverItem.elPositionOfPage.height / 2;
    }
    // console.log('isAfter', this.isAfter);

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
    for (const dropList of this.dragRegister.dropListItems) {
      if (dropList.el.offsetParent === null) continue; // یعنی hidden هست
      dropList.updateDomRect();
      dropList.dragItems.forEach((item) => {
        if (item.el.offsetParent === null) return; // hidden item
        item.updateDomRect();
      });
    }
  }

  sortDragItems() {
    for (const dropList of this.dragRegister.dropListItems) {
      dropList.dragItems = dropList.dragItems.sort((a, b) => {
        if (a.elPositionOfPage.top !== b.elPositionOfPage.top) return a.elPositionOfPage.top - b.elPositionOfPage.top;
        return a.elPositionOfPage.left - b.elPositionOfPage.left;
      });
    }
  }
  findItemUnderPointer(position: IPosition): NgxDraggableDirective | undefined {
    const x = position.x + window.scrollX;
    const y = position.y + window.scrollY;

    for (const dropList of this.dragRegister.dropListItems) {
      const r = dropList.elPositionOfPage;
      const left = r.left,
        right = r.right,
        top = r.top,
        bottom = r.bottom;

      if (x >= left && x <= right && y >= top && y <= bottom) {
        this.activeDropList = dropList;

        for (const item of dropList.dragItems) {
          const ir = item.elPositionOfPage;
          const l = ir.left,
            rt = ir.right,
            tp = ir.top,
            bt = ir.bottom;
          if (x >= l && x <= rt && y >= tp && y <= bt) return item;
        }

        if (dropList.dragItems.length) {
          return dropList.dragItems[dropList.dragItems.length - 1];
        }
      }
    }
    return undefined;
  }
}
