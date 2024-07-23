import {
  AfterViewInit,
  ContentChildren,
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  OnInit,
  Optional,
  Output,
  QueryList,
  SkipSelf,
  output,
} from '@angular/core';
import { NgxDragDropService } from '../services/ngx-drag-drop.service';
import { NgxDraggableDirective } from './ngx-draggable.directive';
import { DOCUMENT } from '@angular/common';
export interface IDropEvent {
  /** Index of the item when it was picked up. */
  previousIndex: number;
  /** Current index of the item. */
  currentIndex: number;
  /** Item that is being dropped. */
  item: NgxDraggableDirective;
  /** Container in which the item was dropped. */
  container: NgxDropListDirective;
  /** Container from which the item was picked up. Can be the same as the `container`. */
  previousContainer: NgxDropListDirective;
  //   /** Distance in pixels that the user has dragged since the drag sequence started. */
  //   distance: {
  //     x: number;
  //     y: number;
  //   };
  //   /** Position where the pointer was when the item was dropped */
  //   dropPoint: {
  //     x: number;
  //     y: number;
  //   };
  //   /** Native event that caused the drop event. */
  //   event: MouseEvent | TouchEvent;
}
@Directive({
  selector: '[ngxDropList]',
  host: {
    '[style.position]': '"relative"',
    '[style.scroll-snap-type]': 'dragging ? "none": "" ',
  },
})
export class NgxDropListDirective implements AfterViewInit {
  @Output() drop = new EventEmitter<IDropEvent>();
  @ContentChildren(NgxDraggableDirective)
  _draggables?: QueryList<NgxDraggableDirective>;
  _el: HTMLElement;
  placeHolder!: HTMLElement;
  dragging = false;
  constructor(
    private _dragDropService: NgxDragDropService,
    elRef: ElementRef<HTMLElement>,
    @Inject(DOCUMENT) private _document: Document
  ) {
    this._el = elRef.nativeElement;
    this.createPlaceHolder();
    _dragDropService.registerDropList(this);
  }

  ngAfterViewInit(): void {
    // console.log(this._draggables);
    this.onChangeDragChilds();
    this._draggables?.changes.subscribe((r) => {
      this.onChangeDragChilds();
      // console.log('_draggables', 'change', r);
    });
  }

  onChangeDragChilds() {
    this._draggables?.forEach((el) => {
      el.containerDropList = this;
    });
  }

  createPlaceHolder() {
    this.placeHolder = this._document.createElement('div');
    this.placeHolder.innerHTML = 'placehlder';
    this.placeHolder.className = 'ngx-drag-placeholder';
    this._el.insertAdjacentElement('afterbegin', this.placeHolder);
  }

  onDrop(event: IDropEvent) {
    this.drop.emit(event);
  }
}
