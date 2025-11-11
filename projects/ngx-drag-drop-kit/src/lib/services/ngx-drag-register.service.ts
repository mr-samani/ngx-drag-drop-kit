import { Injectable } from '@angular/core';
import { IDropList } from '../../interfaces/IDropList';
import { IPosition } from '../../interfaces/IPosition';
import { DragItemRef } from '../directives/DragItemRef';

export class CordPosition {
  isTop: boolean;
  isLeft: boolean;
  isRight: boolean;
  isBottom: boolean;

  constructor() {
    this.isTop = false;
    this.isLeft = false;
    this.isRight = false;
    this.isBottom = false;
  }
}

@Injectable({ providedIn: 'root' })
export class NgxDragRegisterService {
  private dropListMap = new Map<Element, IDropList>();
  private dragItemMap = new Map<HTMLElement, DragItemRef>();
  private dropListArray: IDropList[] = [];

  get dropListItems(): ReadonlyArray<IDropList> {
    return this.dropListArray;
  }

  get dargItems(): ReadonlyMap<HTMLElement, DragItemRef> {
    return this.dragItemMap;
  }
  get dropList(): ReadonlyMap<Element, IDropList> {
    return this.dropListMap;
  }

  registerDropList(dropList: IDropList): void {
    if (!dropList.el) {
      throw new Error('DropList must have an element');
    }
    this.dropListMap.set(dropList.el, dropList);
    this.dropListArray.push(dropList);
  }

  removeDropList(dropList: IDropList): void {
    this.dropListMap.delete(dropList.el);
    const index = this.dropListArray.indexOf(dropList);
    if (index > -1) {
      this.dropListArray.splice(index, 1);
    }
  }

  registerDragItem(dragItem: DragItemRef): void {
    const dropList = this.findParentDropList(dragItem.el);
    if (dropList) {
      dragItem.dropList = dropList;
      dropList.registerDragItem(dragItem);
    }
    this.dragItemMap.set(dragItem.el, dragItem);
  }

  removeDragItem(dragItem: DragItemRef): void {
    if (dragItem.dropList) {
      dragItem.dropList.removeDragItem(dragItem);
    }
    this.dragItemMap.delete(dragItem.el);
  }

  getDragItemIndex(dragItem: DragItemRef, filterDraggingItem = false): number {
    if (!dragItem.dropList) return -1;

    if (filterDraggingItem) {
      return dragItem.dropList.dragItems.filter(x => !x.isDragging).indexOf(dragItem);
    }

    return dragItem.dropList.dragItems.indexOf(dragItem);
  }

  updateAllDragItemsRect(dropList: IDropList[] = this.dropListArray): Promise<void> {
    return new Promise(resolve => {
      for (const lst of dropList) {
        // Skip hidden elements
        if (lst.el.offsetParent === null) continue;

        lst.updateDomRect();

        for (const item of lst.dragItems) {
          // Skip hidden items
          if (item.el.offsetParent === null) continue;
          item.updateDomRect();
        }

        lst.dragItems = lst.dragItems.sort((a, b) => {
          const ay = a.domRect.top;
          const by = b.domRect.top;

          // اگر یکی بالاتر از دیگریه، بر اساس top مرتب کن
          if (Math.abs(ay - by) > 1) return ay - by;

          // در یک ردیف هستند → بر اساس left مرتب کن (با توجه به RTL)
          const ax = a.domRect.left;
          const bx = b.domRect.left;

          if (lst.isRtl) {
            return bx - ax; // راست به چپ
          } else {
            return ax - bx; // چپ به راست
          }
        });
      }
      // console.log(
      //   dropList.map((m) => {
      //     return m.dragItems.map((mm) => {
      //       return { id: mm.el.id, rect: mm._domRect.y };
      //     });
      //   })
      // );
      resolve();
    });
  }

  private findParentDropList(element: HTMLElement): IDropList | null {
    const container = element.closest('[ngxDropList]');
    if (!container) return null;
    return this.dropListMap.get(container) ?? null;
  }

  /**
   * Get DropList from viewport pointer
   * @param drag current drag item
   * @param pointer viewport pointer
   * @returns droplist
   */
  _getDropListFromPointerPosition(pointer: { x: number; y: number }, drag: DragItemRef): IDropList | undefined {
    let matchedLists: { list: IDropList; area: number }[] = [];
    // فقط DropListهایی که داخل آیتم درگ‌شده نیستند
    const filteredList = this.dropListArray.filter(x => !drag.el.contains(x.el));
    for (const list of filteredList) {
      const el = list.el;
      if (!el) continue;

      const rect = el.getBoundingClientRect();
      const inside =
        pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom;

      if (inside) {
        const area = (rect.right - rect.left) * (rect.bottom - rect.top);
        matchedLists.push({ list, area });
      }
    }

    if (matchedLists.length === 0) return undefined;

    // داخلی‌ترین = کوچک‌ترین مساحت (rect کوچکتر)
    matchedLists.sort((a, b) => a.area - b.area);
    return matchedLists[0].list;
  }

