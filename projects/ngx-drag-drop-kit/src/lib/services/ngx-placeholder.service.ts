import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { NgxDraggableDirective } from '../directives/ngx-draggable.directive';
import { Subject, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { NgxDropListDirective } from '../directives/ngx-drop-list.directive';

export interface IUpdatePlaceholderPosition {
  dropList: NgxDropListDirective;
  currentDrag: NgxDraggableDirective;
  isAfter: boolean;
  enteredDrag?: NgxDraggableDirective;
  activeDragDomRec?: DOMRect;
}

@Injectable({
  providedIn: 'root',
})
export class NgxDragPlaceholderService {
  private _renderer: Renderer2;
  private _placeholder: HTMLElement | undefined;
  public _placeHolderIndex = 0;
  public updatePlaceholderPosition$ = new Subject<IUpdatePlaceholderPosition>();
  public _activeDropListInstances?: NgxDropListDirective;
  public isShown: boolean = false;

  constructor(rendererFactory: RendererFactory2, @Inject(DOCUMENT) private _document: Document) {
    this._renderer = rendererFactory.createRenderer(null, null);
    this.updatePlaceholderPosition$
      .pipe(
        distinctUntilChanged((prev, curr) => {
          return prev.currentDrag == curr.currentDrag && prev.isAfter == curr.isAfter && prev.dropList == curr.dropList;
        })
        // debounceTime(10)
      )
      .subscribe((input) => {
        this.updatePlaceholderPosition(input);
      });
  }

  public showPlaceholder(input: IUpdatePlaceholderPosition) {
    const { activeDragDomRec, isAfter, enteredDrag, dropList } = input;
    this._activeDropListInstances = dropList;
    this.hidePlaceholder();
    this._placeholder = this._document.createElement('div');
    this._placeholder.style.display = 'inline-block';
    this._placeholder.style.pointerEvents = 'none';

    this._placeholder.className = 'ngx-drag-placeholder';
    if (activeDragDomRec) {
      this._renderer.setStyle(this._placeholder, 'width', activeDragDomRec.width + 'px');
      this._renderer.setStyle(this._placeholder, 'height', activeDragDomRec.height + 'px');
    }
    if (enteredDrag) {
      enteredDrag.el.insertAdjacentElement(isAfter ? 'afterend' : 'beforebegin', this._placeholder);
    } else {
      dropList._el.insertAdjacentElement('afterbegin', this._placeholder);
    }
    this.isShown = true;
  }

  public hidePlaceholder() {
    if (this._placeholder) {
      this._placeholder.remove();
    }
    if (this._activeDropListInstances) {
      this._activeDropListInstances._draggables?.forEach((el) => {
        this._renderer.removeStyle(el.el, 'transform');
      });
    }
    this.isShown = false;
  }

  /*--------------------------------------------*/

  private updatePlaceholderPosition(input: IUpdatePlaceholderPosition) {
    this.showPlaceholder(input);
    //TODO if placeholder after draged elemet was decrement index
    let els = input.enteredDrag?.containerDropList?._el.querySelectorAll(
      '.ngx-draggable ,.ngx-drag-placeholder,.ngx-draggable.dragging'
    );
    if (els) {
      const draggingPosition = Array.from(els).findIndex((x) => x.className.includes('dragging'));
      this._placeHolderIndex = Array.from(els).findIndex((x) => x == this._placeholder);
      if (draggingPosition > -1 && draggingPosition < this._placeHolderIndex) {
        this._placeHolderIndex--;
      }
    } else {
      this._placeHolderIndex = 0;
    }
    //  console.log(this._placeHolderIndex);
    // this._placeHolderIndex = enteredDrag?.containerDropList?._draggables
  }
}
