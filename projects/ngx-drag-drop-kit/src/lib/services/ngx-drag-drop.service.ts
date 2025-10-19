import { Inject, Injectable, Renderer2, RendererFactory2, RendererStyleFlags2 } from '@angular/core';
import { IDropEvent } from '../../interfaces/IDropEvent';
import { DOCUMENT } from '@angular/common';
import { getPointerPositionOnViewPort } from '../../utils/get-position';
import { NgxDragPlaceholderService } from './ngx-placeholder.service';
import { copyEssentialStyles } from '../../utils/clone-style';
import { NgxDragRegisterService } from './ngx-drag-register.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { Subject } from 'rxjs/internal/Subject';
import { fromEvent } from 'rxjs/internal/observable/fromEvent';
import { throttleTime } from 'rxjs/internal/operators/throttleTime';
import { IPosition } from '../../interfaces/IPosition';
import { IDropList } from '../../interfaces/IDropList';
import { findScrollableToParents } from '../../utils/findScrollableElement';
import { DragItemRef } from '../directives/DragItemRef';

@Injectable({
  providedIn: 'root',
})
export class NgxDragDropService {
  isDragging = false;

  private _activeDragInstances: DragItemRef[] = [];
  private activeDropList?: IDropList;
  private _renderer: Renderer2;
  private _dropEvent: IDropEvent | null = null;
  private dragElementInBody?: HTMLElement;

  isRtl = false;
  currentDragPreviousDisplay = '';
  scrollableParents: HTMLElement[] = [];

  private scrollSubscription: Subscription | null = null;
  private rectUpdateSubject = new Subject<void>();

