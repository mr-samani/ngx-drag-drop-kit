import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Subject, distinctUntilChanged } from 'rxjs';
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
          return mustBeCancel;
        })
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
      // drag to other list (Kanban)
      else {
        // when has over item
        if (dragOverItem) {
          dragOverItem.el.insertAdjacentElement(isAfter ? 'afterend' : 'beforebegin', this.placeholder);
          const overIdx = this.dragRegister.getDragItemIndex(dragOverItem);
          // FIXED: placeholder index should be where it's inserted in DOM
          this.placeholderIndex = isAfter ? overIdx + 1 : overIdx;
        }
        // add to end of children
        else {
          destinationDropList.el.insertAdjacentElement('beforeend', this.placeholder);
          this.placeholderIndex = destinationDropList.dragItems.length;
        }
      }

      this.currentIndex = this.placeholderIndex;
      this.overItemIndex = this.placeholderIndex; // Initialize overItemIndex
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
    const newOverItemIndex = this.dragRegister.getDragItemIndex(dragOverItem);
    const isVertical = destinationDropList.direction === 'vertical';
    const placeHolderRect = this.placeholder?.getBoundingClientRect();
    const plcHeight = placeHolderRect?.height ?? 0;
    const plcWidth = placeHolderRect?.width ?? 0;

    // FIXED: Only update if overItemIndex actually changed or isAfter changed
    const shouldUpdate = newOverItemIndex !== this.overItemIndex;
    this.overItemIndex = newOverItemIndex;

    if (!shouldUpdate && this.placeholder && placeHolderRect) {
      // No movement needed, just return
      return;
    }

    // Move placeholder using transform
    if (dragOverItem && this.placeholder && placeHolderRect) {
      const ax = placeHolderRect.x;
      const ay = placeHolderRect.y;
      const bx = dragOverItem.domRect.x;
      const by = dragOverItem.domRect.y;

      if (isVertical) {
        // FIXED: Simpler vertical calculation
        const deltaY = by - ay;
        this.plcT.y += deltaY;
        this._renderer.setStyle(this.placeholder, 'transform', `translate(0px, ${this.plcT.y}px)`);
      } else {
        // FIXED: Simpler horizontal calculation
        const deltaX = bx - ax;
        const direction = destinationDropList.isRtl ? -1 : 1;
        
        if (isAfter) {
          // Move to after the overItem
          this.plcT.x += (deltaX + dragOverItem.domRect.width) * direction;
        } else {
          // Move to before the overItem
          this.plcT.x += deltaX * direction;
        }
        
        this._renderer.setStyle(this.placeholder, 'transform', `translate(${this.plcT.x}px, 0px)`);
      }
    }

    const dragItems = getFirstLevelDraggables(destinationDropList.el).filter((item) => item != this.placeholder);
    
    // Move other draggable items
    for (let i = 0; i < dragItems.length; i++) {
      let offsetX = 0;
      let offsetY = 0;
      
      const dir = checkShiftItem({
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
      } else {
        // horizontal
        const direction = destinationDropList.isRtl ? -1 : 1;
        if (dir == 'ahead') {
          offsetX = +plcWidth * direction;
        } else if (dir == 'behind') {
          offsetX = -plcWidth * direction;
        }
      }
      
      this._renderer.setStyle(dragItems[i], 'transform', `translate(${offsetX}px, ${offsetY}px)`);
    }

    this.dragRegister.updateAllDragItemsRect();

    // FIXED: Calculate currentIndex correctly
    // currentIndex is where the item will be placed when dropped
    this.currentIndex = this.calculateCurrentIndex(isSelfList, isAfter);

    console.log('placeholderIndex:', this.placeholderIndex, 'overItemIndex:', this.overItemIndex, 'currentIndex:', this.currentIndex, 'isAfter:', isAfter);
  }

  /**
   * Calculate the final index where item will be placed
   */
  private calculateCurrentIndex(isSelfList: boolean, isAfter: boolean): number {
    if (isSelfList) {
      // Same list: moving within same list
      if (this.overItemIndex > this.placeholderIndex) {
        // Moving down
        return isAfter ? this.overItemIndex : this.overItemIndex - 1;
      } else if (this.overItemIndex < this.placeholderIndex) {
        // Moving up
        return isAfter ? this.overItemIndex + 1 : this.overItemIndex;
      } else {
        // Same position
        return this.placeholderIndex;
      }
    } else {
      // Different list (Kanban)
      return isAfter ? this.overItemIndex + 1 : this.overItemIndex;
    }
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
      const overIdx = this.dragRegister.getDragItemIndex(dragOverItem);
      this.placeholderIndex = isAfter ? overIdx + 1 : overIdx;
    } else {
      destinationDropList.el.insertAdjacentElement('beforeend', this.placeholder);
      this.placeholderIndex = destinationDropList.dragItems.length;
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