import { DOCUMENT } from '@angular/common';
import { Injectable, Renderer2, RendererFactory2, Inject } from '@angular/core';
import { Subject, distinctUntilChanged, throttleTime } from 'rxjs';
import { IDragItem } from '../../interfaces/IDragItem';
import { IDropList } from '../../interfaces/IDropList';
import { NgxDragRegisterService } from './ngx-drag-register.service';
import { IUpdatePlaceholder } from '../../interfaces/IUpdatePlaceholder';
type MoveDirection = 'Forward' | 'Backward';

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
}

@Injectable({ providedIn: 'root' })
export class NgxDragPlaceholderService {
  private renderer: Renderer2;
  private state: PlaceholderState = {
    element: null,
    isShown: false,
    rect: null,
    index: -1,
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

  public createPlaceholder(destinationDropList: IDropList, dragItem: IDragItem, dragOverItem?: IDragItem): void {
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
  }

  private applyTransforms(input: IUpdatePlaceholder): void {
    const { destinationDropList, sourceDropList, newIndex, dragItem } = input;

    if (!this.state.element || !destinationDropList || newIndex === -1) {
      return;
    }

    const isVertical = destinationDropList.direction === 'vertical';
    const items = destinationDropList.dragItems;
    const isSameList = sourceDropList.el === destinationDropList.el;
    const draggedEl = dragItem.el;
    const plcSize = isVertical ? this.state.rect?.height || 0 : this.state.rect?.width || 0;
    const plcIdx = this.state.index;
    const moveDirection: MoveDirection = newIndex > plcIdx ? 'Forward' : 'Backward';

    for (let i = 0; i < items.length; i++) {
      const el = items[i].el;
      if (el === draggedEl) {
        this.renderer.setStyle(el, 'transform', '');
        continue;
      }

      this.renderer.setStyle(el, 'transition', 'transform 250ms cubic-bezier(0, 0, 0.2, 1)');
      let shouldMove = false;
      // -----------------------
      // حالت ۱: درون همان لیست
      // -----------------------
      if (isSameList) {
        if (moveDirection == 'Backward') {
          shouldMove = i >= newIndex && i < plcIdx;
          // حرکت به بالا
          this.renderer.setStyle(el, 'transform', shouldMove ? this.getTransform(isVertical, +plcSize) : '');
        } else if (moveDirection == 'Forward') {
          shouldMove = i >= plcIdx && i <= newIndex;
          // حرکت به پایین
          this.renderer.setStyle(el, 'transform', shouldMove ? this.getTransform(isVertical, -plcSize) : '');
        } else {
          this.renderer.setStyle(el, 'transform', '');
        }
      } // -----------------------
      // حالت ۲: بین دو لیست (CrossList)
      // -----------------------
      else {
        if (moveDirection == 'Backward') {
          shouldMove = i >= newIndex && i < plcIdx;
          // حرکت به بالا
          this.renderer.setStyle(el, 'transform', shouldMove ? this.getTransform(isVertical, +plcSize) : '');
        } else if (moveDirection == 'Forward') {
          shouldMove = i >= plcIdx && i < newIndex;
          // حرکت به پایین
          this.renderer.setStyle(el, 'transform', shouldMove ? this.getTransform(isVertical, -plcSize) : '');
        } else {
          this.renderer.setStyle(el, 'transform', '');
        }
      }
      if (shouldMove) {
        this.adjustDragItemDomRect(items[i], isVertical, plcSize, moveDirection);
      }
    }

    // Placeholder movement
    this.movePlaceholder(items, newIndex, isVertical, moveDirection, draggedEl);
  }

  private movePlaceholder(
    items: IDragItem[],
    newIndex: number,
    isVertical: boolean,
    moveDirection: MoveDirection,
    draggedEl: HTMLElement
  ) {
    const placeholderEl = this.state.element;
    if (!placeholderEl) {
      return;
    }
    const plcIdx = this.state.index;
    // اگر تغییری نیست
    if (newIndex === plcIdx) {
      this.renderer.setStyle(placeholderEl, 'transform', '');
      return;
    }
    // محاسبه میانگین سایز آیتم‌ها
    let totalSize = 0;
    let count = 0;

    const start = Math.min(plcIdx, newIndex);
    const end = Math.max(plcIdx, newIndex);

    for (let i = start; i <= end && i < items.length; i++) {
      const item = items[i];
      if (!item || item.el === placeholderEl || item.el === draggedEl) continue;

      const size = isVertical ? item.el.offsetHeight : item.el.offsetWidth;
      totalSize += size;
      count++;
    }

    const direction = moveDirection == 'Forward' ? 1 : -1;
    const shift = totalSize * direction;
    const transform = isVertical ? `translate3d(0, ${shift}px, 0)` : `translate3d(${shift}px, 0, 0)`;
    this.renderer.setStyle(placeholderEl, 'transform', transform);
    this.renderer.setStyle(placeholderEl, 'transition', 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)');
  }

  /** Helper برای ساخت transform با GPU acceleration */
  private getTransform(isVertical: boolean, shift: number): string {
    return isVertical ? `translate3d(0, ${shift}px, 0)` : `translate3d(${shift}px, 0, 0)`;
  }

  private adjustDragItemDomRect(dragItem: IDragItem, isVertical: boolean, shift: number, moveDirection: MoveDirection) {
    // const direction = moveDirection == 'Forward' ? 1 : -1;
    // if (isVertical) dragItem.adjustDomRect(0, shift * direction);
    // else dragItem.adjustDomRect(shift * direction, 0);
  }

  private showFlexWrap(input: IUpdatePlaceholder): void {
    const { dragItem, destinationDropList } = input;

    this.hide(destinationDropList);

    this.state.element = this.document.createElement('div');
    this.state.element.className = 'ngx-drag-placeholder';

    this.renderer.setStyle(this.state.element, 'display', 'inline-block');
    this.renderer.setStyle(this.state.element, 'pointerEvents', 'none');
    this.renderer.setStyle(this.state.element, 'width', `${dragItem.domRect.width}px`);
    this.renderer.setStyle(this.state.element, 'height', `${dragItem.domRect.height}px`);

    // if (dragOverItem && dragOverItem.dropList === destinationDropList) {
    //   //  dragOverItem.el.insertAdjacentElement(isAfter ? 'afterend' : 'beforebegin', this.state.element);
    //   const overIdx = this.dragRegister.getDragItemIndex(dragOverItem);
    //   // this.state.index = isAfter ? overIdx + 1 : overIdx;
    // } else {
    //   destinationDropList?.el.insertAdjacentElement('beforeend', this.state.element);
    //   this.state.index = destinationDropList?.dragItems.length ?? 0;
    // }
    this.state.isShown = true;
    this.state.rect = this.state.element.getBoundingClientRect();
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
    this.state = { element: null, isShown: false, rect: null, index: -1 };
  }
}