  private _previousDragIndex = 0;
  private _newIndex = 0;

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private _document: Document,
    private placeholderService: NgxDragPlaceholderService,
    private dragRegister: NgxDragRegisterService
  ) {
    this._renderer = rendererFactory.createRenderer(null, null);
  }

  startDrag(drag: DragItemRef) {
    if (!drag.dropList) {
      return;
    }
    this.activeDropList = drag.dropList;

    this.isDragging = true;
    this.activeDropList.dragging = true;
    this.dragRegister.updateAllDragItemsRect();
    const currDomRect = drag.domRect;
    this._activeDragInstances.push(drag);
    this._previousDragIndex = this.dragRegister.getDragItemIndex(drag);
    this._dropEvent = {
      previousIndex: this._previousDragIndex,
      currentIndex: 0,
      container: this.activeDropList,
      item: drag,
      previousContainer: this.activeDropList,
    };
    //  console.log('_dropEvent in drag start', this._dropEvent);
    this.currentDragPreviousDisplay = getComputedStyle(drag.el).display;
    drag.el.classList.add('dragging');
    this.dragElementInBody = drag.el.cloneNode(true) as HTMLElement;
    copyEssentialStyles(drag.el, this.dragElementInBody);
    this.dragElementInBody.innerHTML = drag.el.innerHTML;
    this.dragElementInBody.className = drag.el.className + ' ngx-drag-in-body';
    this.dragElementInBody.style.display = this.currentDragPreviousDisplay || 'block';
    this.dragElementInBody.style.position = 'absolute';
    this.dragElementInBody.style.top = window.scrollY + currDomRect.top + 'px';
    this.dragElementInBody.style.left = window.scrollX + currDomRect.left + 'px';
    this.dragElementInBody.style.width = currDomRect.width + 'px';
    this.dragElementInBody.style.height = currDomRect.height + 'px';
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
    this.setupScrollListeners();
    this.placeholderService.createPlaceholder(this.activeDropList, this._activeDragInstances[0]);
  }

  dragMove(drag: DragItemRef, ev: MouseEvent | TouchEvent, transform: string) {
    if (!this.dragElementInBody || !this.isDragging || !this._activeDragInstances[0].dropList) {
      return;
    }
    this._renderer.setStyle(this.dragElementInBody, 'transform', transform);
    const viewportPointer = getPointerPositionOnViewPort(ev);
    const dropList = this.dragRegister._getDropListFromPointerPosition(viewportPointer);
    // console.log('Active Drop List:', dropList?.el?.id);
    if (!dropList) {
      return;
    }
    if (dropList.checkAllowedConnections(this._activeDragInstances[0]?.dropList) == false) {
      return;
    }
    const isVertical = dropList.direction === 'vertical';
    const dragOverData = this.dragRegister._getItemIndexFromPointerPosition(
      dropList,
      drag,
      viewportPointer,
      isVertical
    );
    if (dragOverData.index > -1) {
      this._newIndex = dragOverData.index;
    }
    const dragOverItem = dragOverData.dragItem;

    if (this.activeDropList !== dropList) {
      const overDragItem = this.dragRegister._getDragItemFromPointerPosition(
        dropList.dragItems,
        viewportPointer,
        isVertical
      );
      this.activeDropList = dropList;
      this.placeholderService.createPlaceholder(dropList, this._activeDragInstances[0], overDragItem);
    }
    this.placeholderService.updatePlaceholder$.next({
      dragItem: this._activeDragInstances[0],
      dragOverItem: dragOverItem,
      sourceDropList: this._activeDragInstances[0].dropList,
      destinationDropList: this.activeDropList,
      newIndex: this._newIndex,
      isAfter: dragOverData.isAfter,
    });
  }
  stopDrag(drag: DragItemRef) {
    this.isDragging = false;
    //const currentIndex = this.activeDropList?.isFlexWrap ? this.placeholderService.state.index : this._newIndex;
    const currentIndex = this._newIndex;

    if (drag.dropList) drag.dropList.dragging = false;
    this.dragRegister.dargItems.forEach((d) => {
      // this._renderer.setStyle(d.el, 'transition-property', 'none');
      // this._renderer.removeStyle(d.el, 'transform');
      this._renderer.removeStyle(d.el, 'transition');
    });
    this.dragElementInBody?.remove();
    this.placeholderService.hide(this.activeDropList);

    const index = this._activeDragInstances.indexOf(drag);
    if (index > -1) {
      this._activeDragInstances?.forEach((el) => {
        this._renderer.removeStyle(el.el, 'transform');
        this._renderer.removeStyle(el.el, 'display');
      });

      if (this._dropEvent && this.activeDropList) {
        this._dropEvent.container = this.activeDropList;
        this._dropEvent.currentIndex = currentIndex > 0 ? currentIndex : 0;
        this.activeDropList.onDrop(this._dropEvent);
      }
      this._activeDragInstances.splice(index, 1);
    }
    this.activeDropList = undefined;
    this.scrollSubscription?.unsubscribe();
    this.scrollSubscription = null;
    this.scrollableParents = [];
    this._previousDragIndex = 0;
    this._newIndex = 0;
  }

  // Setup scroll listeners with throttling
  private setupScrollListeners() {
    this.scrollableParents = findScrollableToParents(
      this._document,
      this.dragRegister.dropListItems.map((item) => item.el)
    );
    console.log('scrollableParents:', this.scrollableParents);
    if (this.scrollSubscription) return;

    this.scrollSubscription = fromEvent(this.scrollableParents, 'scroll')
      .pipe(throttleTime(16, undefined, { leading: true, trailing: true }))
      .subscribe(() => {
        this.rectUpdateSubject.next();
      });

    this.rectUpdateSubject
      .pipe(throttleTime(16, undefined, { leading: true, trailing: true }))
      .subscribe(() => this.dragRegister.updateAllDragItemsRect());
  }

  /**
   *
   * @param pointer view port pointer (clientX,clientY)
   */
  getPointerElement(pointer: IPosition) {
    let pe = document.querySelector('.ngxpointer');
    if (!pe) return;
    let x = pointer.x + window.scrollX;
    let y = pointer.y + window.scrollY;
    pe!.innerHTML = `${x},${y}(${pointer.x},${pointer.y})`;
    this._renderer.setStyle(pe, 'transform', `translate3d(${x}px,${y}px,0)`);
  }
}
