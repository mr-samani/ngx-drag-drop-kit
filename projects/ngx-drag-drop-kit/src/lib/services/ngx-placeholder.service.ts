import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Subject, distinctUntilChanged } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { getRelativePosition } from '../../utils/get-position';
import { IUpdatePlaceholder } from '../../interfaces/update-placeholder';
import { getFirstLevelDraggables } from '../../utils/element.helper';
import { NgxDragRegisterService } from './ngx-drag-register.service';

@Injectable({
  providedIn: 'root',
})
export class NgxDragPlaceholderService {
  private _renderer: Renderer2;
  public placeholder?: HTMLElement;
  private placeHolderRect?: DOMRect;
  public index = 0;
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
    // input.dropList.dragItems.forEach((e) => {
    //   if (e != input.currentDrag) e.updateDomRect();
    // });
  }

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
      if (input.currentDrag.dropList == input.dropList) {
        input.currentDrag.el.insertAdjacentElement(input.isAfter ? 'afterend' : 'beforebegin', this.placeholder);
      } else {
        input.dropList.el.insertAdjacentElement('beforeend', this.placeholder);
      }
      this.placeHolderRect = this.placeholder.getBoundingClientRect();
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
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const plcHeight = this.placeHolderRect?.height ?? 0;
    const plcWidth = this.placeHolderRect?.width ?? 0;
    const plcX = (this.placeHolderRect?.x ?? 0) + scrollLeft;
    const plcY = (this.placeHolderRect?.y ?? 0) + scrollTop;

    // ✅ جابجا کردن سایر آیتم‌ها
    const dragItems: HTMLElement[] = getFirstLevelDraggables(dropList.el);
    const overIndex = dragOverItem ? dragItems.findIndex((x) => x === dragOverItem.el) : -1;
    let currentDragIndex = currentDrag ? dragItems.findIndex((x) => x === currentDrag.el) : 0;

    const isVertical = dropList.direction === 'vertical';
    for (let i = 0; i < dragItems.length; i++) {
      const el = dragItems[i];
      if (el === currentDrag.el) continue;

      let offsetX = 0;
      let offsetY = 0;
      let ahead = false;
      let behind = false;

      if (currentDragIndex >= 0) {
        // حالت self-drop در همان لیست
        ahead = i <= overIndex && i > currentDragIndex;
        behind = i >= overIndex && i < currentDragIndex;
      } else {
        // حالت بین دو لیست
        if (isAfter) {
          ahead = i > overIndex; // آیتم بعد از overIndex بیاد
        } else {
          ahead = i >= overIndex; // آیتم سر جای overIndex بیاد
        }
        behind = false;
      }
      if (isVertical) {
        if (ahead) {
          offsetY = plcHeight * (currentDragIndex >= 0 ? -1 : 1);
        } else if (behind) {
          offsetY = plcHeight;
        }
      } else {
        const direction = dropList.isRtl ? -1 : 1;
        if (ahead) {
          offsetX = plcWidth * direction;
        } else if (behind) {
          offsetX = -plcWidth * direction;
        }
      }

      this._renderer.setStyle(el, 'transform', `translate(${offsetX}px, ${offsetY}px)`);
    }

    // update placeholder position

    if (currentDrag.dropList == dragOverItem.dropList || !isAfter) {
      this.index = overIndex >= 0 ? overIndex : 0;
      this._renderer.setStyle(
        this.placeholder,
        'transform',
        `translate(${overItemRec.x - plcX}px, ${overItemRec.y - plcY}px)`
      );
    } else {
      this.index = overIndex >= 0 ? overIndex + 1 : 0;
      this._renderer.setStyle(
        this.placeholder,
        'transform',
        `translate(${overItemRec.x - plcX}px, ${overItemRec.y - plcY + overItemRec.height}px)`
      );
    }

    // console.log('isAfter', isAfter, 'overIndex', overIndex, 'currentIdndex', this.index);
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
    this.placeHolderRect = this.placeholder.getBoundingClientRect();
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
