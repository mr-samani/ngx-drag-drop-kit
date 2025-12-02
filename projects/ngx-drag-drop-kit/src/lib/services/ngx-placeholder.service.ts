import { Injectable, Renderer2, RendererFactory2, Inject, DOCUMENT } from '@angular/core';
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
  public state: PlaceholderState = {
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
            prev.before === curr.before
        )
        //  throttleTime(200)
      )
      .subscribe(input => this.update(input));
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
    // if (destinationDropList?.isFlexWrap) {
    //   this.showFlexWrap(input);
    //   return;
    // }

    if (!this.state.element) {
      return;
    }
    this.applyTransforms(input);
  }

  private showFlexWrap(input: IUpdatePlaceholder): void {
    const { dragItem, destinationDropList, dragOverItem, newIndex } = input;
    if (!dragOverItem || dragOverItem?.isPlaceholder) return;
    this.hide(destinationDropList);
    // let isAfter = input.isAfter;
    // if (this.state.index < newIndex) {
    //   isAfter = !input.isAfter;
    // }
    this.createPlaceholder(destinationDropList, dragItem, dragOverItem, false);
  }
  public createPlaceholder(
    destinationDropList: IDropList,
    dragItem: DragItemRef,
    dragOverItem?: DragItemRef,
    isAfter = true
  ): void {
    this.hide(destinationDropList);
    if (!destinationDropList) return;

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
    if (this.state.rect.width < 5 && this.state.rect.height < 5) {
      let w = dragItem.domRect.width;
      this.renderer.setStyle(this.state.element, 'width', w ? w + 'px' : '100%');
    }
    // this.state.index = this.getVisibleDragItems(destinationDropList.el)
    //   .filter((x) => x != dragItem.el)
    //   .indexOf(this.state.element);
    this.state.isShown = true;
    this.state.dragItem = new DragItemRef(this.state.element);
    this.state.dragItem._domRect = this.state.rect;
    this.state.dragItem.isPlaceholder = true;

    this.state.index = this.dragRegister.getDragItemIndex(dragItem, false);
  }

  private applyTransforms(input: IUpdatePlaceholder): void {
    const { destinationDropList, newIndex, dragOverItem, initialScrollOffset, before } = input;

    if (!this.state.element || !destinationDropList || !dragOverItem || newIndex === -1) return;

    const isVertical = dragOverItem.isFullRow === true;
    const items = destinationDropList.dragItems;
    const isRtl = destinationDropList.isRtl;
    // ═══════════════════════════════════════════════════════
    // PART 1: جابجایی Placeholder
    // ═══════════════════════════════════════════════════════

    const newPosition = dragOverItem.domRect;

    // محاسبه scroll offset
    const windowScrollDeltaX = window.scrollX - initialScrollOffset.x;
    const windowScrollDeltaY = window.scrollY - initialScrollOffset.y;
    const containerScrollDeltaX = (destinationDropList.el.scrollLeft || 0) - (initialScrollOffset.containerX || 0);
    const containerScrollDeltaY = (destinationDropList.el.scrollTop || 0) - (initialScrollOffset.containerY || 0);

    // محاسبه delta
    let deltaX = newPosition.left - this.state.rect!.left + windowScrollDeltaX; // - containerScrollDeltaX;
    let deltaY = newPosition.top - this.state.rect!.top + windowScrollDeltaY; //- containerScrollDeltaY;

    // تنظیم سایز و position
    if (isVertical) {
      if (!before) deltaY += newPosition.height;
      this.renderer.setStyle(this.state.element, 'height', 'unset');
      this.renderer.setStyle(this.state.element, 'width', `${newPosition.width}px`);
      if (isRtl) {
        deltaX += newPosition.width;
      }
    } else {
      if (!before) deltaX += isRtl ? newPosition.width : newPosition.width;

      this.renderer.setStyle(this.state.element, 'height', `${newPosition.height}px`);
      this.renderer.setStyle(this.state.element, 'width', 'unset');
      if (isRtl) {
        deltaX += before ? newPosition.width : -newPosition.width;
      }
    }

    this.renderer.setStyle(this.state.element, 'transition', 'transform 250ms cubic-bezier(0,0,0.2,1)');
    this.renderer.setStyle(this.state.element, 'transform', `translate3d(${deltaX}px, ${deltaY}px, 0)`);

    // ═══════════════════════════════════════════════════════
    // PART 2: Reset تمام transform ها
    // ═══════════════════════════════════════════════════════

    items.forEach(item => {
      if (!item.isPlaceholder && !item.isDragging) {
        this.renderer.setStyle(item.el, 'transform', '');
        this.renderer.setStyle(item.el, 'transition', 'transform 250ms cubic-bezier(0,0,0.2,1)');
      }
    });

    const placeholderIndex = this.state.index;
    const placeholderSize = isVertical ? this.state.rect?.height || 0 : this.state.rect?.width || 0;

    if (newIndex === placeholderIndex) return;

    // // ═══════════════════════════════════════════════════════
    // // PART 3: محاسبه آیتم‌هایی که باید Shift بخورن
    // // ═══════════════════════════════════════════════════════

    // // فیلتر کردن آیتم‌های واقعی (بدون placeholder و dragItem)
    // const realItems = items.filter((x) => !x.isPlaceholder);

    // // تشخیص جهت حرکت
    // const isMovingForward = newIndex > placeholderIndex;

    // // محاسبه range آیتم‌هایی که باید shift بخورن
    // const rangeStart = Math.min(placeholderIndex, newIndex);
    // const rangeEnd = Math.max(placeholderIndex, newIndex);

    // // ═══════════════════════════════════════════════════════
    // // PART 4: اعمال Transform به آیتم‌های Affected
    // // ═══════════════════════════════════════════════════════

    // for (let i = 0; i < realItems.length; i++) {
    //   const item = realItems[i];

    //   // آیا این آیتم در range affected هست؟
    //   let shouldShift = false;

    //   if (isMovingForward) {
    //     // placeholder داره به جلو میره (راست/پایین)
    //     // آیتم‌های بین placeholderIndex تا newIndex باید به عقب برن
    //     shouldShift = i > placeholderIndex && i <= newIndex;

    //     if (shouldShift) {
    //       // به عقب shift بده (منفی)
    //       const transform = this.getTransform(isVertical, -placeholderSize);
    //       this.renderer.setStyle(item.el, 'transform', transform);
    //     }
    //   } else {
    //     // placeholder داره به عقب میره (چپ/بالا)
    //     // آیتم‌های بین newIndex تا placeholderIndex باید به جلو بیان
    //     shouldShift = i >= newIndex && i < placeholderIndex;

    //     if (shouldShift) {
    //       // به جلو shift بده (مثبت)
    //       const transform = this.getTransform(isVertical, placeholderSize);
    //       this.renderer.setStyle(item.el, 'transform', transform);
    //     }
    //   }
    // }
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
      .forEach(el => this.renderer.removeStyle(el, 'transform'));
  }

  private resetState(): void {
    this.state = { element: null, isShown: false, rect: null, index: -1, dragItem: null };
  }
  getPlaceholderPosition(): DOMRect | undefined {
    if (!this.state.rect) {
      return undefined;
    }
    return this.state.element?.getBoundingClientRect();
  }
}
