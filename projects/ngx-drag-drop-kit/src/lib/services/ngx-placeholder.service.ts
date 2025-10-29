import { DOCUMENT } from '@angular/common';
import { Injectable, Renderer2, RendererFactory2, Inject } from '@angular/core';
import { Subject, distinctUntilChanged, throttleTime } from 'rxjs';
import { IDropList } from '../../interfaces/IDropList';
import { NgxDragRegisterService } from './ngx-drag-register.service';
import { IUpdatePlaceholder } from '../../interfaces/IUpdatePlaceholder';
import { DragItemRef } from '../directives/DragItemRef';
type MoveDirection = 'None' | 'Forward' | 'Backward';

interface PlaceholderState {
  /**
   * index of placeholder in drop list
   * - index of drag items
   */
  index: any;
  /**
   * placeholder html element
   */
  element: HTMLElement | null;
  /**
   * dom rect of placeholder
   */
  rect: DOMRect | null;
  /**
   * placeholder is shown
   */
  isShown: boolean;
  dragItem: DragItemRef | null;
}

@Injectable({ providedIn: 'root' })
export class NgxDragPlaceholderService {
  private renderer: Renderer2;
  private state: PlaceholderState = {
    element: null,
    isShown: false,
    rect: null,
    index: -1,
    dragItem: null,
  };

  public updatePlaceholder$ = new Subject<IUpdatePlaceholder>();

