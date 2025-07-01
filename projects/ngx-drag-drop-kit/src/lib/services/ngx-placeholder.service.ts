import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { NgxDraggableDirective } from '../directives/ngx-draggable.directive';
import { Subject, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { NgxDropListDirective } from '../directives/ngx-drop-list.directive';
import { getRelativePosition } from '../../utils/get-position';

export interface IUpdatePlaceholderPosition {
  dropList: NgxDropListDirective;
  currentDrag: NgxDraggableDirective;
  isAfter: boolean;
  dragOverItem?: NgxDraggableDirective;
  activeDragDomRec?: DOMRect;
  direction: 'horizontal' | 'vertical';
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
    const { activeDragDomRec, dropList } = input;
    this._activeDropListInstances = dropList;
    this.hidePlaceholder();
    if (!this._placeholder) {
      this._placeholder = this._document.createElement('div');
      this._placeholder.style.display = 'inline-block';
      this._placeholder.style.pointerEvents = 'none';
      this._placeholder.className = 'ngx-drag-placeholder';
      dropList._el.insertAdjacentElement('beforeend', this._placeholder);
    }
    if (activeDragDomRec) {
      this._renderer.setStyle(this._placeholder, 'width', activeDragDomRec.width + 'px');
      this._renderer.setStyle(this._placeholder, 'height', activeDragDomRec.height + 'px');
    }

    this.isShown = true;
  }

  public hidePlaceholder() {
    // if (this._placeholder) {
    //   this._placeholder.remove();
    // }
    // if (this._activeDropListInstances) {
    //   this._activeDropListInstances._draggables?.forEach((el) => {
    //     this._renderer.removeStyle(el.el, 'transform');
    //   });
    // }
    this.isShown = false;
  }

  /*--------------------------------------------*/

  private updatePlaceholderPosition(input: IUpdatePlaceholderPosition) {
    this.showPlaceholder(input);

    const dragOverItem = input.dragOverItem!;
    const containerEl = dragOverItem.containerDropList!._el;

    // مختصات نسبی آیتم روی کانتینر
    const { x, y } = getRelativePosition(dragOverItem.el, containerEl);

    const placeholderRect = this._placeholder!.getBoundingClientRect();
    const placeholderHeight = placeholderRect.height;
    const placeholderWidth = placeholderRect.width;

    // بسته به جهت، جای placeholder رو تنظیم می‌کنیم
    let placeholderX = x;
    let placeholderY = y;

    if (input.direction === 'vertical') {
      // اگر isAfter هست placeholder باید پایین‌تر بیفته
      placeholderY = y; // input.isAfter ? y + placeholderHeight : y;
      placeholderX = x;
    } else {
      // افقی
      placeholderX = input.isAfter ? x + placeholderWidth : x;
      placeholderY = y;
    }

    const placeholderTransform = `translate(${placeholderX}px, ${placeholderY}px)`;
    this._renderer.setStyle(this._placeholder, 'transform', placeholderTransform);

    // ایندکس آیتم در dropList
    this._placeHolderIndex = Array.from(input.dropList._draggables!).findIndex((x) => x === dragOverItem);

    // جابجایی سایر آیتم‌ها
    dragOverItem.containerDropList!._draggables?.forEach((item, index) => {
      let offsetX = 0,
        offsetY = 0;

      if (input.direction === 'vertical') {
        if (input.isAfter) {
          offsetY = index > this._placeHolderIndex ? placeholderHeight : 0;
        } else {
          offsetY = index >= this._placeHolderIndex ? placeholderHeight : 0;
        }
      } else {
        // افقی
        if (input.isAfter) {
          offsetX = index > this._placeHolderIndex ? placeholderWidth : 0;
        } else {
          offsetX = index >= this._placeHolderIndex ? placeholderWidth : 0;
        }
      }

      const transform = `translate(${offsetX}px, ${offsetY}px)`;
      this._renderer.setStyle(item.el, 'transform', transform);
      this._renderer.setStyle(item.el, 'transition', 'transform 250ms ease');
    });

    // دیباگ
    console.log(
      'isAfter:',
      input.isAfter,
      'overItem',
      dragOverItem.el.id,
      'placeholderIndex:',
      this._placeHolderIndex,
      input.direction
    );
  }
}
