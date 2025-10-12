import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Subject, distinctUntilChanged, throttleTime } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { IUpdatePlaceholder } from '../../interfaces/update-placeholder';
import { getFirstLevelDraggables } from '../../utils/element.helper';
import { checkShiftItem } from '../../utils/check-shift-item';
import { NgxDragRegisterService } from './ngx-drag-register.service';

@Injectable({
  providedIn: 'root',
})
export class NgxDragPlaceholderService {
  private _renderer: Renderer2;
  private placeholder?: HTMLElement;
  /** placeholder transformed value (save previous value) */
  private plcT = { x: 0, y: 0 };
  private overItemIndex = 0;
  public currentIndex = 0;
  private placeholderIndex = 0;
  public updatePlaceholder$ = new Subject<IUpdatePlaceholder>();
  public isShown: boolean = false;

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private _document: Document,
    private dragRegister: NgxDragRegisterService
  ) {
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
        this.hidePlaceholder(input);
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
    const { dragItem, destinationDropList, dragOverItem, isAfter } = input;
    if (!destinationDropList) return;
    if (destinationDropList.disableSort || destinationDropList.checkAllowedConnections(dragItem.dropList) == false)
      return;
    if (destinationDropList.isFlexWrap) {
      return this.inPlaceShowPlaceholder(input);
    }
    if (!this.placeholder || this.placeholder.parentElement != destinationDropList.el) {
      this.hidePlaceholder(input);
    }
    if (!this.placeholder) {
      this.placeholder = destinationDropList.addPlaceholder(dragItem.domRect);
      // source is equal with destination
      if (dragItem.dropList == destinationDropList) {
        dragItem.el.insertAdjacentElement(isAfter ? 'afterend' : 'beforebegin', this.placeholder);
        this.placeholderIndex = this.dragRegister.getDragItemIndex(dragItem);
      }
      // drag to other list
      else {
        // when has over item
        if (dragOverItem) {
          dragOverItem.el.insertAdjacentElement(isAfter ? 'afterend' : 'beforebegin', this.placeholder);
          this.placeholderIndex = this.dragRegister.getDragItemIndex(dragOverItem);
        }
        // add to end of children
        else {
          destinationDropList.el.insertAdjacentElement('beforeend', this.placeholder);
          this.overItemIndex = destinationDropList.dragItems.length;
          this.placeholderIndex = destinationDropList.dragItems.length;
        }
      }

      this.currentIndex = this.placeholderIndex;
    }

    this.isShown = true;
  }

  private hidePlaceholder(input: IUpdatePlaceholder) {
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
    this.currentIndex = 0;
    this.plcT = { x: 0, y: 0 };
    input.destinationDropList?.disposePlaceholder();
  }

  /*--------------------------------------------*/
  private updatePlaceholderPosition(input: IUpdatePlaceholder) {
    const { dragItem, dragOverItem, destinationDropList, isAfter } = input;
    if (!destinationDropList) return;
    if (destinationDropList.disableSort || destinationDropList.checkAllowedConnections(dragItem.dropList) == false)
      return;
    if (destinationDropList.isFlexWrap) {
      this.inPlaceUpdatePlaceholderPosition(input);
      return;
    }
    this.showPlaceholder(input);

    if (!dragOverItem) {
      return;
    }
    const isSelfList = dragItem.dropList?.el == dragOverItem.dropList?.el;
    const dragItems = getFirstLevelDraggables(destinationDropList.el);
    this.overItemIndex = this.dragRegister.getDragItemIndex(dragOverItem);

    const isVertical = destinationDropList.direction === 'vertical';
    const placeHolderRect = this.placeholder?.getBoundingClientRect();
    const plcHeight = placeHolderRect?.height ?? 0;
    const plcWidth = placeHolderRect?.width ?? 0;

    // //placeholder
    if (dragOverItem && this.placeholder && placeHolderRect) {
      const ax = placeHolderRect.x;
      const ay = placeHolderRect.y;
      let deltaX = 0;
      let deltaY = 0;
      const bx = dragOverItem.domRect.x;
      const by = dragOverItem.domRect.y;
      deltaX = bx - ax;
      deltaY = by - ay;

      if (isVertical) {
        deltaY = this.plcT.y + deltaY;
      } else {
        if (isAfter) deltaX = this.plcT.x - deltaX;
        else deltaX = this.plcT.x + dragOverItem.domRect.width + deltaX;
      }
      this.plcT = { x: deltaX, y: deltaY };
      // console.log('plc', this.placeholderIndex, 'oi', this.overItemIndex, 'after', isAfter, 'self', isSelfList);
      const placeholderTransform = `translate(${deltaX}px, ${deltaY}px)`;
      this._renderer.setStyle(this.placeholder, 'transform', placeholderTransform);
    }

    // move other draggable items
    // console.log('overItemIndex:', this.overItemIndex, 'placeholderIndex:', this.placeholderIndex);
    for (let i = 0; i < dragItems.length; i++) {
      if (dragItems[i] == this.placeholder) continue;
      let offsetX = 0;
      let offsetY = 0;
      let dir = checkShiftItem({
        index: i,
        isAfter,
        isSelfList,
        overItemIndex: this.overItemIndex,
        placeholderIndex: this.placeholderIndex,
      });
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
      // let drg = this.dragRegister.dargItems.get(dragItems[i]);
      // if (drg) drg.adjustDomRect(offsetX, offsetY);
      this._renderer.setStyle(dragItems[i], 'transform', `translate(${offsetX}px, ${offsetY}px)`);
    }

    this.dragRegister.updateAllDragItemsRect();

    //TODO: check this
    this.currentIndex = this.overItemIndex;
    if (this.placeholderIndex < this.overItemIndex && isAfter) {
      this.currentIndex--;
    } else if (this.placeholderIndex > this.overItemIndex && !isAfter) {
      this.currentIndex++;
    }

    console.log('this.placeholderIndex', this.placeholderIndex, 'this.currentIndex', this.currentIndex);
  }

  /*------------------------------------when in place codes... ----------------------------------------------------*/

  private inPlaceShowPlaceholder(input: IUpdatePlaceholder) {
    const { dragItem, destinationDropList, isAfter, dragOverItem } = input;
    if (!destinationDropList) return;
    if (destinationDropList.disableSort || destinationDropList.checkAllowedConnections(dragItem.dropList) == false)
      return;
    this.hidePlaceholder(input);
    this.placeholder = this._document.createElement('div');
    this.placeholder.style.display = 'inline-block';
    this.placeholder.style.pointerEvents = 'none';
    this.placeholder.style.position = 'relative';

    this.placeholder.className = 'ngx-drag-placeholder';
    if (dragItem) {
      this._renderer.setStyle(this.placeholder, 'width', dragItem.domRect.width + 'px');
      this._renderer.setStyle(this.placeholder, 'height', dragItem.domRect.height + 'px');
    }

    if (dragOverItem && dragOverItem.dropList == destinationDropList) {
      dragOverItem.el.insertAdjacentElement(isAfter ? 'afterend' : 'beforebegin', this.placeholder);
      this.placeholderIndex = this.dragRegister.getDragItemIndex(dragOverItem);
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
