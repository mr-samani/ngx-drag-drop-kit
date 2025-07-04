import {
  AfterViewInit,
  ContentChildren,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
} from '@angular/core';
import { NgxDragDropService } from '../services/ngx-drag-drop.service';
import { NgxDraggableDirective } from './ngx-draggable.directive';
import { Subscription, fromEvent } from 'rxjs';
import { IDropEvent } from '../../models/IDropEvent';
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

  connectedTo: HTMLElement[] = [];
  @Input('connectedTo') set connections(list: HTMLElement[]) {
    if (Array.isArray(list)) {
      this.connectedTo = list;
    } else {
      console.warn('NgxDropList', 'connectedTo must be array!');
      this.connectedTo = [];
    }
  }

  @Output() drop = new EventEmitter<IDropEvent>();
  @ContentChildren(NgxDraggableDirective)
  _draggables?: QueryList<NgxDraggableDirective>;
  el: HTMLElement;
  isDragging = false;

  initCursor = '';
  private subscriptions: Subscription[] = [];
  constructor(public _dragDropService: NgxDragDropService, elRef: ElementRef<HTMLElement>) {
    this.el = elRef.nativeElement;
    this.initCursor = this.el.style.cursor;
    _dragDropService.registerDropList(this);
  }

  ngAfterViewInit(): void {
    this.onChangeDragChilds();
    this._draggables?.changes.subscribe((r) => {
      this.onChangeDragChilds();
      //console.log('_draggables', 'change', r);
    });
    // console.log(this._draggables);
    // this.subscriptions.push(
    //   fromEvent<TouchEvent>(this.el, 'mouseenter').subscribe((ev) => {
    //     console.log('entered', this.el.id);
    //     if (!this._dragDropService.isDragging) return;
    //     if (this.checkAllowedConnections() == true) {
    //       this.el.style.cursor = this.previousCursor;
    //       this._dragDropService.enterDropList(this);
    //       this.entered.emit();
    //     } else {
    //       this.el.style.cursor = 'no-drop';
    //     }
    //   }),
    //   fromEvent<TouchEvent>(this.el, 'mouseleave').subscribe((ev) => {
    //     console.log('leaved', this.el.id);
    //     if (!this._dragDropService.isDragging) return;
    //     if (this.checkAllowedConnections()) {
    //       this._dragDropService.leaveDropList(this);
    //       this.exited.emit();
    //     }
    //   })
    // );
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
    this.subscriptions = [];
  }
}
