import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Subject, distinctUntilChanged } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { NgxDropListDirective } from '../directives/ngx-drop-list.directive';
import { getRelativePosition } from '../../utils/get-position';
import { IUpdatePlaceholderPosition } from '../../models/update-placeholder-position';

@Injectable({
  providedIn: 'root',
})
export class NgxDragPlaceholderService {
  private _renderer: Renderer2;
  private _placeholder: HTMLElement | undefined;
  public index = 0;
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

  private checkIsFlexibleAndWrap(dropList: NgxDropListDirective): boolean {
    const styles = window.getComputedStyle(dropList._el);
    return styles.display == 'flex' && styles.flexWrap == 'wrap';
  }

  private showPlaceholder(input: IUpdatePlaceholderPosition) {
    if (this.checkIsFlexibleAndWrap(input.dropList)) {
      this.inPlaceShowPlaceholder(input);
      return;
    }

    const { currentDragRec, dropList } = input;
    this._activeDropListInstances = dropList;
    if (!dropList._el.querySelector('.ngx-drag-placeholder')) {
      this.hidePlaceholder();
    }
    if (!this._placeholder) {
      this._placeholder = this._document.createElement('div');
      this._placeholder.style.display = 'inline-block';
      this._placeholder.style.position = 'absolute';
      this._placeholder.style.top = '0px';
      this._placeholder.style.left = '0px';
      this._placeholder.style.pointerEvents = 'none';
      this._placeholder.className = 'ngx-drag-placeholder';
      dropList._el.insertAdjacentElement('beforeend', this._placeholder);
    }
    if (currentDragRec) {
      this._renderer.setStyle(this._placeholder, 'width', currentDragRec.width + 'px');
      this._renderer.setStyle(this._placeholder, 'height', currentDragRec.height + 'px');
    }

    this.isShown = true;
  }

  public hidePlaceholder() {
    if (this._placeholder) {
      this._placeholder.remove();
    }
    this._placeholder = undefined;
    if (this._activeDropListInstances) {
      this._activeDropListInstances._draggables?.forEach((el) => {
        this._renderer.removeStyle(el.el, 'transform');
      });
    }
    this.isShown = false;
  }

  /*--------------------------------------------*/

  private updatePlaceholderPosition(input: IUpdatePlaceholderPosition) {
    if (this.checkIsFlexibleAndWrap(input.dropList)) {
      this.inPlaceUpdatePlaceholderPosition(input);
      return;
    }
    this.index = 0;
    this.showPlaceholder(input);
    let { dragOverItem, currentDrag, dropList, isAfter, direction } = input;
    if (!dragOverItem) {
      if (dropList._draggables?.length) {
        dragOverItem = dropList._draggables.last;
        isAfter = true;
      } else {
        return;
      }
    }

    const placeholderRect = this._placeholder!.getBoundingClientRect();
    const placeholderHeight = placeholderRect.height;
    const placeholderWidth = placeholderRect.width;
    const dragItems = Array.from(dropList._el.querySelectorAll('.ngx-draggable'));
    const dragOverIndex = dragItems.findIndex((x) => x === dragOverItem?.el);

    // جابجایی سایر آیتم‌ها
    for (let i = 0; i < dragItems.length; i++) {
      if (dragItems[i] == currentDrag.el) {
        continue;
      }
      let offsetX = 0,
        offsetY = 0;

      if (direction === 'vertical') {
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
        if (isAfter) {
          offsetX = i > dragOverIndex ? placeholderWidth : 0;
        } else {
          offsetX = i >= dragOverIndex ? placeholderWidth : 0;
        }
      }

      const transform = `translate(${offsetX}px, ${offsetY}px)`;
      this._renderer.setStyle(dragItems[i], 'transform', transform);
      this._renderer.setStyle(dragItems[i], 'transition', 'transform 250ms ease');
    }

    // update placeholder position
    const containerEl = dropList._el;
    const { x, y } = getRelativePosition(dragOverItem.el, containerEl);

    let placeholderX = x;
    let placeholderY = y;

    if (direction === 'vertical') {
      placeholderY = isAfter ? y + placeholderHeight : y;
      placeholderX = x;
    } else {
      placeholderX = isAfter ? x + placeholderWidth : x;
      placeholderY = y;
    }

    const placeholderTransform = `translate(${placeholderX}px, ${placeholderY}px)`;
    this._renderer.setStyle(this._placeholder, 'transform', placeholderTransform);
    this._renderer.setStyle(this._placeholder, 'transition', 'transform 250ms ease');

    this.index = isAfter ? dragOverIndex + 1 : dragOverIndex;

    console.log('isAfter:', isAfter, 'overItem', dragOverItem.el.id, 'placeholderIndex:', this.index, direction);
  }

  /*------------------------------------when in place codes... ----------------------------------------------------*/

  public inPlaceShowPlaceholder(input: IUpdatePlaceholderPosition) {
    const { currentDragRec, dropList, isAfter, dragOverItem } = input;

    this._activeDropListInstances = dropList;
    this.hidePlaceholder();
    this._placeholder = this._document.createElement('div');
    this._placeholder.style.display = 'inline-block';
    this._placeholder.style.pointerEvents = 'none';

    this._placeholder.className = 'ngx-drag-placeholder';
    if (currentDragRec) {
      this._renderer.setStyle(this._placeholder, 'width', currentDragRec.width + 'px');
      this._renderer.setStyle(this._placeholder, 'height', currentDragRec.height + 'px');
    }
    if (dragOverItem) {
      dragOverItem.el.insertAdjacentElement(isAfter ? 'afterend' : 'beforebegin', this._placeholder);
    } else {
      dropList._el.insertAdjacentElement('afterbegin', this._placeholder);
    }
    this.isShown = true;
  }

  /*--------------------------------------------*/

  private inPlaceUpdatePlaceholderPosition(input: IUpdatePlaceholderPosition) {
    this.showPlaceholder(input);
    let els: HTMLElement[] = [];
    if (input.dragOverItem && input.dragOverItem.containerDropList) {
      els = Array.from(
        input.dragOverItem.containerDropList._el.querySelectorAll(
          '.ngx-draggable ,.ngx-drag-placeholder,.ngx-draggable.dragging'
        )
      );
    }

    if (els.length > 0) {
      this.index = els.findIndex((x) => x == this._placeholder);
    } else {
      this.index = 0;
    }
  }
}
