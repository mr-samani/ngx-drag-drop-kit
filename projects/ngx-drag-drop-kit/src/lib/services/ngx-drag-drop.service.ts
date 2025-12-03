import {
  Inject,
  Injectable,
  isDevMode,
  Renderer2,
  RendererFactory2,
  RendererStyleFlags2,
  DOCUMENT,
  signal,
} from '@angular/core';
import { IDropEvent } from '../../interfaces/IDropEvent';

import { getPointerPositionOnViewPort } from '../../utils/get-position';
import { NgxDragPlaceholderService } from './ngx-placeholder.service';
import { NgxDragRegisterService } from './ngx-drag-register.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { Subject } from 'rxjs/internal/Subject';
import { fromEvent } from 'rxjs/internal/observable/fromEvent';
import { throttleTime } from 'rxjs/internal/operators/throttleTime';
import { IPosition } from '../../interfaces/IPosition';
import { IDropList } from '../../interfaces/IDropList';
import { findScrollableToParents } from '../../utils/findScrollableElement';
import { DragItemRef } from '../directives/DragItemRef';
import { merge } from 'rxjs';
import { IScrollOffset } from '../../interfaces/IScrollOffset';
import { IGridOverlayOutput, createGridOverlay } from '../../utils/grid-view';
import { cloneDragElementInBody } from '../../utils/clone-drag-element-in-body';

@Injectable({
  providedIn: 'root',
})
export class NgxDragDropService {
  isDragging = signal(false);

  private _activeDragInstances: DragItemRef[] = [];
  private activeDropList?: IDropList;
  private renderer: Renderer2;
  private _dropEvent: IDropEvent | null = null;
  private dragElementInBody?: HTMLElement;

  currentDragPreviousStyles = {
    display: '',
    position: '',
  };
  scrollableParents: HTMLElement[] = [];

  private scrollSubscription: Subscription | null = null;
  private rectUpdateSubject = new Subject<void>();

  private _previousDragIndex = 0;
  private _newIndex = 0;

  private initialScrollOffset: IScrollOffset = { x: 0, y: 0, containerX: 0, containerY: 0 };

