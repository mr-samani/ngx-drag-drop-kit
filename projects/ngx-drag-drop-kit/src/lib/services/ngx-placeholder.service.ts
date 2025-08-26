import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged, throttleTime } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { IUpdatePlaceholder } from '../../interfaces/update-placeholder';
import { getDragItemIndex, getFirstLevelDraggables } from '../../utils/element.helper';

@Injectable({
  providedIn: 'root',
})
export class NgxDragPlaceholderService {
  private _renderer: Renderer2;
  private placeholder?: HTMLElement;
  public overItemIndex = 0;
  private placeholderIndex = 0;
  public updatePlaceholder$ = new Subject<IUpdatePlaceholder>();
  public isShown: boolean = false;

  constructor(rendererFactory: RendererFactory2, @Inject(DOCUMENT) private _document: Document) {
    this._renderer = rendererFactory.createRenderer(null, null);
    this.updatePlaceholder$
      .pipe(
        distinctUntilChanged((prev, curr) => {
          let mustBeCancel =
            prev.state == curr.state &&
            prev.dragOverItem == curr.dragOverItem &&
            prev.dragItem == curr.dragItem &&
            // prev.isAfter == curr.isAfter &&
            prev.destinationDropList == curr.destinationDropList;
          // console.log('mustBeCancel', mustBeCancel);
          return mustBeCancel;
        }),
        throttleTime(50)
        //debounceTime(300)
      )
      .subscribe((input) => {
        this.updatePlaceHolder(input);
      });
  }

  private updatePlaceHolder(input: IUpdatePlaceholder) {
    switch (input.state) {
      case 'show':
        this.showPlaceholder(input);
        break;
      case 'hidden':
        this.hidePlaceholder();
        break;
      case 'update':
        this.updatePlaceholderPosition(input);
        break;
    }
  }

  /**
   * create placeholder after drag item
   * @param input
   * @returns
   */
  private showPlaceholder(input: IUpdatePlaceholder) {
    const { dragItem, currentDragRec, destinationDropList, dragOverItem, isAfter } = input;
    if (!destinationDropList) return;
    if (destinationDropList.disableSort || destinationDropList.checkAllowedConnections(dragItem.dropList) == false)
      return;
    if (destinationDropList.isFlexWrap) {
      return this.inPlaceShowPlaceholder(input);
    }
    if (!this.placeholder || this.placeholder.parentElement != destinationDropList.el) {
      this.hidePlaceholder();
    }
    if (!this.placeholder) {
      this.placeholder = destinationDropList.addPlaceholder(currentDragRec);
      // source is equal with destination
      if (dragItem.dropList == destinationDropList) {
        dragItem.el.insertAdjacentElement(isAfter ? 'afterend' : 'beforebegin', this.placeholder);
        this.placeholderIndex = getDragItemIndex(dragItem, dragItem.dropList);
      }
      // drag to other list
      else {
        // when has over item
        if (dragOverItem) {
          dragOverItem.el.insertAdjacentElement(isAfter ? 'afterend' : 'beforebegin', this.placeholder);
          this.placeholderIndex = getDragItemIndex(dragOverItem, dragOverItem.dropList);
        }
        // add to end of children
        else {
          destinationDropList.el.insertAdjacentElement('beforeend', this.placeholder);
          this.placeholderIndex = destinationDropList.dragItems.length;
          this.overItemIndex = destinationDropList.dragItems.length;
        }
      }
    }
    this.isShown = true;
  }

  private hidePlaceholder() {
    if (this.placeholder) {
      this.placeholder.remove();
    }
    this.placeholder = undefined;
    document
      .querySelectorAll('.ngx-draggable:not(.dargging):not(.ngx-drag-in-body),.ngx-drag-placeholder')
      .forEach((el) => {
        this._renderer.removeStyle(el, 'transform');
      });
    this.isShown = false;
    this.overItemIndex = 0;
    this.placeholderIndex = 0;
  }

