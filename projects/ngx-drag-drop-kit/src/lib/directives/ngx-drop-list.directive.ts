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

  @Output() drop = new EventEmitter<IDropEvent>();
  @Output() entered = new EventEmitter<void>();
  @Output() exited = new EventEmitter<void>();
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
        if (!this._dragDropService.isDragging) return;
        this._dragDropService.enterDropList(this);
        this.entered.emit();
      }),
      fromEvent<TouchEvent>(this._el, 'mouseleave').subscribe((ev) => {
        if (!this._dragDropService.isDragging) return;
        this._dragDropService.leaveDropList(this);
        this.exited.emit();
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
    this.subscriptions = [];
  }
}