  gridOverlay?: IGridOverlayOutput;
  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private _document: Document,
    private placeholderService: NgxDragPlaceholderService,
    private dragRegister: NgxDragRegisterService
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  async startDrag(drag: DragItemRef) {
    if (!drag.dropList || this.isDragging()) {
      return;
    }
    this.activeDropList = drag.dropList;

    await this.dragRegister.updateAllDragItemsRect();
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
    drag.el.classList.add('dragging');
    this.dragElementInBody = cloneDragElementInBody(drag.el, currDomRect);
    this._document.body.appendChild(this.dragElementInBody);
    if (drag.dropList.disableSort == false) {
      this.currentDragPreviousStyles = {
        display: drag.el.style.display,
        position: drag.el.style.position,
      };
      this.renderer.addClass(drag.el, 'is-shadow-dragging');
      this.placeholderService.createPlaceholder(this.activeDropList, this._activeDragInstances[0]);
    } else {
      this.renderer.setStyle(drag.el, 'transform', 'none', RendererStyleFlags2.Important);
    }
    this.setupScrollListeners();
    this.initialScrollOffset = {
      x: window.scrollX,
      y: window.scrollY,
      containerX: this.activeDropList.el.scrollLeft || 0,
      containerY: this.activeDropList.el.scrollTop || 0,
    };
    this.showDevGridOverlay();
    this.placeholderService.updatePlaceholder$.next({
      dragItem: this._activeDragInstances[0],
      dragOverItem: this._activeDragInstances[0],
      sourceDropList: this._activeDragInstances[0].dropList!,
      destinationDropList: this.activeDropList,
      newIndex: this._newIndex,
      before: false,
      initialScrollOffset: this.initialScrollOffset,
    });

    this.isDragging.set(true);
    this.activeDropList.dragging = true;
  }
  showDevGridOverlay() {
    if (isDevMode() && false) {
      setTimeout(() => {
        const l = this.dragRegister.dropListItems.flatMap(item => {
          // const rects = [item.domRect];
          const rects = [];
          if (item.dragItems?.length) {
            rects.push(...item.dragItems.map(d => d.domRect));
          }
          return rects;
        });
        this.gridOverlay = createGridOverlay(l, {
          highlight: '#fe00002e',
          strokeWidth: 0.5,
        });
      }, 100);
    }
  }
  dragMove(drag: DragItemRef, ev: MouseEvent | TouchEvent, offsetX: number, offsetY: number) {
    if (
      !this.dragElementInBody ||
      !this.isDragging() ||
      !this._activeDragInstances[0] ||
      !this._activeDragInstances[0].dropList ||
      !this.activeDropList
    ) {
      return;
    }
    // if (ev.cancelable) ev.preventDefault();
    let containerX = drag.dropList?.el?.scrollLeft || 0;
    let containerY = drag.dropList?.el?.scrollTop || 0;

    const x = drag.domRect.x + offsetX + window.scrollX + containerX - this.initialScrollOffset.containerX;
    const y = drag.domRect.y + offsetY + window.scrollY + containerY - this.initialScrollOffset.containerY;
    const transform = `translate3d(${x}px, ${y}px, 0)`;
    this.renderer.setStyle(this.dragElementInBody, 'transform', transform);
    const viewportPointer = getPointerPositionOnViewPort(ev);
    const desDropList = this.dragRegister._getDropListFromPointerPosition(viewportPointer, drag);
    // console.log('Active Drop List:', desDropList?.el?.id);
    if (!desDropList) {
      return;
    }
    if (desDropList.checkAllowedConnections(this._activeDragInstances[0].dropList) == false) {
      return;
    }
    const dragOverData = this.dragRegister._getItemIndexFromPointerPosition(
      drag,
      desDropList,
      viewportPointer,
      this._newIndex
    );
    if (dragOverData.index > -1) {
      this._newIndex = dragOverData.index;
    }
    const dragOverItem = dragOverData.dragItem;

    if (desDropList.disableSort) return;
    desDropList.setInter(true);
    if (this.activeDropList !== desDropList) {
      this.activeDropList?.setInter(false);
      let overDragItem = dragOverData.dragItem;
      this.activeDropList = desDropList;
      this.placeholderService.createPlaceholder(desDropList, this._activeDragInstances[0], overDragItem);

      this._newIndex = this.placeholderService.state.index;
      this.showDevGridOverlay();
    }
    this.placeholderService.updatePlaceholder$.next({
      dragItem: this._activeDragInstances[0],
      dragOverItem: dragOverItem,
      sourceDropList: this._activeDragInstances[0].dropList,
      destinationDropList: this.activeDropList,
      newIndex: this._newIndex,
      before: dragOverData.before,
      initialScrollOffset: this.initialScrollOffset,
    });
  }
  stopDrag(drag: DragItemRef) {
    if (this.isDragging() == false) return;
    this.isDragging.set(false);
    //const currentIndex = this.activeDropList?.isFlexWrap ? this.placeholderService.state.index : this._newIndex;
    const currentIndex = this._newIndex;
    this.activeDropList?.setInter(false);
    if (drag.dropList) {
      drag.dropList.dragging = false;
    }
    let delay = 0;
    let endPosition = this.placeholderService.getPlaceholderPosition();
    if (endPosition) {
      delay = 150;
      this.renderer.setStyle(this.dragElementInBody, 'transition', 'transform 150ms cubic-bezier(0,0,0.2,1)');
      const isRtl = drag.dropList?.isRtl;
      let nx = endPosition.x + window.scrollX;
      let ny = endPosition.y + window.scrollY;
      if (isRtl) {
        nx = endPosition.right + window.scrollX - drag.domRect.width;
      }
      this.renderer.setStyle(this.dragElementInBody, 'transform', `translate3d(${nx}px, ${ny}px, 0)`);
    }
    const index = this._activeDragInstances.indexOf(drag);
    if (index > -1) {
      this._activeDragInstances?.forEach(el => {
        this.renderer.removeStyle(el.el, 'transform');
        this.renderer.setStyle(el.el, 'display', this.currentDragPreviousStyles.display);
        this.renderer.setStyle(el.el, 'position', this.currentDragPreviousStyles.position);
        this.renderer.removeClass(el.el, 'is-shadow-dragging');
      });

      if (this._dropEvent && this.activeDropList) {
        this._dropEvent.container = this.activeDropList;
        this._dropEvent.currentIndex = currentIndex > 0 ? currentIndex : 0;
        this.activeDropList.onDrop(this._dropEvent);
      }
      this._activeDragInstances.splice(index, 1);
    }
    this.placeholderService.hide(this.activeDropList);
    this.dragRegister.dargItems.forEach(d => {
      // this.renderer.setStyle(d.el, 'transition-property', 'none');
      // this.renderer.removeStyle(d.el, 'transform');
      this.renderer.removeStyle(d.el, 'transition');
    });
    const cleanUpFn = (dragElementInBody: HTMLElement) => {
      dragElementInBody.remove();
      this.dragElementInBody = undefined;
    };

    const elInBody = this.dragElementInBody!;
    setTimeout(() => {
      cleanUpFn(elInBody);
    }, delay);
    this._activeDragInstances = [];
    this.activeDropList = undefined;
    this.scrollSubscription?.unsubscribe();
    this.scrollSubscription = null;
    this.scrollableParents = [];
    this.rectUpdateSubject = new Subject<void>();
    this._previousDragIndex = 0;
    this._newIndex = 0;
    this.initialScrollOffset = { x: 0, y: 0, containerX: 0, containerY: 0 };
    this.gridOverlay?.remove();
  }

