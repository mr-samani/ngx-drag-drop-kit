import { Injectable } from '@angular/core';
import { IDropList } from '../../interfaces/IDropList';
import { IPosition } from '../../interfaces/IPosition';
import { DragItemRef } from '../directives/DragItemRef';

export declare type CordPosition = 'TopLeft' | 'TopRight' | 'BottomLeft' | 'BottomRight';

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
      return dragItem.dropList.dragItems.filter((x) => !x.isDragging).indexOf(dragItem);
    }

    return dragItem.dropList.dragItems.indexOf(dragItem);
  }

  updateAllDragItemsRect(dropList: IDropList[] = this.dropListArray): void {
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
  }

  private findParentDropList(element: HTMLElement): IDropList | null {
    const container = element.closest('[ngxDropList]');
    if (!container) return null;
    return this.dropListMap.get(container) ?? null;
  }

  /**
   * Get DropList from viewport pointer
   * @param pointer viewport pointer
   * @returns droplist
   */
  _getDropListFromPointerPosition(pointer: { x: number; y: number }): IDropList | undefined {
    let matchedLists: { list: IDropList; area: number }[] = [];

    for (const list of this.dropListArray) {
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
    dropList: IDropList,
    pointer: IPosition
  ): { index: number; cord: CordPosition | undefined; dragItem: DragItemRef | undefined } {
    const items = dropList.dragItems;
    if (items.length === 0) {
      return { index: 0, cord: undefined, dragItem: undefined };
    }

    let closestIndex = -1;
    let isTop = false;
    let isLeft = false;

    // موقعیت موس
    const px = pointer.x;
    const py = pointer.y;

    for (let i = 0; i < items.length; i++) {
      const lastRect = items[i].domRect;

      if (px > lastRect.left && px < lastRect.right && py > lastRect.top && py < lastRect.bottom) {
        // موس داخل آیتم است
        closestIndex = i;
        isTop = py < lastRect.top + lastRect.height / 2;
        isLeft = px < lastRect.left + lastRect.width / 2;
        break;
      }
    }
    const cord = isTop ? (isLeft ? 'TopLeft' : 'TopRight') : isLeft ? 'BottomLeft' : 'BottomRight';

    // تعیین index نهایی
    if (closestIndex < 0) {
      return { index: 0, cord, dragItem: undefined };
    }

    // اگر موس پایین‌تر/راست‌تر از مرکز آیتم است، placeholder بعد از آن قرار گیرد
    const dragItem = items[Math.min(closestIndex, items.length - 1)];
    console.log(dropList.el?.id, dragItem?.el.id, 'closestIndex', closestIndex, cord);

    return { index: closestIndex, cord, dragItem };
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
    const dragItem = isSameList ? dragItems.filter((x) => !x.isPlaceholder)[index] : dragItems[index];
    return dragItem;
  }
}
