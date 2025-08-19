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
import { Subscription } from 'rxjs/internal/Subscription';
import { Subject } from 'rxjs/internal/Subject';
import { fromEvent } from 'rxjs/internal/observable/fromEvent';
import { throttleTime } from 'rxjs/internal/operators/throttleTime';
import { IPosition } from '../../interfaces/IPosition';
import { getXYfromTransform } from '../../utils/get-transform';
import { Observable } from 'rxjs';

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
 
  isRtl = false;
  currentDragPreviousDisplay = '';
  scrollableParents: HTMLElement[] = [];

  private scrollSubscription: Subscription | null = null;
  private rectUpdateSubject = new Subject<void>();

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
    this.updateScrollableParents();
    this.setupScrollListeners();
    this.activeDropList = drag.dropList;
    this.isDragging = true;
    this.activeDropList.isDragging = true;
    this._currentDragRect = drag.domRect;
    const currDomRect = drag.el.getBoundingClientRect();
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

    if (this.activeDropList) {
      this.placeholderService.updatePlaceholder$.next({
        currentDrag: this._activeDragInstances[0],
        currentDragRec: this._activeDragInstances[0].domRect,
        dropList: this.activeDropList,
        state: 'show',
      });
    }
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
        overItemRec: this.dragOverItem?.domRect,
        state: 'hidden',
      });
      this.dragOverItem = undefined;
    }
    this.activeDropList = undefined;
    this.scrollSubscription?.unsubscribe();
    this.scrollSubscription = null;
    this.scrollableParents = [];
  }

  dragMove(drag: NgxDraggableDirective, ev: MouseEvent | TouchEvent, transform: string) {
    if (!this.dragElementInBody || !this.isDragging) {
      return;
    }
    this._renderer.setStyle(this.dragElementInBody, 'transform', transform);
    const viewPortPosition = getPointerPositionOnViewPort(ev);
    const finded = this.findItemUnderPointer(viewPortPosition);
    this.dragOverItem = finded.item;
    this.activeDropList = finded.dropList;

    const position = getPointerPosition(ev);
    if (!this.dragOverItem && this.activeDropList) {
      this.placeholderService.updatePlaceholder$.next({
        currentDrag: this._activeDragInstances[0],
        currentDragRec: this._activeDragInstances[0].domRect,
        dropList: this.activeDropList,
        position: position,
        dragOverItem: undefined,
        overItemRec: undefined,
        state: 'update',
      });
    }
    if (!this.activeDropList || !this.dragOverItem) return;
    if (this.activeDropList.checkAllowedConnections(this._activeDragInstances[0]?.dropList) == false) {
      return;
    }
    this.placeholderService.updatePlaceholder$.next({
      currentDrag: this._activeDragInstances[0],
      dragOverItem: this.dragOverItem,
      position: position,
      currentDragRec: this._currentDragRect!,
      dropList: this.activeDropList,
      overItemRec: this.dragOverItem?.domRect,
      state: 'update',
    });
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
    // console.time('initUpdateAllDragItemsRect');
    for (const dropList of this.dragRegister.dropListItems) {
      if (dropList.el.offsetParent === null) continue; // یعنی hidden هست
      dropList.updateDomRect();
      dropList.dragItems.forEach((item) => {
        if (item.el.offsetParent === null) return; // hidden item
        item.updateDomRect();
      });
    }
    // console.timeEnd('initUpdateAllDragItemsRect');
  }

  private sortDragItems() {
    for (const dropList of this.dragRegister.dropListItems) {
      dropList.dragItems = dropList.dragItems.sort((a, b) => {
        if (a.domRect.top !== b.domRect.top) return a.domRect.top - b.domRect.top;
        return a.domRect.left - b.domRect.left;
      });
    }
  }
  private findItemUnderPointer(pointer: IPosition): { dropList?: NgxDropListDirective; item?: NgxDraggableDirective } {
    const elements = document.elementsFromPoint(pointer.x, pointer.y) as HTMLElement[];
    if (!elements || !elements.length) return {};
    const dragElm = elements.find((x) => x.classList.contains('ngx-draggable'));
    const dropElm = elements.find((x) => x.hasAttribute('ngxdroplist'));
    const dragItem = dragElm ? this.dragRegister.dargItems.get(dragElm) : undefined;
    const dropList = dropElm ? this.dragRegister.dropList.get(dropElm) : undefined;
    return { dropList: dragItem ? dragItem.dropList : dropList, item: dragItem };
  }

  // Find all scrollable parents
  private updateScrollableParents() {
    this.scrollableParents = [];
    this.dragRegister.dropListItems.forEach((target) => {
      let parent = target.el.parentElement;
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
  }

  // Setup scroll listeners with throttling
  private setupScrollListeners() {
    if (this.scrollSubscription) return;

    this.scrollSubscription = fromEvent(this.scrollableParents, 'scroll')
      .pipe(throttleTime(16, undefined, { leading: true, trailing: true }))
      .subscribe(() => {
        this.rectUpdateSubject.next();
      });

    this.rectUpdateSubject
      .pipe(throttleTime(16, undefined, { leading: true, trailing: true }))
      .subscribe(() => this.updateAllDragItemsRect());
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
