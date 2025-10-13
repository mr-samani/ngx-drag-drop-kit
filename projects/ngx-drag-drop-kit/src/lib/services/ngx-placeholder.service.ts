import { DOCUMENT } from '@angular/common';
import { Injectable, Renderer2, RendererFactory2, Inject } from '@angular/core';
import { Subject, distinctUntilChanged, throttle, throttleTime } from 'rxjs';
import { IDragItem } from '../../interfaces/IDragItem';
import { IDropList } from '../../interfaces/IDropList';
import { DragDecision } from '../../utils/check-shift-item';
import { NgxDragRegisterService } from './ngx-drag-register.service';
import { IUpdatePlaceholder } from '../../interfaces/IUpdatePlaceholder';

interface PlaceholderState {
  element: HTMLElement | null;
  rect: DOMRect | null;
  isShown: boolean;
}

@Injectable({ providedIn: 'root' })
export class NgxDragPlaceholderService {
  private renderer: Renderer2;
  private state: PlaceholderState = {
    element: null,
    isShown: false,
    rect: null,
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
            prev.previousIndex === curr.previousIndex &&
            prev.dragItem === curr.dragItem &&
            prev.destinationDropList === curr.destinationDropList &&
            prev.isAfter === curr.isAfter
        ),
        throttleTime(200)
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
    // this.dragRegister.updateAllDragItemsRect();
  }

  public createPlaceholder(
    destinationDropList: IDropList,
    dragItem: IDragItem,
    dragOverItem?: IDragItem,
    isAfter = false
  ): void {
    this.hide(destinationDropList);
    if (!destinationDropList) return;

    this.state.element = destinationDropList.addPlaceholder(dragItem.domRect);
    const isSameList = dragItem.dropList === destinationDropList;

    if (isSameList) {
      dragItem.el.insertAdjacentElement(isAfter ? 'afterend' : 'beforebegin', this.state.element);
    } else {
      if (dragOverItem) {
        dragOverItem.el.insertAdjacentElement(isAfter ? 'afterend' : 'beforebegin', this.state.element);
      } else {
        destinationDropList.el.insertAdjacentElement('beforeend', this.state.element);
      }
    }
    this.state.rect = this.state.element.getBoundingClientRect();
    this.state.isShown = true;
  }

  private applyTransforms(input: IUpdatePlaceholder): void {
    const { destinationDropList, sourceDropList, newIndex, previousIndex, dragItem } = input;

    if (!this.state.element || !destinationDropList || newIndex === -1) {
      return;
    }

    const isVertical = destinationDropList.direction === 'vertical';
    const items = this.getVisibleDragItems(destinationDropList.el) || [];
    const isSameList = sourceDropList.el === destinationDropList.el;

    const draggedEl = dragItem.el;
    const placeholderEl = this.state.element;
    const plcSize = isVertical ? this.state.rect?.height || 0 : this.state.rect?.width || 0;

    // در حالت cross-list، previousIndex را با توجه به جایگاه placeholder در مقصد محاسبه می‌کنیم
    const prevIdx = isSameList ? previousIndex : items.findIndex((item) => item === placeholderEl);

    items.forEach((el, idx) => {
      // آیتمی که در حال درگ است نباید transform داشته باشد
      if (el === draggedEl) {
        this.renderer.setStyle(el, 'transform', '');
        return;
      }

      // Placeholder movement
      if (el === placeholderEl) {
        const delta = newIndex - prevIdx;
        let sumOfItemSizes =
          items.slice(prevIdx, newIndex + 2).reduce((acc, item) => {
            return acc + (isVertical ? item.offsetHeight : item.offsetWidth);
          }, 0) - plcSize;
        this.renderer.setStyle(
          el,
          'transform',
          delta === 0
            ? ''
            : isVertical
            ? `translate3d(0, ${sumOfItemSizes}px, 0)`
            : `translate3d(${sumOfItemSizes}px, 0, 0)`
        );
        return;
      }
      this.renderer.setStyle(el, 'transition', 'transform 250ms cubic-bezier(0, 0, 0.2, 1)');

      // تعیین محدوده آیتم‌هایی که باید جابجا شوند
      const checkIdx = newIndex >= prevIdx ? idx - 1 : idx;

      // -----------------------
      // حالت ۱: درون همان لیست
      // -----------------------
      if (isSameList) {
        if (newIndex < prevIdx) {
          // حرکت به بالا
          this.renderer.setStyle(
            el,
            'transform',
            checkIdx >= newIndex && checkIdx < prevIdx ? this.getTransform(isVertical, +plcSize) : ''
          );
        } else if (newIndex > prevIdx) {
          // حرکت به پایین
          this.renderer.setStyle(
            el,
            'transform',
            checkIdx >= prevIdx && checkIdx <= newIndex ? this.getTransform(isVertical, -plcSize) : ''
          );
        } else {
          this.renderer.setStyle(el, 'transform', '');
        }
        return;
      }

      // -----------------------
      // حالت ۲: بین دو لیست (CrossList)
      // -----------------------
      if (newIndex < prevIdx) {
        // حرکت به بالا
        this.renderer.setStyle(
          el,
          'transform',
          checkIdx >= newIndex && checkIdx < prevIdx ? this.getTransform(isVertical, +plcSize) : ''
        );
      } else if (newIndex > prevIdx) {
        // حرکت به پایین
        this.renderer.setStyle(
          el,
          'transform',
          checkIdx >= prevIdx && checkIdx < newIndex ? this.getTransform(isVertical, -plcSize) : ''
        );
      } else {
        this.renderer.setStyle(el, 'transform', '');
      }
    });
  }

  /** Helper برای ساخت transform با GPU acceleration */
  private getTransform(isVertical: boolean, shift: number): string {
    return isVertical ? `translate3d(0, ${shift}px, 0)` : `translate3d(${shift}px, 0, 0)`;
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
    this.state = { element: null, isShown: false, rect: null };
  }
}
