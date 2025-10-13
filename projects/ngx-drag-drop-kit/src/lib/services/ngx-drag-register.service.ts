import { Injectable } from '@angular/core';
import { IDropList } from '../../interfaces/IDropList';
import { IDragItem } from '../../interfaces/IDragItem';

@Injectable({ providedIn: 'root' })
export class NgxDragRegisterService {
  private dropListMap = new Map<Element, IDropList>();
  private dragItemMap = new Map<HTMLElement, IDragItem>();
  private dropListArray: IDropList[] = [];

  get dropListItems(): ReadonlyArray<IDropList> {
    return this.dropListArray;
  }

  get dargItems(): ReadonlyMap<HTMLElement, IDragItem> {
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

  registerDragItem(dragItem: IDragItem): void {
    const dropList = this.findParentDropList(dragItem.el);
    if (dropList) {
      dragItem.dropList = dropList;
      dropList.registerDragItem(dragItem);
    }
    this.dragItemMap.set(dragItem.el, dragItem);
  }

  removeDragItem(dragItem: IDragItem): void {
    if (dragItem.dropList) {
      dragItem.dropList.removeDragItem(dragItem);
    }
    this.dragItemMap.delete(dragItem.el);
  }

  getDragItemIndex(dragItem: IDragItem): number {
    if (!dragItem.dropList) return -1;
    return dragItem.dropList.dragItems.indexOf(dragItem);
  }

  updateAllDragItemsRect(): void {
    for (const dropList of this.dropListArray) {
      // Skip hidden elements
      if (dropList.el.offsetParent === null) continue;

      dropList.updateDomRect();

      for (const item of dropList.dragItems) {
        // Skip hidden items
        if (item.el.offsetParent === null) continue;
        item.updateDomRect();
      }
    }
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
    for (let list of this.dropListArray) {
      const listElement = list.el;
      if (!listElement) continue;

      const rect = listElement.getBoundingClientRect();

      if (pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom) {
        return list;
      }
    }
    return undefined;
  }

  /**
   * Get Item index from viewport pointer
   * @param items draggable items
   * @param drag current draggable element
   * @param pointer viewport pointer
   * @param isVertical is vertical
   * @param placeHolderIndex placeholder index
   * @returns item index
   */
  _getItemIndexFromPointerPosition(
    items: IDragItem[],
    drag: HTMLElement,
    pointer: { x: number; y: number },
    isVertical: boolean,
    placeHolderIndex: number
  ): number {
    const axis = isVertical ? 'y' : 'x';
    let index = -1;
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].domRect;
      const start = Math.floor(isVertical ? rect.top : rect.left);
      const end = Math.floor(isVertical ? rect.bottom : rect.right);
      const isSelf = drag == items[i].el;
      // آیا موس داخل این آیتم است؟
      if (pointer[axis] >= start && pointer[axis] <= end) {
        // محاسبه center این آیتم
        const center = start + (end - start) / 2;

        // تصمیم‌گیری: کدام طرف center است؟
        if (pointer[axis] < center || isSelf) {
          index = i; // نصف بالایی/چپی → همین index
        } else {
          index = i + 1; // نصف پایینی/راستی → index بعدی
        }
        break;
      }
    }
    if (index === -1) {
      return items.length; // انتهای لیست
    }

    return index;
  }

  _getDragItemFromIndex(dropList: IDropList, index: number): IDragItem | undefined {
    return dropList.dragItems[index];
  }
}
