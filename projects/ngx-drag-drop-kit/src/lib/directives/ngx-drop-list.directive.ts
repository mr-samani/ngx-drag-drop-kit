import {
  AfterViewInit,
  ContentChildren,
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
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
import { Subscription, fromEvent } from 'rxjs';
export interface IDropEvent<DataType = any> {
  /** Index of the item when it was picked up. */
  previousIndex: number;
  /** Current index of the item. */
  currentIndex: number;
  /** Item that is being dropped. */
  item: NgxDraggableDirective;
  /** Container in which the item was dropped. */
  container: NgxDropListDirective<DataType>;
  /** Container from which the item was picked up. Can be the same as the `container`. */
  previousContainer: NgxDropListDirective<DataType>;
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
export class NgxDropListDirective<T = any> implements AfterViewInit {
  @Input() data?: T;
  @Output() drop = new EventEmitter<IDropEvent>();
  @ContentChildren(NgxDraggableDirective)
  _draggables?: QueryList<NgxDraggableDirective>;
  _el: HTMLElement;
  placeHolder!: HTMLElement;
  dragging = false;
  private subscriptions: Subscription[] = [];
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

    this.subscriptions.push(
      fromEvent<TouchEvent>(this._el, 'mouseenter').subscribe((ev) => {
        this._dragDropService.enterDropList(this);
      }),
      fromEvent<TouchEvent>(this._el, 'mouseleave').subscribe((ev) => {
        this._dragDropService.leaveDropList(this);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  onChangeDragChilds() {
    this._draggables?.forEach((el) => {
      el.containerDropList = this;
    });
  }

  createPlaceHolder() {
    this.placeHolder = this._document.createElement('div');
    this.placeHolder.style.display = 'inline-block';
    this.placeHolder.className = 'ngx-drag-placeholder';
    this._el.insertAdjacentElement('afterbegin', this.placeHolder);
  }

  onDrop(event: IDropEvent) {
    this.drop.emit(event);
  }
}
