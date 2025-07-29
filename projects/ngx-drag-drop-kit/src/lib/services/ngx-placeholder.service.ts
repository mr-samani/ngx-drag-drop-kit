import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Subject, distinctUntilChanged } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { NgxDropListDirective } from '../directives/ngx-drop-list.directive';
import { getRelativePosition } from '../../utils/get-position';
import { IUpdatePlaceholder } from '../../interfaces/update-placeholder';
import { NgxDraggableDirective } from '../directives/ngx-draggable.directive';

@Injectable({
  providedIn: 'root',
})
export class NgxDragPlaceholderService {
  private _renderer: Renderer2;
  private _placeholder: HTMLElement | undefined;
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
            prev.isAfter == curr.isAfter &&
            prev.dropList == curr.dropList;
          console.log('mustBeCancel', mustBeCancel);
          return mustBeCancel;
        })
        // debounceTime(10)
      )
      .subscribe((input) => {
        this.updatePlaceHolder(input);
      });
  }

  private updatePlaceHolder(input: IUpdatePlaceholder) {
    console.log('updateposition', input.dropList?.el.id, input.state);

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

  private showPlaceholder(input: IUpdatePlaceholder) {
    if (input.dropList.isFlexWrap) {
      return this.inPlaceShowPlaceholder(input);
    }
    if (!this._placeholder || this._placeholder.parentElement != input.dropList.el) {
      this.hidePlaceholder();
    }
    if (!this._placeholder) {
      this._placeholder = input.dropList.addPlaceholder(input.currentDragRec);
      input.dropList.el.insertAdjacentElement('beforeend', this._placeholder);
    }
    this.isShown = true;
  }

  private hidePlaceholder() {
    if (this._placeholder) {
      this._placeholder.remove();
    }
    this._placeholder = undefined;
    document
      .querySelectorAll('.ngx-draggable:not(.dargging):not(.ngx-drag-in-body),.ngx-drag-placeholder')
      .forEach((el) => {
        this._renderer.removeStyle(el, 'transform');
      });
    this.isShown = false;
  }

  /*--------------------------------------------*/

  private updatePlaceholderPosition(input: IUpdatePlaceholder) {
    if (input.dropList.isFlexWrap) {
      this.inPlaceUpdatePlaceholderPosition(input);
      return;
    }

    this.showPlaceholder(input);
    let { dragOverItem, currentDrag, dropList, isAfter, overItemRec, currentDragRec } = input;

    this.index = 0;
    const placeholderRect = this._placeholder!.getBoundingClientRect();
    const placeholderHeight = placeholderRect.height;
    const placeholderWidth = placeholderRect.width;
    const dragItems = Array.from(dropList.el.querySelectorAll(':scope > .ngx-draggable'));

    // let dragItems: HTMLElement[] = [];
    // if (dropList._draggables) dragItems = Array.from(dropList._draggables.map((m) => m.el));
    const dragOverIndex = dragOverItem ? dragItems.findIndex((x) => x === dragOverItem.el) : 0;
    // جابجایی سایر آیتم‌ها
    for (let i = 0; i < dragItems.length; i++) {
      if (dragItems[i] == currentDrag.el) {
        continue;
      }
      let offsetX = 0,
        offsetY = 0;

      if (dropList.direction === 'vertical') {
        if (isAfter) {
          offsetY = i > dragOverIndex ? placeholderHeight : 0;
        } else {
          offsetY = i >= dragOverIndex ? placeholderHeight : 0;
        }
      } else {
        // const isSameRow =
        //   dragItems[i].getBoundingClientRect().top === dragItems[dragOverIndex].getBoundingClientRect().top;
        // if (!isSameRow) {
        //   this._renderer.setStyle(dragItems[i], 'transform', '');
        //   continue;
        // }
        if (dropList.isRtl) {
          offsetX = isAfter ? (i > dragOverIndex ? -placeholderWidth : 0) : i >= dragOverIndex ? -placeholderWidth : 0;
        } else {
          offsetX = isAfter ? (i > dragOverIndex ? placeholderWidth : 0) : i >= dragOverIndex ? placeholderWidth : 0;
        }
      }

      const transform = `translate(${offsetX}px, ${offsetY}px)`;
      this._renderer.setStyle(dragItems[i], 'transform', transform);
      // this._renderer.setStyle(dragItems[i], 'transition', 'transform 250ms cubic-bezier(0, 0, 0.2, 1)');
    }
    // update placeholder position
    const containerEl = dropList.el;
    let placeholderX = 0;
    let placeholderY = 0;
    if (dragOverItem && overItemRec && dragOverItem.el.parentElement == containerEl) {
      const { x, y } = getRelativePosition(
        dragOverItem !== currentDrag ? dragOverItem.el : currentDrag.el,
        containerEl
      );

      if (dropList.direction === 'vertical') {
        placeholderY = isAfter ? y + overItemRec.height : y;
        placeholderX = x;
      } else {
        if (dropList.isRtl) {
          placeholderX = isAfter ? x - placeholderWidth : x;
        } else {
          placeholderX = isAfter ? x + overItemRec.width : x;
        }
        placeholderY = y;
      }
    }

    const plcPosition = getRelativePosition(this._placeholder!, containerEl);
    // console.log(containerEl, placeholderX, plcPosition.x);
    // const placeholderTransform = `translate(${placeholderX}px, ${placeholderY}px)`;
    const placeholderTransform = `translate(${placeholderX - plcPosition.x}px, ${placeholderY - plcPosition.y}px)`;
    this._renderer.setStyle(this._placeholder, 'transform', placeholderTransform);
    // this._renderer.setStyle(this._placeholder, 'transition', 'transform 250ms ease');

    this.index = isAfter ? dragOverIndex + 1 : dragOverIndex;

    // console.log(
    //   'isAfter:',
    //   isAfter,
    //   'overItem',
    //   dragOverItem?.el?.id,
    //   'placeholderIndex:',
    //   this.index,
    //   dropList.direction
    // );
  }

  /*------------------------------------when in place codes... ----------------------------------------------------*/

  private inPlaceShowPlaceholder(input: IUpdatePlaceholder) {
    this.hidePlaceholder();
    this._placeholder = this._document.createElement('div');
    this._placeholder.style.display = 'inline-block';
    this._placeholder.style.pointerEvents = 'none';

    this._placeholder.className = 'ngx-drag-placeholder';
    if (input.currentDragRec) {
      this._renderer.setStyle(this._placeholder, 'width', input.currentDragRec.width + 'px');
      this._renderer.setStyle(this._placeholder, 'height', input.currentDragRec.height + 'px');
    }
    if (input.dragOverItem) {
      input.dragOverItem.el.insertAdjacentElement(input.isAfter ? 'afterend' : 'beforebegin', this._placeholder);
    } else {
      input.dropList.el.insertAdjacentElement('afterbegin', this._placeholder);
    }
    this.isShown = true;
  }

  /*--------------------------------------------*/

  private inPlaceUpdatePlaceholderPosition(input: IUpdatePlaceholder) {
    if (!this.isShown) return;
    this.inPlaceShowPlaceholder(input);
    let els: HTMLElement[] = [];
    if (input.dragOverItem && input.dragOverItem.dropList) {
      els = Array.from(input.dragOverItem.dropList.el.querySelectorAll('.ngx-draggable,.ngx-drag-placeholder'));
    }

    if (els.length > 0) {
      this.index = els.findIndex((x) => x == this._placeholder);
    } else {
      this.index = 0;
    }
  }
}
