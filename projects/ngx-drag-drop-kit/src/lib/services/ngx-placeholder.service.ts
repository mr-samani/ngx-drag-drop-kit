import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { NgxDraggableDirective } from '../directives/ngx-draggable.directive';
import { Subject, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { NgxDropListDirective } from '../directives/ngx-drop-list.directive';
import { DropActionType } from '../../models/DropActionType';

export interface IUpdatePlaceholderPosition {
  /** drop list container */
  dropList: NgxDropListDirective;
  /** current dragging item */
  currentDrag: NgxDraggableDirective;
  /** drop action type
   * - after , before , inside
   */
  dropAction: DropActionType;
  /** drag over of this item */
  dragOverItem?: NgxDraggableDirective;
  /** dragging element's bounding rectangle */
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
          return (
            prev.currentDrag == curr.currentDrag && prev.dropAction == curr.dropAction && prev.dropList == curr.dropList
          );
        })
        // debounceTime(10)
      )
      .subscribe((input) => {
        this.updatePlaceholderPosition(input);
      });
  }

  private showPlaceholder(input: IUpdatePlaceholderPosition) {
    let { activeDragDomRec, dropAction, dragOverItem, dropList } = input;
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

    if (!dragOverItem) {
      dropAction = 'inside';
    }

    switch (dropAction) {
      case 'after':
        dragOverItem!.el.insertAdjacentElement('afterend', this._placeholder);
        break;
      case 'before':
        dragOverItem!.el.insertAdjacentElement('beforebegin', this._placeholder);
        break;
      case 'inside':
        dropList._el.insertAdjacentElement('afterbegin', this._placeholder);
        break;
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
    let els = input.dragOverItem?.containerDropList?._el.querySelectorAll(
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
