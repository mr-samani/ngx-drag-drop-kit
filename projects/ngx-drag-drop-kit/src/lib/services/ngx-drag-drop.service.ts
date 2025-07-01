import { Inject, Injectable, Renderer2, RendererFactory2, RendererStyleFlags2 } from '@angular/core';
import { NgxDropListDirective } from '../directives/ngx-drop-list.directive';
import { IDropEvent } from '../../models/IDropEvent';
import { NgxDraggableDirective } from '../directives/ngx-draggable.directive';
import { DOCUMENT } from '@angular/common';
import { getPointerPosition } from '../../utils/get-position';
import { NgxDragPlaceholderService } from './ngx-placeholder.service';

@Injectable({
  providedIn: 'root',
})
export class NgxDragDropService {
  isDragging = false;

  _dropList = new Set<NgxDropListDirective>();
  private _activeDragInstances: NgxDraggableDirective[] = [];
  private _activeDragDomRect?: DOMRect;
  private _renderer: Renderer2;
  private _dropEvent: IDropEvent | null = null;
  private dragElementInBody?: HTMLElement;
  /**
   * on drag enter element
   * - add before or after hovered element
   */
  private isAfter = true;
  private dragOverItem?: NgxDraggableDirective;
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
    this._activeDragDomRect = drag.el.getBoundingClientRect();
    this._activeDragInstances.push(drag);
    let previousIndex = 0;
    drag.containerDropList?._draggables?.forEach((el, i) => {
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
    this.dragElementInBody.innerHTML = drag.el.innerHTML;
    this.dragElementInBody.className = drag.el.className + ' ngx-drag-drop';
    this.dragElementInBody.style.display = 'block';
    this.dragElementInBody.style.position = 'absolute';
    this.dragElementInBody.style.top = window.scrollY + dragElRec.top + 'px';
    this.dragElementInBody.style.left = window.scrollX + dragElRec.left + 'px';
    this.dragElementInBody.style.width = dragElRec.width + 'px';
    this.dragElementInBody.style.height = dragElRec.height + 'px';
    this.dragElementInBody.style.pointerEvents = 'none';
    this._document.body.appendChild(this.dragElementInBody);
    if (drag.containerDropList.disableSort == false) {
      this.placeholderService.showPlaceholder({
        currentDrag: this._activeDragInstances[0],
        isAfter: this.isAfter,
        activeDragDomRec: this._activeDragDomRect,
        dropList: drag.containerDropList,
        direction: drag.containerDropList.direction,
      });
    }
    this.initDrag(drag);
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

  enterDropList(drop: NgxDropListDirective) {
    //TODO:  این خط توی ایتم های تو در تو مشکل داره  اگر نباشه  باشه هم قبلش نمیره
    //  this.dragOverItem = undefined;
    if (!this.isDragging) return;
    this.placeholderService.updatePlaceholderPosition$.next({
      currentDrag: this._activeDragInstances[0],
      isAfter: this.isAfter,
      activeDragDomRec: this._activeDragDomRect,
      dropList: drop,
      direction: drop.direction,
    });
  }
  leaveDropList(drop: NgxDropListDirective) {
    this.placeholderService.hidePlaceholder();
  }

  enterDrag(drag: NgxDraggableDirective) {
    //console.log('enter', drag.el.id);
    this.dragOverItem = drag;
    this.initDrag(drag);
  }

  leaveDrag(drag: NgxDraggableDirective) {
    this.dragOverItem = undefined;
    //console.log('leave', drag.el.id);
  }

  dragMove(drag: NgxDraggableDirective, ev: MouseEvent | TouchEvent) {
    if (!this._activeDragInstances.length || !this.dragElementInBody) {
      return;
    }
    this._renderer.setStyle(this.dragElementInBody, 'transform', drag.el.style.transform);
    if (this.dragOverItem) {
      const position = getPointerPosition(ev);
      const dragOverItemRec = this.dragOverItem.el.getBoundingClientRect();

      if (this.dragOverItem.containerDropList?.direction === 'horizontal') {
        let xInEL = position.x - (dragOverItemRec.left + window.scrollX);
        this.isAfter = xInEL > dragOverItemRec.width / 2;
      } else {
        let yInEL = position.y - (dragOverItemRec.top + window.scrollY);
        this.isAfter = yInEL > dragOverItemRec.height / 2;
      }
      this.initDrag(this.dragOverItem);
    }
  }

  registerDropList(dropList: NgxDropListDirective) {
    this._dropList.add(dropList);
    // console.log(this._dropList);
  }

  private initDrag(dragOverItem: NgxDraggableDirective) {
    if (!this.isDragging || !dragOverItem.containerDropList) {
      return;
    }
    this.placeholderService.updatePlaceholderPosition$.next({
      currentDrag: this._activeDragInstances[0],
      dragOverItem,
      isAfter: this.isAfter,
      activeDragDomRec: this._activeDragDomRect,
      dropList: dragOverItem.containerDropList,
      direction: dragOverItem.containerDropList.direction,
    });
  }

  droped(drag: NgxDraggableDirective) {
    if (!this._dropEvent || !this.placeholderService._activeDropListInstances) {
      return;
    }
    this._dropEvent.container = this.placeholderService._activeDropListInstances;
    this._dropEvent.currentIndex = this.placeholderService._placeHolderIndex;
    this.placeholderService._activeDropListInstances.onDrop(this._dropEvent);
  }
}
