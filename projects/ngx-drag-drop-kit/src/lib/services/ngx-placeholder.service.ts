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
            prev.destinationDropList === curr.destinationDropList
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

  public createPlaceholder(destinationDropList: IDropList, dragItem: DragItemRef, dragOverItem?: DragItemRef): void {
    this.hide(destinationDropList);
    if (!destinationDropList) return;
    const isAfter = true;

    this.state.element = destinationDropList.addPlaceholder(dragItem.domRect);
    const isSameList = dragItem.dropList === destinationDropList;

    if (dragOverItem) {
      dragOverItem.el.insertAdjacentElement(isAfter ? 'afterend' : 'beforebegin', this.state.element);
    } else {
      if (isSameList) {
        dragItem.el.insertAdjacentElement(isAfter ? 'afterend' : 'beforebegin', this.state.element);
      } else {
        destinationDropList.el.insertAdjacentElement('beforeend', this.state.element);
      }
    }

    this.state.rect = this.state.element.getBoundingClientRect();
    this.state.index = this.getVisibleDragItems(destinationDropList.el)
      .filter((x) => x != dragItem.el)
      .indexOf(this.state.element);
    this.state.isShown = true;
    this.state.dragItem = new DragItemRef(this.state.element);
    this.state.dragItem._domRect = this.state.rect;
    this.state.dragItem.isPlaceholder = true;

    this.dragRegister.registerDragItem(this.state.dragItem);
    // setTimeout(() => {
    // this.dragRegister.updateAllDragItemsRect([destinationDropList]);
    this.dragRegister.updateAllDragItemsRect();
    //}, 1000);
  }

  private applyTransforms(input: IUpdatePlaceholder): void {
    const { destinationDropList, sourceDropList, newIndex, dragOverItem } = input;

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
      let deltaX = newPosition.left - this.state.rect.left;
      let deltaY = newPosition.top - this.state.rect.top;
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
      if (item.isPlaceholder || item.isDragging) continue;

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

  private showFlexWrap(input: IUpdatePlaceholder): void {
    const { dragItem, destinationDropList } = input;

    this.hide(destinationDropList);

    // this.state.element = this.document.createElement('div');
    // this.state.element.className = 'ngx-drag-placeholder';

    // this.renderer.setStyle(this.state.element, 'display', 'inline-block');
    // this.renderer.setStyle(this.state.element, 'pointerEvents', 'none');
    // this.renderer.setStyle(this.state.element, 'width', `${dragItem.domRect.width}px`);
    // this.renderer.setStyle(this.state.element, 'height', `${dragItem.domRect.height}px`);

    // if (dragOverItem && dragOverItem.dropList === destinationDropList) {
    //   //  dragOverItem.el.insertAdjacentElement(isAfter ? 'afterend' : 'beforebegin', this.state.element);
    //   const overIdx = this.dragRegister.getDragItemIndex(dragOverItem);
    //   // this.state.index = isAfter ? overIdx + 1 : overIdx;
    // } else {
    //   destinationDropList?.el.insertAdjacentElement('beforeend', this.state.element);
    //   this.state.index = destinationDropList?.dragItems.length ?? 0;
    // }
    this.state.isShown = true;
    // this.state.rect = this.state.element.getBoundingClientRect();
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
}
