import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged, throttleTime } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { IUpdatePlaceholder } from '../../interfaces/update-placeholder';
import { getFirstLevelDraggables } from '../../utils/element.helper';
import { getXYfromTransform } from '../../utils/get-transform';

@Injectable({
  providedIn: 'root',
})
export class NgxDragPlaceholderService {
  private _renderer: Renderer2;
  public placeholder?: HTMLElement;
  public index = 0;
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
            prev.currentDrag == curr.currentDrag &&
            // prev.isAfter == curr.isAfter &&
            prev.dropList == curr.dropList;
          // console.log('mustBeCancel', mustBeCancel);
          return mustBeCancel;
        })
        // throttleTime(100)
      )
      .subscribe((input) => {
        if (input.dragOverItem && input.position) {
          const scrollX = window.scrollX;
          const scrollY = window.scrollY;
          const size =
            input.dragOverItem.dropList?.direction === 'horizontal'
              ? input.dragOverItem.domRect.width
              : input.dragOverItem.domRect.height;
          const threshold = Math.min(25, size * 0.15); // هیسترزیس وابسته به اندازه
          const transformed = getXYfromTransform(input.dragOverItem.el); //{ x: 0, y: 0 };;

          if (input.dragOverItem.dropList?.direction === 'horizontal') {
            const midpoint =
              input.dragOverItem.domRect.left + scrollX + transformed.x + input.dragOverItem.domRect.width / 2;
            input.isAfter = input.dropList.isRtl
              ? input.position.x < midpoint - threshold
              : input.position.x > midpoint + threshold;
          } else {
            const midpoint =
              input.dragOverItem.domRect.top + scrollY + transformed.y + input.dragOverItem.domRect.height / 2;
            input.isAfter = input.position.y > midpoint + threshold;
          }
        }

        this.updatePlaceHolder(input);
        input.dropList.dragItems.forEach((el) => el.updateDomRect());
      });
  }

  private updatePlaceHolder(input: IUpdatePlaceholder) {
    // console.log('updateposition', input.dropList?.el.id, input.state);

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
    if (input.dropList.disableSort || input.dropList.checkAllowedConnections(input.currentDrag.dropList) == false)
      return;
    if (input.dropList.isFlexWrap) {
      return this.inPlaceShowPlaceholder(input);
    }
    if (!this.placeholder || this.placeholder.parentElement != input.dropList.el) {
      this.hidePlaceholder();
    }
    if (!this.placeholder) {
      this.placeholder = input.dropList.addPlaceholder(input.currentDragRec);
      // source is equal with destination
      if (input.currentDrag.dropList == input.dropList) {
        input.currentDrag.el.insertAdjacentElement('afterend', this.placeholder);
      }
      // drag to other list
      else {
        // when has over item
        if (input.dragOverItem) {
          input.dragOverItem.el.insertAdjacentElement('afterend', this.placeholder);
        }
        // add to end of children
        else {
          input.dropList.el.insertAdjacentElement('beforeend', this.placeholder);
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
  }

  /*--------------------------------------------*/
  private updatePlaceholderPosition(input: IUpdatePlaceholder) {
    //console.log((input.isAfter ? 'After: ' : 'Before: ') + input.dragOverItem?.el?.id);
    if (input.dropList.disableSort || input.dropList.checkAllowedConnections(input.currentDrag.dropList) == false)
      return;
    if (input.dropList.isFlexWrap) {
      this.inPlaceUpdatePlaceholderPosition(input);
      return;
    }
    const { currentDrag, dragOverItem, dropList, isAfter, overItemRec } = input;
    this.showPlaceholder(input);

    if (!dragOverItem || !overItemRec) {
      return;
    }

    // console.log(input);
    const isSelfList = currentDrag.dropList == dragOverItem?.dropList;
    const isVertical = dropList.direction === 'vertical';
    const placeHolderRect = this.placeholder?.getBoundingClientRect();
    const plcHeight = placeHolderRect?.height ?? 0;
    const plcWidth = placeHolderRect?.width ?? 0;

    // ✅ جابجا کردن سایر آیتم‌ها
    const dragItems: HTMLElement[] = getFirstLevelDraggables(dropList.el);
    const overIndex = dragOverItem ? dragItems.findIndex((x) => x === dragOverItem.el) : -1;
    let plcIndex = dragItems.findIndex((x) => x === currentDrag.el);

    if (plcIndex == -1) {
      if (isAfter) {
        plcIndex = overIndex + 1;
      } else {
        plcIndex = overIndex > 0 ? overIndex - 1 : 0;
      }
    }
    console.log('over', dragOverItem.el.id, overIndex, 'isAfter', isAfter);
    const shiftMap = this.getShiftMap(
      dragItems.length,
      overIndex,
      plcIndex,
      isAfter == true,
      //isVertical,
     // dropList.isRtl
    );
    console.log('plcIndex', plcIndex, 'overIndex', overIndex, 'isAfter', isAfter, 'map=', shiftMap);
    for (let i = 0; i < dragItems.length; i++) {
      if (dragItems[i] == currentDrag.el) continue;
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
        const direction = dropList.isRtl ? -1 : 1;
        if (dir == 'ahead') {
          offsetX = +plcWidth * direction;
        } else if (dir == 'behind') {
          offsetX = -plcWidth * direction;
        }
      }

      this._renderer.setStyle(el, 'transform', `translate(${offsetX}px, ${offsetY}px)`);
    }

    if (currentDrag.dropList == dragOverItem?.dropList || !isAfter) {
      this.index = overIndex >= 0 ? overIndex : 0;
    } else {
      this.index = overIndex >= 0 ? overIndex + 1 : 0;
    }
    //✅ تنظیم دقیق موقعیت placeholder بعد از جابجایی آیتم‌ها
    if (dragOverItem && overItemRec && this.placeholder) {
      const baseCurrentX = this.placeholder.offsetLeft;
      const baseCurrentY = this.placeholder.offsetTop;
      const baseTargetX = dragOverItem.el.offsetLeft;
      const baseTargetY = dragOverItem.el.offsetTop;
      let deltaX = baseTargetX - baseCurrentX;
      let deltaY = baseTargetY - baseCurrentY;
      if (overIndex > plcIndex && !isAfter) {
        deltaY -= plcHeight;
      }
      const placeholderTransform = `translate(${deltaX}px, ${deltaY}px)`;
      this._renderer.setStyle(this.placeholder, 'transform', placeholderTransform);
    }
    // console.log('isAfter', isAfter, 'overIndex', overIndex, 'currentIdndex', this.index);
  }

  /**
   * جهتِ جابجایی (shift) آیتم i را نسبت به وضعیت جاری درگ تعیین می‌کند.
   */
  // private getItemShiftDirection(
  //   i: number,
  //   overIndex: number,
  //   plcIndex: number,
  //   isAfter: boolean
  // ): 'ahead' | 'behind' | 'none' {
  //   // حرکت رو به پایین (plcIndex < overIndex)
  //   if (plcIndex < overIndex) {
  //     if (i > plcIndex && i <= overIndex) {
  //       return isAfter ? 'ahead' : 'behind';
  //     }
  //   }
  //   // حرکت رو به بالا (plcIndex > overIndex)
  //   else if (plcIndex > overIndex) {
  //     if (i >= overIndex && i < plcIndex) {
  //       return isAfter ? 'ahead' : 'behind';
  //     }
  //   }
  //   return 'none';
  // }
  /**
   * خروجی برای هر آیتم میگه باید بره جلو (ahead) یا عقب (behind) یا هیچ تغییری نکنه (none)
   *
   * @param count      تعداد آیتم‌های لیست
   * @param overIndex  ایندکس آیتمی که موس روشه
   * @param plcIndex   ایندکس placeholder در DOM
   * @param isAfter    placeholder قبل یا بعد از آیتم مقصد درج شده؟
   * @param isVertical جهت لیست (true=عمودی, false=افقی)
   * @param isRtl      فقط وقتی افقی هست مهم میشه (true=RTL)
   */
  private getShiftMap(
    count: number,
    overIndex: number,
    plcIndex: number,
    isAfter: boolean
  ): ('ahead' | 'behind' | 'none')[] {
   const result: ('ahead' | 'behind' | 'none')[] = new Array(count).fill('none');
  if (overIndex < 0 || plcIndex < 0 || overIndex >= count || plcIndex >= count) {
    return result;
  }

  if (plcIndex < overIndex) {
    // حرکت به پایین → همه آیتم‌های بین plcIndex و overIndex باید برن عقب
    for (let i = plcIndex + 1; i <= overIndex; i++) {
      result[i] = isAfter ? 'ahead' : 'behind';
    }
  } else if (plcIndex > overIndex) {
    // حرکت به بالا → همه آیتم‌های بین overIndex و plcIndex باید برن جلو
    for (let i = overIndex; i < plcIndex; i++) {
      result[i] = isAfter ? 'ahead' : 'behind';
    }
  }

  return result;
  }

  /*------------------------------------when in place codes... ----------------------------------------------------*/

  private inPlaceShowPlaceholder(input: IUpdatePlaceholder) {
    if (input.dropList.disableSort || input.dropList.checkAllowedConnections(input.currentDrag.dropList) == false)
      return;
    debugger;
    this.hidePlaceholder();
    this.placeholder = this._document.createElement('div');
    this.placeholder.style.display = 'inline-block';
    this.placeholder.style.pointerEvents = 'none';
    this.placeholder.style.position = 'relative';

    this.placeholder.className = 'ngx-drag-placeholder';
    if (input.currentDragRec) {
      this._renderer.setStyle(this.placeholder, 'width', input.currentDragRec.width + 'px');
      this._renderer.setStyle(this.placeholder, 'height', input.currentDragRec.height + 'px');
    }
    if (input.dragOverItem && input.dragOverItem.dropList == input.dropList) {
      input.dragOverItem.el.insertAdjacentElement(input.isAfter ? 'afterend' : 'beforebegin', this.placeholder);
    } else {
      input.dropList.el.insertAdjacentElement('afterbegin', this.placeholder);
    }
    this.isShown = true;
  }

  /*--------------------------------------------*/

  private inPlaceUpdatePlaceholderPosition(input: IUpdatePlaceholder) {
    if (input.dropList.disableSort || input.dropList.checkAllowedConnections(input.currentDrag.dropList) == false)
      return;
    this.inPlaceShowPlaceholder(input);
    if (!this.isShown) return;
    let els: HTMLElement[] = [];
    if (input.dragOverItem && input.dragOverItem.dropList) {
      els = Array.from(input.dragOverItem.dropList.el.querySelectorAll('.ngx-draggable,.ngx-drag-placeholder'));
    }

    if (els.length > 0) {
      this.index = els.findIndex((x) => x == this.placeholder);
    } else {
      this.index = 0;
    }
  }
}
