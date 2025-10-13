import { Inject, Injectable, Renderer2, RendererFactory2, RendererStyleFlags2 } from '@angular/core';
import { IDropEvent } from '../../interfaces/IDropEvent';
import { NgxDraggableDirective } from '../directives/ngx-draggable.directive';
import { DOCUMENT } from '@angular/common';
import { getPointerPosition, getPointerPositionOnViewPort } from '../../utils/get-position';
import { NgxDragPlaceholderService } from './ngx-placeholder.service';
import { copyEssentialStyles } from '../../utils/clone-style';
import { NgxDragRegisterService } from './ngx-drag-register.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { Subject } from 'rxjs/internal/Subject';
import { fromEvent } from 'rxjs/internal/observable/fromEvent';
import { throttleTime } from 'rxjs/internal/operators/throttleTime';
import { IPosition } from '../../interfaces/IPosition';
import { IDropList } from '../../interfaces/IDropList';

@Injectable({
  providedIn: 'root',
})
export class NgxDragDropService {
  isDragging = false;

  private _activeDragInstances: NgxDraggableDirective[] = [];
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

  startDrag(drag: NgxDraggableDirective) {
    if (!drag.dropList) {
      return;
    }
    this.activeDropList = drag.dropList;

    this.dragRegister.updateAllDragItemsRect();
    this.sortDragItems();

    this.isDragging = true;
    this.activeDropList.dragging = true;
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

  dragMove(drag: NgxDraggableDirective, ev: MouseEvent | TouchEvent, transform: string) {
    if (!this.dragElementInBody || !this.isDragging) {
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
    let i = this.dragRegister._getItemIndexFromPointerPosition(
      dropList.dragItems,
      drag.el,
      viewportPointer,
      isVertical,
      this._newIndex
    );
    console.log('newIndex:', i, 'previousIndex:', this._previousDragIndex);
    this._newIndex = i;
    if (this.activeDropList !== dropList) {
      this.activeDropList = dropList;
      this.placeholderService.createPlaceholder(
        dropList,
        this._activeDragInstances[0],
        this.dragRegister._getDragItemFromIndex(dropList, this._newIndex),
        false
      );
    }
    // this.placeholderService.updatePlaceholder$.next({
    //   dragItem: this._activeDragInstances[0],
    //   destinationDropList: this.activeDropList,
    //   newIndex: this._newIndex,
    //   previousIndex: this._previousDragIndex,
    // });
  }
  stopDrag(drag: NgxDraggableDirective) {
    this.isDragging = false;
    if (drag.dropList) drag.dropList.dragging = false;
    // this.dragRegister.dargItems.forEach((d) => {
    //   this._renderer.setStyle(d.el, 'transition-property', 'none');
    //   this._renderer.removeStyle(d.el, 'transform');
    // });

    const index = this._activeDragInstances.indexOf(drag);
    if (index > -1) {
      this.placeholderService.hide(this.activeDropList);
      this.dragElementInBody?.remove();
      this._activeDragInstances?.forEach((el) => {
        this._renderer.removeStyle(el.el, 'transform');
        this._renderer.removeStyle(el.el, 'display');
      });
      this._activeDragInstances.splice(index, 1);

      if (this._dropEvent && this.activeDropList) {
        this._dropEvent.container = this.activeDropList;
        this._dropEvent.currentIndex = this._newIndex;
        this.activeDropList.onDrop(this._dropEvent);
      }
    }
    this.activeDropList = undefined;
    this.scrollSubscription?.unsubscribe();
    this.scrollSubscription = null;
    this.scrollableParents = [];
    this._previousDragIndex = 0;
    this._newIndex = 0;
  }

  private sortDragItems() {
    for (const dropList of this.dragRegister.dropListItems) {
      dropList.dragItems = dropList.dragItems.sort((a, b) => {
        if (a.domRect.top !== b.domRect.top) return a.domRect.top - b.domRect.top;
        return a.domRect.left - b.domRect.left;
      });
    }
  }

  // Find all scrollable parents
  private updateScrollableParents() {
    this.scrollableParents = [];
    this.dragRegister.dropListItems.forEach((target) => {
      let parent: HTMLElement | null = target.el;
      while (parent) {
        const style = window.getComputedStyle(parent);
        if (
          style.overflow === 'auto' ||
          style.overflow === 'scroll' ||
          style.overflowY === 'auto' ||
          style.overflowY === 'scroll' ||
          style.overflowX === 'auto' ||
          style.overflowX === 'scroll'
        ) {
          if (!this.scrollableParents.includes(parent)) {
            this.scrollableParents.push(parent);
          }
        }
        parent = parent.parentElement;
      }
    });
    // console.log('scrollableParents:', this.scrollableParents);
  }

  // Setup scroll listeners with throttling
  private setupScrollListeners() {
    this.updateScrollableParents();
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
    this._renderer.setStyle(pe, 'transform', `translate(${x}px,${y}px)`);
  }
}
