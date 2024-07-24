import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { NgxDropListDirective } from '../directives/ngx-drop-list.directive';
import { NgxDraggableDirective } from '../directives/ngx-draggable.directive';

@Injectable()
export class NgxPlaceholderService {
  private _renderer: Renderer2;
  _placeHolderIndex = 0;
  _placeholder: HTMLElement | undefined;
  constructor(rendererFactory: RendererFactory2) {
    this._renderer = rendererFactory.createRenderer(null, null);
  }

  public showPlaceholder(dropList: NgxDropListDirective) {
    this._placeholder = dropList.placeHolder;
    this._placeHolderIndex = 0;
    this._renderer.setStyle(this._placeholder, 'display', 'block');
  }

  public hidePlaceholder(dropList: NgxDropListDirective) {
    if (this._placeholder) {
      this._renderer.setStyle(this._placeholder, 'display', 'none');
    }
    if (!dropList || !dropList.placeHolder) return;
    // reset transform
    dropList._draggables?.forEach((item, index) => {
      this._renderer.setStyle(item.el, 'transform', '');
    });
  }

  /*--------------------------------------------*/

  updatePlaceholderPosition(
    currentDrag: NgxDraggableDirective,
    enteredDrag: NgxDraggableDirective,
    isAfter: boolean
  ) {
    if (
      !enteredDrag.containerDropList ||
      !enteredDrag.containerDropList._draggables ||
      !this._placeholder
    )
      return;
    let plcRec = this._placeholder.getBoundingClientRect();
    let x = 0;
    let y = isAfter
      ? enteredDrag.el.offsetTop
      : enteredDrag.el.offsetTop - plcRec.height;
    let transform = `translate(${x}px, ${y}px)`;
    this._renderer.setStyle(this._placeholder, 'transform', transform);
    // move before this to up
    let beforeTransform = `translate(${0}px, ${-plcRec.height}px)`;
    let findIndex = enteredDrag.containerDropList._draggables
      .toArray()
      .findIndex((x) => x.el == enteredDrag.el);
    //  console.log(findIndex , this.isAfter)
    if (!isAfter) findIndex--;

    this._placeHolderIndex = findIndex;
    let activeDragIndex = enteredDrag.containerDropList._draggables
      .toArray()
      .findIndex((x) => x.el == currentDrag.el);
    if (activeDragIndex > findIndex) {
      this._placeHolderIndex++;
    }

    this._placeholder.innerHTML = 'plc=' + this._placeHolderIndex;
    enteredDrag.containerDropList?._draggables?.forEach((dropitem, index) => {
      if (index > findIndex || currentDrag.el != dropitem.el) {
        this._renderer.setStyle(dropitem.el, 'transform', '');
      } else {
        this._renderer.setStyle(dropitem.el, 'transform', beforeTransform);
      }
    });
  }
}
