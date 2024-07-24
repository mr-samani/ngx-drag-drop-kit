import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { NgxDropListDirective } from '../directives/ngx-drop-list.directive';
import { NgxDraggableDirective } from '../directives/ngx-draggable.directive';
import { Subject, debounceTime, distinctUntilChanged, map } from 'rxjs';

export interface IUpdatePlaceholderPosition {
  currentDrag: NgxDraggableDirective;
  enteredDrag?: NgxDraggableDirective;
  isAfter: boolean;
}

@Injectable()
export class NgxPlaceholderService {
  private _renderer: Renderer2;
  _placeHolderIndex = 0;
  _placeholder: HTMLElement | undefined;

  public updatePlaceholderPosition$ = new Subject<IUpdatePlaceholderPosition>();

  constructor(rendererFactory: RendererFactory2) {
    this._renderer = rendererFactory.createRenderer(null, null);
    this.updatePlaceholderPosition$.pipe(distinctUntilChanged(), debounceTime(10)).subscribe((input) => {
      this.updatePlaceholderPosition(input);
    });
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

  private updatePlaceholderPosition(input: IUpdatePlaceholderPosition) {
    const { enteredDrag, isAfter, currentDrag } = input;
    if (!this._placeholder) return;

    if (!enteredDrag || !enteredDrag.containerDropList || !enteredDrag.containerDropList._draggables) {
      let transform = `translate(${0}px, ${0}px)`;
      this._renderer.setStyle(this._placeholder, 'transform', transform);
      return;
    }
    let plcRec = this._placeholder.getBoundingClientRect();
    let x = 0;
    let y = isAfter ? enteredDrag.el.offsetTop : enteredDrag.el.offsetTop - plcRec.height;
    let transform = `translate(${x}px, ${y}px)`;
    this._renderer.setStyle(this._placeholder, 'transform', transform);
    // move before this to up
    let beforeTransform = `translate(${0}px, ${-plcRec.height}px)`;
    let findIndex = 0;
    // TODO: has bug t get index
    {
      findIndex = enteredDrag.containerDropList._draggables.toArray().findIndex((x) => x.el == enteredDrag.el);
      console.log(enteredDrag.containerDropList._draggables.toArray().length, findIndex, isAfter);
      if (!isAfter) findIndex--;

      this._placeHolderIndex = findIndex;
      let activeDragIndex = enteredDrag.containerDropList._draggables
        .toArray()
        .findIndex((x) => x.el == currentDrag.el);
      if (activeDragIndex > findIndex) {
        this._placeHolderIndex++;
      }
    }
    this._placeholder.innerHTML = 'plc=' + this._placeHolderIndex;
    // console.log(enteredDrag.el.innerHTML);
    enteredDrag.containerDropList?._draggables?.forEach((dropitem, index) => {
      // console.log(currentDrag.el.innerHTML, dropitem.el.innerHTML);
      //console.log(index > findIndex);
      if (index > findIndex) {
        this._renderer.setStyle(dropitem.el, 'transform', '');
      } else {
        this._renderer.setStyle(dropitem.el, 'transform', beforeTransform);
      }
    });
  }
}