  get isShown(): boolean {
    return this.state.isShown;
  }

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document,
    private dragRegister: NgxDragRegisterService
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.initSubscription();
  }

  private initSubscription(): void {
    this.updatePlaceholder$
      .pipe(
        distinctUntilChanged(
          (prev, curr) =>
            prev.newIndex === curr.newIndex &&
            prev.dragItem === curr.dragItem &&
            prev.destinationDropList === curr.destinationDropList &&
            prev.isAfter === curr.isAfter
        )
        //  throttleTime(200)
      )
      .subscribe((input) => this.update(input));
  }

  public hide(destinationDropList?: IDropList): void {
    if (this.state.dragItem) this.dragRegister.removeDragItem(this.state.dragItem);
    this.state.element?.remove();
    this.clearTransforms();
    this.resetState();
    destinationDropList?.disposePlaceholder?.();
  }

  private update(input: IUpdatePlaceholder): void {
    const { destinationDropList } = input;
    if (destinationDropList?.isFlexWrap) {
      this.showFlexWrap(input);
      return;
    }

    if (!this.state.element) {
      return;
    }
    this.applyTransforms(input);
  }

  private showFlexWrap(input: IUpdatePlaceholder): void {
    const { dragItem, destinationDropList, dragOverItem, newIndex } = input;
    if (dragOverItem?.isPlaceholder) return;
    this.hide(destinationDropList);
    let isAfter = input.isAfter;
    if (this.state.index < newIndex) {
      isAfter = !input.isAfter;
    }
    this.createPlaceholder(destinationDropList, dragItem, dragOverItem, isAfter);
  }
  public createPlaceholder(
    destinationDropList: IDropList,
    dragItem: DragItemRef,
    dragOverItem?: DragItemRef,
    isAfter = true
  ): void {
    this.hide(destinationDropList);
    if (!destinationDropList) return;
    if (destinationDropList.direction == 'vertical') {
      isAfter = true;
    }
    this.state.element = destinationDropList.addPlaceholder(dragItem);
    const isSameList = dragItem.dropList === destinationDropList;

    if (dragOverItem && !dragOverItem.isPlaceholder) {
      dragOverItem.el.insertAdjacentElement(isAfter ? 'afterend' : 'beforebegin', this.state.element);
    } else {
      if (isSameList) {
        dragItem.el.insertAdjacentElement(isAfter ? 'afterend' : 'beforebegin', this.state.element);
      } else {
        destinationDropList.el.insertAdjacentElement('beforeend', this.state.element);
      }
    }

    this.state.rect = this.state.element.getBoundingClientRect();
    // this.state.index = this.getVisibleDragItems(destinationDropList.el)
    //   .filter((x) => x != dragItem.el)
    //   .indexOf(this.state.element);
    this.state.isShown = true;
    this.state.dragItem = new DragItemRef(this.state.element);
    this.state.dragItem._domRect = this.state.rect;
    this.state.dragItem.isPlaceholder = true;

    // this.dragRegister.registerDragItem(this.state.dragItem);
    //this.dragRegister.updateAllDragItemsRect();
    this.state.index = this.dragRegister.getDragItemIndex(this.state.dragItem, true);
  }

  private applyTransforms(input: IUpdatePlaceholder): void {
    const { destinationDropList, sourceDropList, newIndex, dragOverItem, initialScrollOffset } = input;

    if (!this.state.element || !destinationDropList || newIndex === -1) return;

    const isVertical = destinationDropList.direction === 'vertical';
    const isSameList = sourceDropList.el === destinationDropList.el;
    const items = destinationDropList.dragItems;

    const placeholderIndex = this.state.index;
    const placeholderSize = isVertical ? this.state.rect?.height || 0 : this.state.rect?.width || 0;

    const moveDirection: MoveDirection =
      newIndex === placeholderIndex ? 'None' : newIndex > placeholderIndex ? 'Forward' : 'Backward';
    if (dragOverItem && this.state.rect) {
      const newPosition = dragOverItem.domRect;

      // محاسبه scroll فعلی container (اگر وجود داشته باشد)
      const containerScrollLeft = destinationDropList.el.scrollLeft || 0;
      const containerScrollTop = destinationDropList.el.scrollTop || 0;

      // محاسبه تفاوت scroll window
      const windowScrollDeltaX = window.scrollX - initialScrollOffset.x;
      const windowScrollDeltaY = window.scrollY - initialScrollOffset.y;

      // محاسبه تفاوت scroll container
      const containerScrollDeltaX = containerScrollLeft - (initialScrollOffset.containerX || 0);
      const containerScrollDeltaY = containerScrollTop - (initialScrollOffset.containerY || 0);

      // محاسبه موقعیت نهایی با در نظر گرفتن هر دو scroll
      let deltaX = newPosition.left - this.state.rect.left + windowScrollDeltaX - containerScrollDeltaX;
      let deltaY = newPosition.top - this.state.rect.top + windowScrollDeltaY - containerScrollDeltaY;

      if (moveDirection === 'Forward') {
        deltaX += newPosition.width - this.state.rect.width;
        deltaY += newPosition.height - this.state.rect.height;
      }
      this.renderer.setStyle(this.state.element, 'transform', `translate3d(${deltaX}px, ${deltaY}px, 0)`);
    }

    // ---- reset transforms for all items first ----
    for (const item of items) {
      if (item.isPlaceholder || item.isDragging) continue;
      this.renderer.setStyle(item.el, 'transform', '');
      this.renderer.setStyle(item.el, 'transition', 'transform 250ms cubic-bezier(0,0,0.2,1)');
    }
    // ---- compute affected range ----
    const [start, end] = moveDirection === 'Forward' ? [placeholderIndex, newIndex] : [newIndex, placeholderIndex];

    // ---- determine transform direction ----
    const directionFactor = moveDirection === 'Forward' ? -1 : +1;
    const shiftValue = placeholderSize * directionFactor;

    // ---- apply transforms ----
    const otherItems = items.filter((x) => !x.isPlaceholder);
    for (let i = start; i <= end && i < otherItems.length; i++) {
      const item = otherItems[i];
      if (!item || item.isPlaceholder || item.isDragging) continue;

      const shouldMove = this.shouldMoveItem(i, placeholderIndex, newIndex, moveDirection, isSameList);

      if (!shouldMove) continue;

      const transform = this.getTransform(isVertical, shiftValue);
      this.renderer.setStyle(item.el, 'transform', transform);
    }
  }

  /** Determines if an item should move based on its position and movement context */
  private shouldMoveItem(
    index: number,
    placeholderIndex: number,
    newIndex: number,
    direction: MoveDirection,
    isSameList: boolean
  ): boolean {
    if (direction === 'None') return false;

    // Same-list movement
    if (isSameList) {
      if (direction === 'Backward') return index >= newIndex && index < placeholderIndex;
      if (direction === 'Forward') return index >= placeholderIndex && index <= newIndex;
    }
    // Cross-list movement
    else {
      if (direction === 'Backward') return index >= newIndex && index < placeholderIndex;
      if (direction === 'Forward') return index >= placeholderIndex && index < newIndex;
    }

    return false;
  }

  /** Returns CSS transform string based on orientation and shift distance */
  private getTransform(isVertical: boolean, shift: number): string {
    return isVertical ? `translate3d(0, ${shift}px, 0)` : `translate3d(${shift}px, 0, 0)`;
  }

  private getVisibleDragItems(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>('.ngx-draggable'));
    // .filter(
    //   (el) => el !== this.state.element && !el.classList.contains('dragging')
    // );
  }

  private clearTransforms(): void {
    this.document
      .querySelectorAll('.ngx-draggable:not(.dragging):not(.ngx-drag-in-body)')
      .forEach((el) => this.renderer.removeStyle(el, 'transform'));
  }

  private resetState(): void {
    this.state = { element: null, isShown: false, rect: null, index: -1, dragItem: null };
  }
  getPlaceholderPosition() {
    if (!this.state.rect) {
      throw new Error('Placeholder position is not set.');
    }
    return this.state.element?.getBoundingClientRect();
  }
}
