import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Subject, distinctUntilChanged } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { IUpdatePlaceholder } from '../../interfaces/update-placeholder';
import { getFirstLevelDraggables } from '../../utils/element.helper';

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
        if (input.dragOverItem) {
          input.dragOverItem.el.insertAdjacentElement(input.isAfter ? 'afterend' : 'beforebegin', this.placeholder);
        } else {
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
    const isVertical = dropList.direction === 'vertical';
    const placeHolderRect = this.placeholder?.getBoundingClientRect();
    const plcHeight = placeHolderRect?.height ?? 0;
    const plcWidth = placeHolderRect?.width ?? 0;

    // ✅ جابجا کردن سایر آیتم‌ها
    const dragItems: HTMLElement[] = getFirstLevelDraggables(dropList.el);
    const overIndex = dragOverItem ? dragItems.findIndex((x) => x === dragOverItem.el) : -1;
    let currentDragIndex = currentDrag ? dragItems.findIndex((x) => x === currentDrag.el) : 0;

    for (let i = 0; i < dragItems.length; i++) {
      const el = dragItems[i];
      if (el === currentDrag.el) continue;

      let offsetX = 0;
      let offsetY = 0;
      let ahead = false;
      let behind = false;

      // حالت self-drop در همان لیست
      if (currentDragIndex >= 0) {
        behind = i >= overIndex && i <= currentDragIndex;
        if (isAfter) {
          ahead = i <= overIndex && i > currentDragIndex;
        } else {
          ahead = i < overIndex && i > currentDragIndex;
        }
      } else {
        if (isAfter) {
          ahead = i > overIndex;
        } else {
          ahead = false;
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

    if (currentDrag.dropList == dragOverItem.dropList || !isAfter) {
      this.index = overIndex >= 0 ? overIndex : 0;
    } else {
      this.index = overIndex >= 0 ? overIndex + 1 : 0;
    }
    // ✅ تنظیم دقیق موقعیت placeholder بعد از جابجایی آیتم‌ها
    if (dragOverItem && overItemRec && dragOverItem.dropList === dropList && this.placeholder) {
      const baseCurrentX = this.placeholder.offsetLeft;
      const baseCurrentY = this.placeholder.offsetTop;
      const baseTargetX = dragOverItem.el.offsetLeft;
      const baseTargetY = dragOverItem.el.offsetTop;
      let deltaX = baseTargetX - baseCurrentX;
      let deltaY = baseTargetY - baseCurrentY;
      if (overIndex > currentDragIndex && !isAfter) {
        deltaY -= overItemRec.height;
      }
      const placeholderTransform = `translate(${deltaX}px, ${deltaY}px)`;
      this._renderer.setStyle(this.placeholder, 'transform', placeholderTransform);
      this._renderer.setStyle(this.placeholder, 'width', `${overItemRec.width}px`);
      this._renderer.setStyle(this.placeholder, 'height', `${overItemRec.height}px`);
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
