import { Inject, Injectable, Renderer2, RendererFactory2, RendererStyleFlags2 } from '@angular/core';
import { NgxDropListDirective } from '../directives/ngx-drop-list.directive';
import { IDropEvent } from '../../interfaces/IDropEvent';
import { NgxDraggableDirective } from '../directives/ngx-draggable.directive';
import { DOCUMENT } from '@angular/common';
import { getPointerPosition } from '../../utils/get-position';
import { NgxDragPlaceholderService } from './ngx-placeholder.service';
import { copyEssentialStyles } from '../../utils/clone-style';
import { NgxDragRegisterService } from './ngx-drag-register.service';

@Injectable({
  providedIn: 'root',
})
export class NgxDragDropService {
  isDragging = false;

  public _activeDragInstances: NgxDraggableDirective[] = [];
  private _currentDragRect?: DOMRect;
  private _renderer: Renderer2;
  private _dropEvent: IDropEvent | null = null;
  private dragElementInBody?: HTMLElement;
  /**
   * on drag enter element
   * - add before or after hovered element
   */
  private isAfter = false;
  private dragOverItem?: NgxDraggableDirective;
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
    const dropList = drag.dropList;

    this.isDragging = true;
    dropList.isDragging = true;
    this._currentDragRect = drag.el.getBoundingClientRect();
    this._activeDragInstances.push(drag);
    let previousIndex = this.getDragItemIndexInDropList(drag);
    this._dropEvent = {
      previousIndex,
      currentIndex: 0,
      container: dropList,
      item: drag,
      previousContainer: dropList,
    };
    //  console.log('_dropEvent in drag start', this._dropEvent);
    const dragElRec = drag.el.getBoundingClientRect();
    this.currentDragPreviousDisplay = getComputedStyle(drag.el).display;
    this._renderer.setStyle(drag.el, 'display', 'none', RendererStyleFlags2.Important);
    this.dragElementInBody = this._document.createElement(drag.el.tagName);
    copyEssentialStyles(drag.el, this.dragElementInBody);
    this.dragElementInBody.innerHTML = drag.el.innerHTML;
    this.dragElementInBody.className = drag.el.className + ' ngx-drag-drop';
    this.dragElementInBody.style.display = this.currentDragPreviousDisplay || 'block';
    this.dragElementInBody.style.position = 'absolute';
    this.dragElementInBody.style.top = window.scrollY + dragElRec.top + 'px';
    this.dragElementInBody.style.left = window.scrollX + dragElRec.left + 'px';
    this.dragElementInBody.style.width = dragElRec.width + 'px';
    this.dragElementInBody.style.height = dragElRec.height + 'px';
    this.dragElementInBody.style.pointerEvents = 'none';
    this.dragElementInBody.style.opacity = '0.85';
    this.dragElementInBody.style.boxShadow = '0px 5px 40px rgba(0,0,0,.5)';
    this._document.body.appendChild(this.dragElementInBody);

