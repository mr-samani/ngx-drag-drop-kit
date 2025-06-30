import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  InjectionToken,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { getPointerPosition } from '../../utils/get-position';
import { checkBoundX, checkBoundY } from '../../utils/check-boundary';
import { NgxDropListDirective } from './ngx-drop-list.directive';
import { NgxDragDropService } from '../services/ngx-drag-drop.service';
import { getXYfromTransform } from '../../utils/get-transform';
import { AutoScroll } from '../services/auto-scroll.service';
export const NGX_DROP_LIST = new InjectionToken<NgxDropListDirective>('NgxDropList');

export interface IPosition {
  x: number;
  y: number;
}

@Directive({
  selector: '[ngxDraggable]',
  host: {
    '[style.transition-property]': 'dragging ? "none" : ""',
    '[style.user-select]': 'dragging  ? "none" : ""',
    '[style.cursor]': 'dragging ? "grabbing" : ""',
    '[style.z-index]': 'dragging ? "999999" : ""',
    '[class.dragging]': 'dragging',
    '[style.touch-action]': 'dragging ? "none" : ""',
    '[style.-webkit-user-drag]': 'dragging ? "none" : ""',
    '[style.-webkit-tap-highlight-color]': 'dragging ? "transparent" : ""',
    class: 'ngx-draggable',
  },
  standalone: true,
  exportAs: 'NgxDraggable',
})
export class NgxDraggableDirective implements OnDestroy, OnInit {
  private _boundary?: HTMLElement;
  @Input() set boundary(val: HTMLElement) {
    this._boundary = val;
  }
  @Output() dragStart = new EventEmitter<IPosition>();
  @Output() dragMove = new EventEmitter<IPosition>();
  @Output() dragEnd = new EventEmitter<IPosition>();

  dragging = false;
  isTouched = false;
  el: HTMLElement;
  protected x: number = 0;
  protected y: number = 0;
  private previousXY: IPosition = { x: 0, y: 0 };
  private subscriptions: Subscription[] = [];
  containerDropList?: NgxDropListDirective;
  constructor(
    elRef: ElementRef,
    private _renderer: Renderer2,
    public _dragService: NgxDragDropService,
    private _autoScroll: AutoScroll
  ) {
    this.el = elRef.nativeElement;
    this.initDrag();
  }

  ngOnInit(): void {
    this.initXY();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this._autoScroll._stopScrolling();
    // this._autoScroll._stopScrollTimers.complete();
  }

  initXY() {
    const xy = getXYfromTransform(this.el);
    this.x = xy.x;
    this.y = xy.y;
  }

  initDrag() {
    this.subscriptions.push(
      fromEvent<MouseEvent>(this.el, 'mousedown').subscribe((ev) => this.onMouseDown(ev)),
      fromEvent<TouchEvent>(this.el, 'touchstart').subscribe((ev) => this.onMouseDown(ev)),

      fromEvent<TouchEvent>(this.el, 'mouseenter').subscribe((ev) => {
        this._dragService.enterDrag(this);
      }),
      fromEvent<TouchEvent>(this.el, 'mouseleave').subscribe((ev) => {
        this._dragService.leaveDrag(this);
      })
    );
  }

  @HostListener('document:mouseup', ['$event'])
  @HostListener('document:touchend', ['$event'])
  onEndDrag(ev: MouseEvent | TouchEvent) {
    if (this.dragging) {
      this._dragService.stopDrag(this);
      this.dragEnd.emit();
    }
    this.dragging = false;
    this.isTouched = false;
    this._autoScroll._stopScrolling();
  }

  onMouseDown(ev: MouseEvent | TouchEvent) {
    this.previousXY = getPointerPosition(ev);
    this.isTouched = true;
    ev.preventDefault();
    ev.stopPropagation();
    this.initXY();
    this.subscriptions = this.subscriptions.filter((x) => !x.closed);
    this.subscriptions.push(
      fromEvent<MouseEvent>(document, 'mousemove').subscribe((ev) => this.onMouseMove(ev)),
      fromEvent<TouchEvent>(document, 'touchmove').subscribe((ev) => this.onMouseMove(ev))
    );
  }

  onMouseMove(ev: MouseEvent | TouchEvent) {
    if (this.isTouched && !this.dragging) {
      this._dragService.startDrag(this);
      this.dragStart.emit(this.previousXY);
      this.dragging = true;
    }
    if (!this.dragging) {
      return;
    }

    // ev.preventDefault();
    // ev.stopPropagation();
    let position = getPointerPosition(ev);

    const offsetX = position.x - this.previousXY.x;
    const offsetY = position.y - this.previousXY.y;
    this.updatePosition(offsetX, offsetY, position);
    this._autoScroll.handleAutoScroll(ev);
    this._dragService.dragMove(this, ev);
    this.dragMove.emit({ x: this.x, y: this.y });
  }

  updatePosition(offsetX: number, offsetY: number, position: IPosition) {
    if (checkBoundX(this._boundary, this.el, offsetX)) {
      this.x += offsetX;
      this.previousXY.x = position.x;
    }
    if (checkBoundY(this._boundary, this.el, offsetY)) {
      this.y += offsetY;
      this.previousXY.y = position.y;
    }
    let transform = `translate(${this.x}px, ${this.y}px)`;
    this._renderer.setStyle(this.el, 'transform', transform);
  }
}