  /**
   * Get Item index from viewport pointer
   * @param items draggable items
   * @param pointer viewport pointer
   * @param isVertical is vertical
   * @returns item index
   */
  _getItemIndexFromPointerPosition(
    dragItem: DragItemRef,
    dropList: IDropList,
    pointer: IPosition,
    currentPlaceholderIndex: number
  ): { index: number; dragItem?: DragItemRef; before: boolean } {
    const items = dropList.dragItems.filter(x => !x.isPlaceholder);

    if (items.length === 0) {
      return { index: 0, dragItem: undefined, before: false };
    }

    const px = pointer.x;
    const py = pointer.y;

    // ─────────────────────────────────────────────────────
    // STEP 1: پیدا کردن نزدیک‌ترین آیتم
    // ─────────────────────────────────────────────────────
    let closestItem: DragItemRef | undefined;
    let closestIndex = -1;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rect = item.domRect;

      if (px >= rect.left && px <= rect.right && py >= rect.top && py <= rect.bottom) {
        closestItem = item;
        closestIndex = i;
      }
    }

    if (!closestItem) {
      return { index: currentPlaceholderIndex, dragItem: undefined, before: false };
    }

    // ─────────────────────────────────────────────────────
    // STEP 2: تشخیص کدوم edge نزدیکتره
    // ─────────────────────────────────────────────────────
    const rect = closestItem.domRect;
    const isVertical = closestItem.isFullRow;

    let cord = new CordPosition();
    let insertBefore = false; // آیا باید قبل از این آیتم insert بشه؟

    if (isVertical) {
      // لیست عمودی - چک کنیم به top نزدیکتریم یا bottom
      const distanceToTop = Math.abs(py - rect.top);
      const distanceToBottom = Math.abs(py - rect.bottom);

      insertBefore = distanceToTop < distanceToBottom;
      cord.isTop = insertBefore;
      cord.isBottom = !insertBefore;
    } else {
      // لیست افقی - چک کنیم به left نزدیکتریم یا right
      const distanceToLeft = Math.abs(px - rect.left);
      const distanceToRight = Math.abs(px - rect.right);

      if (dropList.isRtl) {
        insertBefore = distanceToRight < distanceToLeft;
        cord.isRight = insertBefore;
        cord.isLeft = !insertBefore;
      } else {
        insertBefore = distanceToLeft < distanceToRight;
        cord.isLeft = insertBefore;
        cord.isRight = !insertBefore;
      }
    }

    // ─────────────────────────────────────────────────────
    // STEP 3: محاسبه index نهایی
    // ─────────────────────────────────────────────────────

    // اگر باید قبل از آیتم باشه، همون index
    // اگر باید بعد از آیتم باشه، index + 1
    let newIndex = insertBefore ? closestIndex : closestIndex + 1;

    // ─────────────────────────────────────────────────────
    // STEP 4: تصحیح برای خود drag item
    // ─────────────────────────────────────────────────────

    // پیدا کردن index فعلی drag item (بدون placeholder)
    const dragItemCurrentIndex = items.findIndex(x => x.el === dragItem.el);

    if (dragItemCurrentIndex !== -1) {
      // اگر newIndex بعد از موقعیت فعلی dragItem هست،
      // باید یکی کم کنیم چون dragItem جاش خالی میشه
      if (newIndex > dragItemCurrentIndex) {
        newIndex--;
      }
    } else {
    }

    console.debug(
      closestItem.el.id,
      dropList.el?.id,
      'p',
      dragItemCurrentIndex,
      'c',
      closestIndex,
      'insertBefore',
      insertBefore,
      'finalIndex',
      newIndex
    );

    return { index: newIndex, before: insertBefore, dragItem: closestItem };
  }

  _getDragItemFromPointerPosition(
    items: DragItemRef[],
    pointer: IPosition,
    isVertical: boolean
  ): DragItemRef | undefined {
    const axis = isVertical ? 'y' : 'x';
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].domRect;
      const start = Math.floor(isVertical ? rect.top : rect.left);
      const end = Math.floor(isVertical ? rect.bottom : rect.right);
      // آیا موس داخل این آیتم است؟
      if (pointer[axis] >= start && pointer[axis] <= end) {
        return items[i];
      }
    }
    return undefined;
  }

  _getDragItemFromIndex(dragItems: DragItemRef[], index: number, isSameList: boolean): DragItemRef | undefined {
    const dragItem = isSameList ? dragItems.filter(x => !x.isPlaceholder)[index] : dragItems[index];
    return dragItem;
  }
}