    this.isRtl = getComputedStyle(dropList.el).direction === 'rtl';
    if (!this.dragOverItem) {
      this.dragOverItem = this.getNextOrPreviousDragItem(drag);
    }
    this.placeholderService.updatePlaceholderPosition$.next({
      currentDrag: drag,
      dropList: dropList,
      isAfter: false,
      currentDragRec: this._currentDragRect,
      overItemRec: this.dragOverItem?.el.getBoundingClientRect(),
      dragOverItem: this.dragOverItem,
    });
  }

  stopDrag(drag: NgxDraggableDirective) {
    this.isDragging = false;
    if (drag.dropList) drag.dropList.isDragging = true;
    this.dragOverItem = undefined;
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
      this.placeholderService.hidePlaceholder();
    }
  }

  enterDrag(drag: NgxDraggableDirective) {
    //console.log('enter', drag.el.id);
    this.dragOverItem = drag;
    // this.initDrag(drag);
  }

  leaveDrag(drag: NgxDraggableDirective) {
    this.dragOverItem = undefined;
    //console.log('leave', drag.el.id);
  }

  dragMove(drag: NgxDraggableDirective, ev: MouseEvent | TouchEvent) {
    if (!this.dragElementInBody || !this.isDragging) {
      return;
    }
    let dragOverItemRec;
    this._renderer.setStyle(this.dragElementInBody, 'transform', drag.el.style.transform);
    if (this.dragOverItem) {
      const position = getPointerPosition(ev);
      dragOverItemRec = this.dragOverItem.el.getBoundingClientRect();
      if (this.dragOverItem.dropList?.direction === 'horizontal') {
        const midpoint = dragOverItemRec.left + dragOverItemRec.width / 2;
        this.isAfter = this.isRtl ? position.x < midpoint : position.x > midpoint;
      } else {
        let yInEL = position.y - (dragOverItemRec.top + window.scrollY);
        this.isAfter = yInEL > dragOverItemRec.height / 2;
      }
    }
    // init drag drop
    const dropList = this.getClosestDropList(ev);
    // console.log('getClosestDropList', dropList?.el?.id, 'dragover', this.dragOverItem);
    if (!dropList || this.checkAllowedConnections(dropList) == false) {
      return;
    }

    this.placeholderService.updatePlaceholderPosition$.next({
      currentDrag: this._activeDragInstances[0],
      dragOverItem: this.dragOverItem,
      isAfter: this.isAfter,
      currentDragRec: this._currentDragRect!,
      dropList: dropList,
      overItemRec: dragOverItemRec,
    });
  }

  droped(drag: NgxDraggableDirective) {
    if (!this._dropEvent || !this.placeholderService.activeDropList) {
      return;
    }
    this._dropEvent.container = this.placeholderService.activeDropList;
    this._dropEvent.currentIndex = this.placeholderService.index;
    // is sorting
    if (this._dropEvent.container == this._dropEvent.previousContainer) {
      // move to up/first
      if (this._dropEvent.previousIndex < this.placeholderService.index) {
        this._dropEvent.currentIndex = this.placeholderService.index - 1;
      }
    }

    this.placeholderService.activeDropList.onDrop(this._dropEvent);
  }

  private getClosestDropList(ev: MouseEvent | TouchEvent): NgxDropListDirective | undefined {
    const { x, y } = getPointerPosition(ev);
    let elements: Element[] = document
      .elementsFromPoint(x - window.scrollX, y - window.scrollY)
      .filter((x) => x.hasAttribute('NgxDropList'));
    if (elements.length > 0) {
      let found = this.dragRegister.dropList.get(elements[0]);
      return found;
    }
    return undefined;
  }

  private getDragItemIndexInDropList(dragItem: NgxDraggableDirective): number {
    const dropList = dragItem.dropList;
    if (!dropList) return 0;
    const dragElements = Array.from(dropList.el.querySelectorAll(':scope > .ngx-draggable'));
    const currentIndex = dragElements.findIndex((el) => el === dragItem.el);
    return currentIndex;
  }

  checkAllowedConnections(dropList: NgxDropListDirective): boolean {
    let currentDropList = this._activeDragInstances[0]?.dropList;
    dropList.el.style.cursor = dropList.initCursor;
    if (currentDropList && currentDropList.connectedTo.length > 0 && currentDropList.el !== dropList.el) {
      const found = currentDropList.connectedTo.indexOf(dropList.el) > -1;
      if (!found) {
        dropList.el.style.cursor = 'no-drop';
      }
      return found;
    }
    return true;
  }

  getNextOrPreviousDragItem(dragItem: NgxDraggableDirective): NgxDraggableDirective | undefined {
    const dropList = dragItem.dropList;
    if (!dropList) return undefined;
    const dragElements = Array.from(dropList.el.querySelectorAll(':scope > .ngx-draggable'));
    if (dragElements.length < 1) {
      return undefined;
    }
    const currentIndex = dragElements.findIndex((el) => el === dragItem.el);
    let nextElOrPreviousEl;
    if (dragElements[currentIndex + 1]) {
      nextElOrPreviousEl = dragElements[currentIndex + 1];
    } else {
      nextElOrPreviousEl = dragElements[currentIndex - 1];
    }
    return dropList.dragItems.get(nextElOrPreviousEl);
  }
}