  /*--------------------------------------------*/
  private updatePlaceholderPosition(input: IUpdatePlaceholder) {
    const { dragItem, dragOverItem, destinationDropList, isAfter, overItemRec } = input;
    if (!destinationDropList) return;
    if (destinationDropList.disableSort || destinationDropList.checkAllowedConnections(dragItem.dropList) == false)
      return;
    if (destinationDropList.isFlexWrap) {
      this.inPlaceUpdatePlaceholderPosition(input);
      return;
    }
    this.showPlaceholder(input);

    if (!dragOverItem || !overItemRec) {
      return;
    }
    const isSelfList = dragItem.dropList?.el == dragOverItem.dropList?.el;
    const dragItems = destinationDropList.dragItems;
    this.overItemIndex = getDragItemIndex(dragOverItem, destinationDropList);
    // اگر رفت روی یک ایتم و جابجا شد و دوباره رفت روی همان ایتم باید مجددا جابجا شود
    // if (isAfter && isSelfList && this.overItemIndex > this.placeholderIndex) {
    //   this.overItemIndex--;
    // } else if (isAfter && !isSelfList) {
    //   this.overItemIndex++;
    // }
    // if (this.overItemIndex < 0) {
    //   return;
    // }
    // console.log(input);
    const isVertical = destinationDropList.direction === 'vertical';
    const placeHolderRect = this.placeholder?.getBoundingClientRect();
    const plcHeight = placeHolderRect?.height ?? 0;
    const plcWidth = placeHolderRect?.width ?? 0;
    const shiftMap = this.getShiftMap(dragItems.length, isSelfList, isAfter);
    console.log(
      'placeholderIndex',
      this.placeholderIndex,
      'overItemIndex',
      this.overItemIndex,
      'isAfter',
      isAfter,
      'map=',
      shiftMap
    );
    for (let i = 0; i < dragItems.length; i++) {
      if (dragItems[i].el == dragItem.el) continue;
      let offsetX = 0;
      let offsetY = 0;
      const dir = shiftMap[i];
      if (isVertical) {
        if (dir == 'ahead') {
          offsetY = +plcHeight;
        } else if (dir == 'behind') {
          offsetY = -plcHeight;
        }
      }
      // horizontal
      else {
        const direction = destinationDropList.isRtl ? -1 : 1;
        if (dir == 'ahead') {
          offsetX = +plcWidth * direction;
        } else if (dir == 'behind') {
          offsetX = -plcWidth * direction;
        }
      }

      dragItems[i].transformedXY = { x: offsetX, y: offsetY };
      this._renderer.setStyle(dragItems[i].el, 'transform', `translate(${offsetX}px, ${offsetY}px)`);
    }

    //placeholder
    if (overItemRec && this.placeholder) {
      const baseCurrentX = this.placeholder.offsetLeft;
      const baseCurrentY = this.placeholder.offsetTop;
      let deltaX = 0;
      let deltaY = 0;
      if (dragItems[this.overItemIndex] && this.overItemIndex != this.placeholderIndex) {
        //&& dragItems[this.overItemIndex].el != dragItem.el) {
        const baseTargetX = dragItems[this.overItemIndex].el.offsetLeft;
        const baseTargetY = dragItems[this.overItemIndex].el.offsetTop;
        deltaX = baseTargetX - baseCurrentX;
        deltaY = baseTargetY - baseCurrentY;
      }
      if (isAfter && this.overItemIndex > this.placeholderIndex) {
        deltaY -= plcHeight;
      }
      const placeholderTransform = `translate(${deltaX}px, ${deltaY}px)`;
      this._renderer.setStyle(this.placeholder, 'transform', placeholderTransform);
    }
  }

  /**
   * خروجی برای هر آیتم میگه باید بره جلو (ahead) یا عقب (behind) یا هیچ تغییری نکنه (none)
   *
   * @param count      تعداد آیتم‌های لیست
   * @param isSelfList  when previousContainer == currentContainer
   */
  private getShiftMap(count: number, isSelfList: boolean, isAfter: boolean): ('ahead' | 'behind' | 'none')[] {
    const result: ('ahead' | 'behind' | 'none')[] = new Array(count).fill('none');

    if (this.placeholderIndex == this.overItemIndex) {
      return result;
    }

    // move down or left
    if (this.overItemIndex > this.placeholderIndex) {
      //previous items of placeholder must be move to up
      if (isAfter) {
        for (let i = this.placeholderIndex; i < this.overItemIndex; i++) {
          if (result[i]) result[i] = 'behind';
        }
      } else {
        for (let i = this.placeholderIndex; i <= this.overItemIndex; i++) {
          if (result[i]) result[i] = 'behind';
        }
      }
    }
    // move up or right
    else {
      //next items of placeholder must be move to down
      if (isSelfList) {
        for (let i = this.overItemIndex; i < this.placeholderIndex; i++) {
          if (result[i]) result[i] = 'ahead';
        }
      } else {
        for (let i = this.overItemIndex; i <= this.placeholderIndex; i++) {
          if (result[i]) result[i] = 'ahead';
        }
      }
    }

    return result;
  }

  /*------------------------------------when in place codes... ----------------------------------------------------*/

  private inPlaceShowPlaceholder(input: IUpdatePlaceholder) {
    const { dragItem, currentDragRec, destinationDropList, isAfter, dragOverItem } = input;
    if (!destinationDropList) return;
    if (destinationDropList.disableSort || destinationDropList.checkAllowedConnections(dragItem.dropList) == false)
      return;
    this.hidePlaceholder();
    this.placeholder = this._document.createElement('div');
    this.placeholder.style.display = 'inline-block';
    this.placeholder.style.pointerEvents = 'none';
    this.placeholder.style.position = 'relative';

    this.placeholder.className = 'ngx-drag-placeholder';
    if (currentDragRec) {
      this._renderer.setStyle(this.placeholder, 'width', currentDragRec.width + 'px');
      this._renderer.setStyle(this.placeholder, 'height', currentDragRec.height + 'px');
    }

    if (dragOverItem && dragOverItem.dropList == destinationDropList) {
      dragOverItem.el.insertAdjacentElement(isAfter ? 'afterend' : 'beforebegin', this.placeholder);
      this.placeholderIndex = getDragItemIndex(dragOverItem, dragOverItem.dropList);
    } else {
      destinationDropList.el.insertAdjacentElement('beforeend', this.placeholder);
      this.placeholderIndex = 0;
    }
    this.isShown = true;
  }

  /*--------------------------------------------*/

  private inPlaceUpdatePlaceholderPosition(input: IUpdatePlaceholder) {
    const { dragItem, destinationDropList, dragOverItem } = input;
    if (!destinationDropList) return;
    if (destinationDropList.disableSort || destinationDropList.checkAllowedConnections(dragItem.dropList) == false)
      return;
    this.inPlaceShowPlaceholder(input);
    if (!this.isShown) return;
    let els: HTMLElement[] = [];
    if (dragOverItem && dragOverItem.dropList) {
      els = Array.from(dragOverItem.dropList.el.querySelectorAll('.ngx-draggable,.ngx-drag-placeholder'));
    }
  }
}
