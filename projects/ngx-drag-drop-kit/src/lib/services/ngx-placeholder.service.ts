import { DOCUMENT } from '@angular/common';
import { Injectable, Renderer2, RendererFactory2, Inject } from '@angular/core';
import { Subject, distinctUntilChanged } from 'rxjs';
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
        )
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
    if (!this.state.element || !input.destinationDropList || input.newIndex === -1) {
      return;
    }

    const isVertical = input.destinationDropList.direction === 'vertical';
    const items = this.getVisibleDragItems(input.destinationDropList.el) || [];
    const isSameList = input.sourceDropList.el === input.destinationDropList.el;
    const newIndex = input.newIndex;
    const previousIndex = isSameList ? input.previousIndex : items.findIndex((item) => item === this.state.element);
    const plcSize = isVertical ? this.state.rect?.height || 0 : this.state.rect?.width || 0;
    const draggedEl = input.dragItem.el;

    // محاسبه و اعمال transform برای هر آیتم
    items.forEach((el, idx) => {
      // اگر المنت، المنت درگ‌شده است (عنصری که مخفی شده) باید transform پاک شود
      if (draggedEl && el === draggedEl) {
        el.style.transform = '';
        return;
      }

      // helper: اندازه هر آیتم (ارتفاع یا عرض)
      const itemHeight = el.offsetHeight || 0;
      const itemWidth = el.offsetWidth || 0;
      const itemSize = isVertical ? itemHeight : itemWidth;

      //_______________Move placeholder element
      if (this.state.element && el === this.state.element) {
        const delta = newIndex - previousIndex; // مثبت => به سمت پایین، منفی => به سمت بالا
        if (delta === 0) {
          el.style.transform = '';
          return;
        }

        let shift = delta * itemSize;
        const transform = isVertical ? `translate3d(0, ${shift}px, 0)` : `translate3d(${shift}px, 0, 0)`;
        // از translate3d برای GPU acceleration استفاده می‌کنیم
        el.style.transform = transform;
        return;
      }
      //_______________End of Move placeholder element

      // بقیه آیتم‌ها:
      if (isSameList) {
        let checkIdx = newIndex >= previousIndex ? idx - 1 : idx;
        if (newIndex < previousIndex) {
          // آیتم‌هایی که در بازه [newIndex, previousIndex - 1] هستند باید به پایین شیفت کنند (+itemSize)
          if (checkIdx >= newIndex && checkIdx < previousIndex) {
            const shift = itemSize; // پایین = مثبت در محور Y
            const transform = isVertical ? `translate3d(0, ${shift}px, 0)` : `translate3d(${shift}px, 0, 0)`;
            el.style.transform = transform;
            return;
          } else {
            el.style.transform = '';
            return;
          }
        }

        // حالت درگ به پایین: newIndex > previousIndex
        if (newIndex > previousIndex) {
          // آیتم‌هایی که در بازه [previousIndex + 1, newIndex] هستند باید به بالا شیفت کنند (-itemSize)
          if (checkIdx >= previousIndex && checkIdx <= newIndex) {
            const shift = -itemSize; // بالا = منفی در محور Y
            const transform = isVertical ? `translate3d(0, ${shift}px, 0)` : `translate3d(${shift}px, 0, 0)`;
            el.style.transform = transform;
            return;
          } else {
            el.style.transform = '';
            return;
          }
        }
      } else {
        let checkIdx = newIndex >= previousIndex ? idx - 1 : idx;

        // حالت درگ به بالا: newIndex < previousIndex
        if (newIndex < previousIndex) {
          // آیتم‌هایی که در بازه [newIndex, previousIndex - 1] هستند باید به پایین شیفت کنند (+itemSize)
          if (checkIdx >= newIndex && checkIdx < previousIndex) {
            const shift = itemSize; // پایین = مثبت در محور Y
            const transform = isVertical ? `translate3d(0, ${shift}px, 0)` : `translate3d(${shift}px, 0, 0)`;
            el.style.transform = transform;
            return;
          } else {
            el.style.transform = '';
            return;
          }
        }
        // حالت درگ به پایین: newIndex > previousIndex
        if (newIndex > previousIndex) {
          // آیتم‌هایی که در بازه [previousIndex + 1, newIndex] هستند باید به بالا شیفت کنند (-itemSize)
          if (checkIdx >= previousIndex && checkIdx < newIndex) {
            const shift = -itemSize; // بالا = منفی در محور Y
            const transform = isVertical ? `translate3d(0, ${shift}px, 0)` : `translate3d(${shift}px, 0, 0)`;
            el.style.transform = transform;
            return;
          } else {
            el.style.transform = '';
            return;
          }
        }
      }
      // fallback: پاکسازی
      el.style.transform = '';
      return;
    });
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