  // Setup scroll listeners with throttling
  private setupScrollListeners(): void {
    // ۱️⃣ همه والدهای قابل اسکرول را پیدا کن
    this.scrollableParents = findScrollableToParents(
      this._document,
      this.dragRegister.dropListItems.map(item => item.el)
    );
    // console.log(
    //   'scrollableParents:',
    //   this.scrollableParents.map((el) => el.tagName)
    // );

    // ۲️⃣ اگر قبلاً لیسنر فعال است، تکرار نکن
    if (this.scrollSubscription) return;

    // ۳️⃣ ساخت آرایه واقعی از منابع event
    const scrollTargets: (HTMLElement | Window)[] = this.scrollableParents
      .map(el => {
        const doc = this._document;
        const isRoot = el === doc.documentElement || el === doc.body || el === doc.scrollingElement;
        return isRoot ? doc.defaultView! : el; // ✅ window درست
      })
      .filter(Boolean)
      .reduce((acc: any, cur: any) => (acc.includes(cur) ? acc : [...acc, cur]), []);

    // ۴️⃣ ساخت merged observable از تمام آن‌ها
    const scroll$ = scrollTargets.map(target => fromEvent(target, 'scroll'));
    this.scrollSubscription = merge(...scroll$)
      .pipe(throttleTime(16, undefined, { leading: true, trailing: true }))
      .subscribe(async () => {
        await this.dragRegister.updateAllDragItemsRect();
        this.showDevGridOverlay();
      });
  }

  /**
   *
   * @param pointer view port pointer (clientX,clientY)
   */
  getPointerElement(pointer: IPosition) {
    if (!isDevMode()) return;
    let pe = document.querySelector('.ngxpointer');
    if (!pe) return;
    let x = Math.round(pointer.x + window.scrollX);
    let y = Math.round(pointer.y + window.scrollY);
    pe!.innerHTML = `${x},${y}(${Math.round(pointer.x)},${Math.round(pointer.y)})`;
    this.renderer.setStyle(pe, 'transform', `translate3d(${x}px,${y}px,0)`);
  }
}
