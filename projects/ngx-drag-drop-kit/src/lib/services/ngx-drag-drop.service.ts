import { Inject, Injectable, Renderer2, RendererFactory2, RendererStyleFlags2 } from '@angular/core';
import { IDropEvent, NgxDropListDirective } from '../directives/ngx-drop-list.directive';
import { NgxDraggableDirective } from '../directives/ngx-draggable.directive';
import { getXYfromTransform } from '../../utils/get-transform';
import { DOCUMENT } from '@angular/common';
import { getPointerPosition } from '../../utils/get-position';
import { NgxPlaceholderService } from './ngx-placeholder.service';

@Injectable()
export class NgxDragDropService {
  isDragging = false;

  _dropList = new Set<NgxDropListDirective>();
  private _activeDragInstances: NgxDraggableDirective[] = [];
  private _activeDragDomRect?: DOMRect;
  private _activeDropListInstances?: NgxDropListDirective;
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
    private placeholderService: NgxPlaceholderService
  ) {
    this._renderer = rendererFactory.createRenderer(null, null);
  }

  startDrag(drag: NgxDraggableDirective) {
    this.isDragging = true;
    this._activeDragDomRect = drag.el.getBoundingClientRect();
    this._activeDragInstances.push(drag);

    let previousIndex = 0;
    if (!this._activeDropListInstances || !this._activeDragInstances.length) return;
    this._activeDropListInstances.dragging = true;
    this._activeDropListInstances._draggables?.forEach((el, i) => {
      if (el.el == drag.el) {
        previousIndex = i;
      }
    });
    this._dropEvent = {
      previousIndex,
      currentIndex: 0,
      container: this._activeDropListInstances,
      item: drag,
      previousContainer: this._activeDropListInstances,
    };

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
    this.placeholderService.showPlaceholder({
      currentDrag: this._activeDragInstances[0],
      isAfter: this.isAfter,
      activeDragDomRec: this._activeDragDomRect,
      dropList: this._activeDropListInstances,
    });
    this.initDrag(drag);
  }

  stopDrag(drag: NgxDraggableDirective) {
    this.isDragging = false;
    const index = this._activeDragInstances.indexOf(drag);
    if (index > -1) {
      drag.el.style.display = '';
      this.dragElementInBody?.remove();
      if (this._activeDropListInstances) {
        this.placeholderService.hidePlaceholder();
        this._activeDropListInstances._draggables?.forEach((el) => {
          this._renderer.removeStyle(el.el, 'transform');
        });
      }
      this._activeDragInstances?.forEach((el) => {
        this._renderer.removeStyle(el.el, 'transform');
      });
      this._activeDragInstances.splice(index, 1);

      this.droped(drag);
    }
  }

  enterDropList(drop: NgxDropListDirective) {
    this._activeDropListInstances = drop;
    this.dragOverItem = undefined;
    if (!this.isDragging) return;
    if (!this._activeDropListInstances || !this._activeDragInstances.length) return;
    this.placeholderService.updatePlaceholderPosition$.next({
      currentDrag: this._activeDragInstances[0],
      isAfter: this.isAfter,
      activeDragDomRec: this._activeDragDomRect,
      dropList: this._activeDropListInstances,
    });
  }
  leaveDropList(drop: NgxDropListDirective) {
    if (this._activeDropListInstances) {
      this.placeholderService.hidePlaceholder();
      this._activeDropListInstances = undefined;
    }
  }

  enterDrag(drag: NgxDraggableDirective) {
    //  console.log('enter', drag.el);
    this.dragOverItem = drag;
    this.initDrag(drag);
  }

  leaveDrag(drag: NgxDraggableDirective) {
    this.dragOverItem = undefined;
    // console.log('leave', drag.el);
  }

  // prettier-ignore
  dragMove(drag: NgxDraggableDirective, ev: MouseEvent | TouchEvent) {
    if (!this._activeDragInstances.length || !this.dragElementInBody) return;
    this._renderer.setStyle(this.dragElementInBody,'transform',drag.el.style.transform);
    if(this.dragOverItem){
        const position = getPointerPosition(ev);
        let yInEL = position.y - this.dragOverItem.el.getBoundingClientRect().top;
        this.isAfter =yInEL > this.dragOverItem.el.getBoundingClientRect().height / 2;
       this.initDrag(this.dragOverItem);
    }
  }

  registerDropList(dropList: NgxDropListDirective) {
    this._dropList.add(dropList);
    // console.log(this._dropList);
  }

  private initDrag(enteredDrag: NgxDraggableDirective) {
    if (!this._activeDropListInstances || !this._activeDragInstances.length) return;
    this.placeholderService.updatePlaceholderPosition$.next({
      currentDrag: this._activeDragInstances[0],
      enteredDrag,
      isAfter: this.isAfter,
      activeDragDomRec: this._activeDragDomRect,
      dropList: this._activeDropListInstances,
    });
  }

  droped(drag: NgxDraggableDirective) {
    if (!this._dropEvent || !this._activeDropListInstances) return;
    this._dropEvent.container = this._activeDropListInstances;

    this._dropEvent.currentIndex = this.placeholderService._placeHolderIndex;
    this._activeDropListInstances.onDrop(this._dropEvent);
    this._activeDropListInstances.dragging = false;
  }
}
