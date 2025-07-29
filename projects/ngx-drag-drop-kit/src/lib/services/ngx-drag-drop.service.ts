import { Inject, Injectable, Renderer2, RendererFactory2, RendererStyleFlags2 } from '@angular/core';
import { NgxDropListDirective } from '../directives/ngx-drop-list.directive';
import { IDropEvent } from '../../interfaces/IDropEvent';
import { NgxDraggableDirective } from '../directives/ngx-draggable.directive';
import { DOCUMENT } from '@angular/common';
import { getPointerPosition } from '../../utils/get-position';
import { NgxDragPlaceholderService } from './ngx-placeholder.service';
import { copyEssentialStyles } from '../../utils/clone-style';

@Injectable({
  providedIn: 'root',
})
export class NgxDragDropService {
  isDragging = false;

  _dropList = new WeakMap<Element, NgxDropListDirective>();
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
  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private _document: Document,
    private placeholderService: NgxDragPlaceholderService
  ) {
    this._renderer = rendererFactory.createRenderer(null, null);
  }

  startDrag(drag: NgxDraggableDirective) {
    if (!drag.containerDropList) {
      return;
    }
    this.isDragging = true;
    drag.containerDropList.isDragging = true;
    this._currentDragRect = drag.el.getBoundingClientRect();
    this._activeDragInstances.push(drag);
    let previousIndex = 0;
    drag.containerDropList._draggables?.forEach((el, i) => {
      if (el.el == drag.el) {
        previousIndex = i;
      }
    });
    this._dropEvent = {
      previousIndex,
      currentIndex: 0,
      container: drag.containerDropList,
      item: drag,
      previousContainer: drag.containerDropList,
    };
    //  console.log('_dropEvent in drag start', this._dropEvent);
    const dragElRec = drag.el.getBoundingClientRect();
    this._renderer.setStyle(drag.el, 'display', 'none', RendererStyleFlags2.Important);
    this.dragElementInBody = this._document.createElement(drag.el.tagName);
    copyEssentialStyles(drag.el, this.dragElementInBody);
    this.dragElementInBody.innerHTML = drag.el.innerHTML;
    this.dragElementInBody.className = drag.el.className + ' ngx-drag-drop';
    this.dragElementInBody.style.display = 'block';
    this.dragElementInBody.style.position = 'absolute';
    this.dragElementInBody.style.top = window.scrollY + dragElRec.top + 'px';
    this.dragElementInBody.style.left = window.scrollX + dragElRec.left + 'px';
    this.dragElementInBody.style.width = dragElRec.width + 'px';
    this.dragElementInBody.style.height = dragElRec.height + 'px';
    this.dragElementInBody.style.pointerEvents = 'none';
    this.dragElementInBody.style.opacity = '0.8';
    this._document.body.appendChild(this.dragElementInBody);
    if (drag.containerDropList._draggables)
      this.dragOverItem = drag.containerDropList._draggables.get(previousIndex + 1);
    this.isRtl = getComputedStyle(drag.containerDropList.el).direction === 'rtl';
    this.placeholderService.updatePlaceholderPosition$.next({
      currentDrag: drag,
      dropList: drag.containerDropList,
      isAfter: false,
      currentDragRec: this._currentDragRect,
      overItemRec: this.dragOverItem?.el.getBoundingClientRect(),
      dragOverItem: this.dragOverItem,
    });
  }

  stopDrag(drag: NgxDraggableDirective) {
    this.isDragging = false;
    if (drag.containerDropList) drag.containerDropList.isDragging = true;
    const index = this._activeDragInstances.indexOf(drag);
    if (index > -1) {
      drag.el.style.display = '';
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
      if (this.dragOverItem.containerDropList?.direction === 'horizontal') {
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

  registerDropList(dropList: NgxDropListDirective) {
    this._dropList.set(dropList.el, dropList);
    // console.log(this._dropList);
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
      let found = this._dropList.get(elements[0]);
      return found;
    }
    return undefined;
  }

  checkAllowedConnections(dropList: NgxDropListDirective): boolean {
    let currentDragItem = this._activeDragInstances[0];
    dropList.el.style.cursor = dropList.initCursor;
    if (
      currentDragItem &&
      currentDragItem.containerDropList &&
      currentDragItem.containerDropList.connectedTo.length > 0 &&
      currentDragItem.containerDropList.el !== dropList.el
    ) {
      const found = currentDragItem.containerDropList.connectedTo.indexOf(dropList.el) > -1;
      if (!found) {
        dropList.el.style.cursor = 'no-drop';
      }
      return found;
    }
    return true;
  }
}
