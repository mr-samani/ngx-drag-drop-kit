import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Subject, distinctUntilChanged } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { getRelativePosition } from '../../utils/get-position';
import { IUpdatePlaceholder } from '../../interfaces/update-placeholder';

@Injectable({
  providedIn: 'root',
})
export class NgxDragPlaceholderService {
  private _renderer: Renderer2;
  public placeholder: HTMLElement | undefined;
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
          // console.log('mustBeCancel', mustBeCancel);
          return mustBeCancel;
        })
        // debounceTime(10)
      )
      .subscribe((input) => {
        this.updatePlaceHolder(input);
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

  private showPlaceholder(input: IUpdatePlaceholder) {
    if (input.dropList.isFlexWrap) {
      return this.inPlaceShowPlaceholder(input);
    }
    if (!this.placeholder || this.placeholder.parentElement != input.dropList.el) {
      this.hidePlaceholder();
    }
    if (!this.placeholder) {
      this.placeholder = input.dropList.addPlaceholder(input.currentDragRec);
      if (input.currentDrag.dropList == input.dropList) {
        input.currentDrag.el.insertAdjacentElement(input.isAfter ? 'afterend' : 'beforebegin', this.placeholder);
      } else {
        input.dropList.el.insertAdjacentElement('beforeend', this.placeholder);
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
    if (input.dropList.isFlexWrap) {
      this.inPlaceUpdatePlaceholderPosition(input);
      return;
    }
    const { currentDrag, dragOverItem, dropList, isAfter, overItemRec } = input;

    this.showPlaceholder(input);

    const plcRect = this.placeholder!.getBoundingClientRect();
    const plcHeight = plcRect.height;
    const plcWidth = plcRect.width;

    let placeholderX = 0;
    let placeholderY = 0;
    console.log(dragOverItem?.el?.id, isAfter, dropList.el.id);
    if (dragOverItem && overItemRec && dragOverItem.dropList === dropList) {
      const relPos = getRelativePosition(dragOverItem.el, dropList.el);
      if (dropList.direction === 'vertical') {
        placeholderY = isAfter ? relPos.y + overItemRec.height : relPos.y;
        placeholderX = relPos.x;
      } else {
        if (dropList.isRtl) {
          placeholderX = isAfter ? relPos.x - plcWidth : relPos.x;
        } else {
          placeholderX = isAfter ? relPos.x + overItemRec.width : relPos.x;
        }
        placeholderY = relPos.y;
      }
    }

    const plcRel = getRelativePosition(this.placeholder!, dropList.el);
    const placeholderTransform = `translate(${placeholderX - plcRel.x}px, ${placeholderY - plcRel.y}px)`;

    this._renderer.setStyle(this.placeholder, 'transform', placeholderTransform);
    // this._renderer.setStyle(this.placeholder, 'transition', 'transform 250ms ease');

    // ✅ جابجا کردن سایر آیتم‌ها
    const dragItems: HTMLElement[] = Array.from(dropList.el.querySelectorAll(':scope > .ngx-draggable'));
    const dragOverIndex = dragOverItem ? dragItems.findIndex((x) => x === dragOverItem.el) : -1;
    for (let i = 0; i < dragItems.length; i++) {
      const el = dragItems[i];
      if (el === currentDrag.el) continue;

      let offsetX = 0;
      let offsetY = 0;

      if (dropList.direction === 'vertical') {
        const shouldShift = (isAfter && i > dragOverIndex) || (!isAfter && i >= dragOverIndex);
        offsetY = shouldShift ? plcHeight : 0;
      } else {
        const shouldShift = (isAfter && i > dragOverIndex) || (!isAfter && i >= dragOverIndex);
        if (dropList.isRtl) {
          offsetX = shouldShift ? -plcWidth : 0;
        } else {
          offsetX = shouldShift ? plcWidth : 0;
        }
      }

      const transform = `translate(${offsetX}px, ${offsetY}px)`;
      this._renderer.setStyle(el, 'transform', transform);
    }

    this.index = isAfter ? dragOverIndex + 1 : dragOverIndex;
  }

  /*------------------------------------when in place codes... ----------------------------------------------------*/

  private inPlaceShowPlaceholder(input: IUpdatePlaceholder) {
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
    if (input.dragOverItem) {
      input.dragOverItem.el.insertAdjacentElement(input.isAfter ? 'afterend' : 'beforebegin', this.placeholder);
    } else {
      input.dropList.el.insertAdjacentElement('afterbegin', this.placeholder);
    }
    this.isShown = true;
  }

  /*--------------------------------------------*/

  private inPlaceUpdatePlaceholderPosition(input: IUpdatePlaceholder) {
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
