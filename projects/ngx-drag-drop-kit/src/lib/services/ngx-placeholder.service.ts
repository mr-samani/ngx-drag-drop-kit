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
  public activeDropList?: NgxDropListDirective;
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
    const styles = window.getComputedStyle(dropList.el);
    return styles.display == 'flex' && styles.flexWrap == 'wrap';
  }

  private showPlaceholder(input: IUpdatePlaceholderPosition) {
    if (this.checkIsFlexibleAndWrap(input.dropList)) {
      this.inPlaceShowPlaceholder(input);
      return;
    }

    const { currentDragRec, dropList } = input;
    // hide other placeholder in other drop lists
    if (!dropList.el.querySelector('.ngx-drag-placeholder')) {
      this.hidePlaceholder();
    }
    if (this.activeDropList != dropList) {
      this.hidePlaceholder();
      this.activeDropList = dropList;
    }
    if (!this._placeholder) {
      this._placeholder = dropList.addPlaceholder(currentDragRec?.width, currentDragRec?.height);
      dropList.el.insertAdjacentElement('beforeend', this._placeholder);

      console.log('placeholder created on:', dropList.el.id);
    }

    this.isShown = true;
  }

  public hidePlaceholder() {
    if (this._placeholder) {
      this._placeholder.remove();
    }
    this._placeholder = undefined;
    document.querySelectorAll('[NgxDraggable]').forEach((el) => {
      this._renderer.removeStyle(el, 'transform');
    });
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
    let { dragOverItem, currentDrag, dropList, isAfter, overItemRec } = input;
    if (!dragOverItem) {
      if (dropList._draggables?.length) {
        dragOverItem = dropList._draggables.last;
        overItemRec = dragOverItem.el.getBoundingClientRect();
        isAfter = true;
      } else {
        // return;
      }
    }
    const placeholderRect = this._placeholder!.getBoundingClientRect();
    const placeholderHeight = placeholderRect.height;
    const placeholderWidth = placeholderRect.width;
    const dragItems = Array.from(dropList.el.querySelectorAll(':scope > [NgxDraggable]'));
    const dragOverIndex = dragItems.findIndex((x) => x === dragOverItem?.el);
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
    const containerEl = dropList.el;
    let placeholderX = 0;
    let placeholderY = 0;
    if (dragOverItem && overItemRec && dragOverItem.el.parentElement == containerEl) {
      const { x, y } = getRelativePosition(dragOverItem.el, containerEl);

      if (dropList.direction === 'vertical') {
        placeholderY = isAfter ? y + overItemRec.height : y;
        placeholderX = x;
      } else {
        placeholderX = isAfter ? x + overItemRec.width : x;
        placeholderY = y;
      }
    }

    const plcPosition = getRelativePosition(this._placeholder!, containerEl);
    // console.log(containerEl, placeholderX, plcPosition.x);
    // const placeholderTransform = `translate(${placeholderX}px, ${placeholderY}px)`;
    const placeholderTransform = `translate(${placeholderX - plcPosition.x}px, ${placeholderY - plcPosition.y}px)`;
    this._renderer.setStyle(this._placeholder, 'transform', placeholderTransform);
    this._renderer.setStyle(this._placeholder, 'transition', 'transform 250ms ease');

    this.index = isAfter ? dragOverIndex + 1 : dragOverIndex;

    console.log(
      'isAfter:',
      isAfter,
      'overItem',
      dragOverItem?.el?.id,
      'placeholderIndex:',
      this.index,
      dropList.direction
    );
  }

  /*------------------------------------when in place codes... ----------------------------------------------------*/

  public inPlaceShowPlaceholder(input: IUpdatePlaceholderPosition) {
    const { currentDragRec, dropList, isAfter, dragOverItem } = input;

    this.activeDropList = dropList;
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
      dropList.el.insertAdjacentElement('afterbegin', this._placeholder);
    }
    this.isShown = true;
  }

  /*--------------------------------------------*/

  private inPlaceUpdatePlaceholderPosition(input: IUpdatePlaceholderPosition) {
    this.showPlaceholder(input);
    let els: HTMLElement[] = [];
    if (input.dragOverItem && input.dragOverItem.containerDropList) {
      els = Array.from(
        input.dragOverItem.containerDropList.el.querySelectorAll(
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
