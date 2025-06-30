import {
  AfterViewInit,
  ContentChildren,
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  Output,
  QueryList,
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
    '[style.scroll-snap-type]': 'isDragging ? "none": "" ',
    '[style.user-select]': 'isDragging ? "none" : ""',
  },
  standalone: true,
  exportAs: 'NgxDropList',
})
export class NgxDropListDirective<T = any> implements AfterViewInit {
  @Input() data?: T;
  @Input() disableSort: boolean = false;
  @Input() direction: 'horizontal' | 'vertical' = 'vertical';

  @Output() drop = new EventEmitter<IDropEvent>();
  @ContentChildren(NgxDraggableDirective)
  _draggables?: QueryList<NgxDraggableDirective>;
  _el: HTMLElement;
  isDragging = false;
  private subscriptions: Subscription[] = [];
  constructor(public _dragDropService: NgxDragDropService, elRef: ElementRef<HTMLElement>) {
    this._el = elRef.nativeElement;
    _dragDropService.registerDropList(this);
  }

  ngAfterViewInit(): void {
    this.onChangeDragChilds();
    this._draggables?.changes.subscribe((r) => {
      this.onChangeDragChilds();
      //console.log('_draggables', 'change', r);
    });
    // console.log(this._draggables);
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
    this._draggables?.reset([]);
  }

  onChangeDragChilds() {
    this._draggables?.forEach((el) => {
      el.containerDropList = this;
    });
  }

  onDrop(event: IDropEvent) {
    this.drop.emit(event);
  }
}
