import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import {
  IDropEvent,
  NgxDropListDirective,
} from '../directives/ngx-drop-list.directive';
import { NgxDraggableDirective } from '../directives/ngx-draggable.directive';
import { getXYfromTransform } from '../../utils/get-transform';
import { DOCUMENT } from '@angular/common';
import { getPointerPosition } from '../../utils/get-position';

@Injectable()
export class NgxDragDropService {
  _dropList = new Set<NgxDropListDirective>();
  private _activeDragInstances: NgxDraggableDirective[] = [];
  private _renderer: Renderer2;
  private _dropEvent: IDropEvent | null = null;
  private _placeHolderIndex = 0;
  private dragElementInBody?: HTMLElement;
  /**
   * on drag enter element
   * - add before or after hovered element
   */
  private isAfter = true;
  private dragOverItem?: NgxDraggableDirective;
  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private _document: Document
  ) {
    this._renderer = rendererFactory.createRenderer(null, null);
  }

  startDrag(drag: NgxDraggableDirective) {
    this._activeDragInstances.push(drag);
    let previousIndex = 0;
    if (!drag.containerDropList || !this._activeDragInstances.length) return;
    drag.containerDropList.dragging = true;
    drag.containerDropList._draggables?.forEach((el, i) => {
      if (el.el == drag.el) {
        previousIndex = i;
      }
    });
    this._dropEvent = {
      previousIndex,
      currentIndex: 0,
      container: drag.containerDropList,
      item: drag,
      previousContainer: drag.containerDropList,
    };

    const dragElRec = drag.el.getBoundingClientRect();
    this._renderer.setStyle(drag.el, 'display', 'none');
    this.dragElementInBody = this._document.createElement(drag.el.tagName);
    this.dragElementInBody.innerHTML = drag.el.innerHTML;
    this.dragElementInBody.className = drag.el.className + ' ngx-drag-drop';
    this.dragElementInBody.style.display = 'block';
    this.dragElementInBody.style.position = 'absolute';
    this.dragElementInBody.style.top = window.scrollY + dragElRec.top + 'px';
    this.dragElementInBody.style.left = window.scrollX + dragElRec.left + 'px';
    this.dragElementInBody.style.width = dragElRec.width + 'px';
    this.dragElementInBody.style.height = dragElRec.height + 'px';
    this.dragElementInBody.style.pointerEvents = 'none';
    this._document.body.appendChild(this.dragElementInBody);
    this.initDrag(drag);
  }

  stopDrag(drag: NgxDraggableDirective) {
    const index = this._activeDragInstances.indexOf(drag);
    if (index > -1) {
      this._activeDragInstances.splice(index, 1);
      drag.el.style.display = '';
      this.hidePlaceHolder(drag);
      this.dragElementInBody?.remove();
      this.droped(drag);
    }
  }

  enterDrag(drag: NgxDraggableDirective) {
    //  console.log('enter', drag.el);
    this.dragOverItem = drag;
    this.initDrag(drag);
  }

  leaveDrag(drag: NgxDraggableDirective) {
    // console.log('leave', drag.el);
  }

  // prettier-ignore
  dragMove(drag: NgxDraggableDirective, ev: MouseEvent | TouchEvent) {
    if (!drag.containerDropList || !this._activeDragInstances.length) return;
    this._renderer.setStyle(this.dragElementInBody,'transform',drag.el.style.transform);
    if(this.dragOverItem){
        const position = getPointerPosition(ev);
        let yInEL = position.y - this.dragOverItem.el.getBoundingClientRect().top;
        this.isAfter =yInEL > this.dragOverItem.el.getBoundingClientRect().height / 2;
       this.initDrag(this.dragOverItem);
    }
  }

  registerDropList(dropList: NgxDropListDirective) {
    this._dropList.add(dropList);
    // console.log(this._dropList);
  }

  private initDrag(drag: NgxDraggableDirective) {
    if (!drag.containerDropList || !this._activeDragInstances.length) return;
    this.updatePlaceholderPosition(drag.containerDropList.placeHolder, drag);
  }

  // prettier-ignore
  updatePlaceholderPosition(placehlder: HTMLElement,enteredDrag: NgxDraggableDirective  ) {
    if(!enteredDrag.containerDropList || !enteredDrag.containerDropList._draggables) return
    let plcRec = placehlder.getBoundingClientRect();
    let x = 0;
    let y = this.isAfter ? enteredDrag.el.offsetTop : enteredDrag.el.offsetTop - plcRec.height;
    let transform = `translate(${x}px, ${y}px)`;
    this._renderer.setStyle(placehlder, 'display', 'block');
    this._renderer.setStyle(placehlder, 'transform', transform);
    // move before this to up
    let beforeTransform = `translate(${0}px, ${-plcRec.height}px)`;
    let findIndex= enteredDrag.containerDropList._draggables.toArray().findIndex(x=>x.el == enteredDrag.el);
    //  console.log(findIndex , this.isAfter)
    if(!this.isAfter)
        findIndex--;  
    
    this._placeHolderIndex = findIndex;
    let activeDragIndex = enteredDrag.containerDropList._draggables.toArray().findIndex(x=>x.el==this._activeDragInstances[0].el);
    if(activeDragIndex > findIndex){
        this._placeHolderIndex++;
    }

     placehlder.innerHTML = 'plc=' + this._placeHolderIndex;
    enteredDrag.containerDropList?._draggables?.forEach((dropitem, index) => {
      if (
        index > findIndex ||
        this._activeDragInstances.findIndex((x) => x.el == dropitem.el) > -1
      ) {
        this._renderer.setStyle(dropitem.el, 'transform', '');
      } else {
        this._renderer.setStyle(dropitem.el, 'transform', beforeTransform);
      }
    });
  }

  hidePlaceHolder(drag: NgxDraggableDirective) {
    if (drag.containerDropList && drag.containerDropList.placeHolder)
      this._renderer.setStyle(
        drag.containerDropList.placeHolder,
        'display',
        'none'
      );
  }

  droped(drag: NgxDraggableDirective) {
    if (!this._dropEvent || !drag.containerDropList) return;
    this._dropEvent.container = drag.containerDropList;
    this._dropEvent.currentIndex = this._placeHolderIndex;
    drag.containerDropList?.onDrop(this._dropEvent);
    drag.containerDropList.dragging = false;
    // reset transform
    drag.containerDropList._draggables?.forEach((item, index) => {
      this._renderer.setStyle(item.el, 'transform', '');
    });
  }
}
