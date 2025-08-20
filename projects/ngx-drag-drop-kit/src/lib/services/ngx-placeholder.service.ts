import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Subject, distinctUntilChanged } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { IUpdatePlaceholder } from '../../interfaces/update-placeholder';
import { getDragItemIndex, getFirstLevelDraggables } from '../../utils/element.helper';

@Injectable({
  providedIn: 'root',
})
export class NgxDragPlaceholderService {
  private _renderer: Renderer2;
  public placeholder?: HTMLElement;
  public currentDragIndex = 0;
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
            prev.isAfter == curr.isAfter &&
            prev.destinationDropList == curr.destinationDropList;
          // console.log('mustBeCancel', mustBeCancel);
          return mustBeCancel;
        })
        // throttleTime(100)
      )
      .subscribe((input) => {
        this.updatePlaceHolder(input);
        console.log(input.isAfter, 'p', input.previousDragIndex, 'c', this.currentDragIndex);
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
    const { dragItem, currentDragRec, destinationDropList, dragOverItem } = input;
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
        dragItem.el.insertAdjacentElement('afterend', this.placeholder);
      }
      // drag to other list
      else {
        // when has over item
        if (dragOverItem) {
          dragOverItem.el.insertAdjacentElement('afterend', this.placeholder);
        }
        // add to end of children
        else {
          destinationDropList.el.insertAdjacentElement('beforeend', this.placeholder);
          this.currentDragIndex = destinationDropList.dragItems.length;
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
    this.currentDragIndex = 0;
  }

  /*--------------------------------------------*/
  private updatePlaceholderPosition(input: IUpdatePlaceholder) {
    const { dragItem, dragOverItem, destinationDropList, isAfter, overItemRec, previousDragIndex } = input;
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
    let i = getDragItemIndex(dragOverItem, destinationDropList);
    if (isSelfList) {
      this.currentDragIndex = !isAfter ? i - 1 : i;
    } else {
      this.currentDragIndex = i + 1;
    }
    if (this.currentDragIndex < 0) {
      return;
    }

    // console.log(input);
    const isVertical = destinationDropList.direction === 'vertical';
    const placeHolderRect = this.placeholder?.getBoundingClientRect();
    const plcHeight = placeHolderRect?.height ?? 0;
    const plcWidth = placeHolderRect?.width ?? 0;

    const dragItems: HTMLElement[] = getFirstLevelDraggables(destinationDropList.el);
    const shiftMap = this.getShiftMap(dragItems.length, previousDragIndex, isSelfList);
    console.log(
      'previousDragIndex',
      previousDragIndex,
      'currentDragIndex',
      this.currentDragIndex,
      'isAfter',
      isAfter,
      'map=',
      shiftMap
    );
    for (let i = 0; i < dragItems.length; i++) {
      if (dragItems[i] == dragItem.el) continue;
      const el = dragItems[i];
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

      this._renderer.setStyle(el, 'transform', `translate(${offsetX}px, ${offsetY}px)`);
    }

    //placeholder
    if (dragOverItem && overItemRec && this.placeholder) {
      const baseCurrentX = this.placeholder.offsetLeft;
      const baseCurrentY = this.placeholder.offsetTop;
      const baseTargetX = dragOverItem.el.offsetLeft;
      const baseTargetY = dragOverItem.el.offsetTop;
      let deltaX = baseTargetX - baseCurrentX;
      let deltaY = baseTargetY - baseCurrentY;
      //TODO: در هنگامی لیست مبدا و مقصد متفاوت است باید تشخیص داد رو به پایین حرکت میکنیم یا نه
      if (this.currentDragIndex > previousDragIndex && !isAfter) {
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
   * @param previousDragIndex   ایندکس placeholder در DOM
   */
  private getShiftMap(count: number, previousDragIndex: number, isSelfList: boolean): ('ahead' | 'behind' | 'none')[] {
    const result: ('ahead' | 'behind' | 'none')[] = new Array(count).fill('none');

    if (previousDragIndex == this.currentDragIndex && isSelfList) {
      return result;
    }

    let moveDown = false;
    if (isSelfList && this.currentDragIndex > previousDragIndex) {
      moveDown = true;
    } else if (!isSelfList) {
      //TODO: در هنگامی لیست مبدا و مقصد متفاوت است باید تشخیص داد رو به پایین حرکت میکنیم یا نه
    }

    // move down or left
    if (moveDown) {
      for (let i = previousDragIndex; i <= this.currentDragIndex; i++) {
        result[i] = 'behind';
      }
    }
    // move up or right
    else {
      for (let i = this.currentDragIndex; i <= previousDragIndex; i++) {
        result[i] = 'ahead';
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
    debugger;
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
    } else {
      destinationDropList.el.insertAdjacentElement('afterbegin', this.placeholder);
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
