import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  inject,
  InjectionToken,
  Input,
  OnDestroy,
  Output,
  Renderer2,
  RendererStyleFlags2,
} from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { getPointerPosition, getPointerPositionOnViewPort } from '../../utils/get-position';
import { checkBoundX, checkBoundY } from '../../utils/check-boundary';
import { NgxDropListDirective } from './ngx-drop-list.directive';
import { NgxDragDropService } from '../services/ngx-drag-drop.service';
import { getXYfromTransform } from '../../utils/get-transform';
import { IPosition } from '../../interfaces/IPosition';
import { ElementHelper } from '../../utils/element.helper';
import { NgxDragRegisterService } from '../services/ngx-drag-register.service';
import { DOCUMENT } from '@angular/common';
import { AutoScrollService } from '../services/auto-scroll.service';
import { IDragItem } from '../../interfaces/IDragItem';
export const NGX_DROP_LIST = new InjectionToken<NgxDropListDirective>('NgxDropList');

@Directive({
  selector: '[ngxDraggable]',
  standalone: true,
  exportAs: 'NgxDraggable',
})
export class NgxDraggableDirective implements IDragItem, OnDestroy, AfterViewInit {
  private boundaryDomRect?: DOMRect;
  @Input() boundary?: HTMLElement;

  @Input() dragRootElement = '';
  @Output() dragStart = new EventEmitter<IPosition>();
  @Output() dragMove = new EventEmitter<IPosition>();
  @Output() dragEnd = new EventEmitter<IPosition>();

  private previousTransitionProprety?: string;
  _dragging: boolean = false;
  set dragging(val: boolean) {
    this._dragging = val == true;
    if (this._dragging) {
      this.previousTransitionProprety = this.el.style.transitionProperty;
      this._renderer.setStyle(this.el, 'transition-property', 'none', RendererStyleFlags2.Important);
      this._renderer.setStyle(this.el, 'user-select', 'none');
      this._renderer.setStyle(this.el, 'pointer-events', 'none');
      this._renderer.setStyle(this.el, 'cursor', 'grabbing');
      this._renderer.setStyle(this.el, 'z-index', '999999');
      this._renderer.setStyle(this.el, 'touch-action', 'none');
      this._renderer.setStyle(this.el, '-webkit-user-drag', 'none');
      this._renderer.setStyle(this.el, '-webkit-tap-highlight-color', 'transparent');
      this._renderer.setStyle(this.el, 'will-change', 'transform');
      this.el.classList.add('dragging');
    } else {
      if (this.previousTransitionProprety)
        this._renderer.setStyle(this.el, 'transition-property', this.previousTransitionProprety);
      else this._renderer.removeStyle(this.el, 'transition-property');
      this._renderer.removeStyle(this.el, 'user-select');
      this._renderer.removeStyle(this.el, 'pointer-events');
      this._renderer.removeStyle(this.el, 'cursor');
      this._renderer.removeStyle(this.el, 'z-index');
      this._renderer.removeStyle(this.el, 'touch-action');
      this._renderer.removeStyle(this.el, '-webkit-user-drag');
      this._renderer.removeStyle(this.el, '-webkit-tap-highlight-color');
      this._renderer.removeStyle(this.el, 'will-change');

      this.el.classList.remove('dragging');
    }
  }
  get dragging() {
    return this._dragging;
  }
  isTouched = false;
  el: HTMLElement;
  protected x: number = 0;
  protected y: number = 0;
  private previousXY: IPosition = { x: 0, y: 0 };
  private subscriptions: Subscription[] = [];
  public dropList?: NgxDropListDirective;
  public domRect!: DOMRect;

  private readonly _renderer = inject(Renderer2);
  private readonly _dragService = inject(NgxDragDropService);
  private readonly _autoScroll = inject(AutoScrollService);
  private readonly dragRegister = inject(NgxDragRegisterService);
  private readonly elRef = inject(ElementRef);
  private readonly doc = inject(DOCUMENT);

  constructor() {
    this.el = this.elRef.nativeElement;
    this.initDragHandler();
  }

  ngAfterViewInit(): void {
    this.findFirstParentDragRootElement();
    this.init();
    this.updateDomRect();
  }

  updateDomRect() {
    this.domRect = this.el.getBoundingClientRect();
  }
  adjustDomRect(x: number, y: number) {
    // this.domRect.top += top;
    // this.domRect.bottom = this.domRect.top + this.domRect.height;
    // this.domRect.left += left;
    // this.domRect.right = this.domRect.left + this.domRect.width;
    this.domRect = new DOMRect(this.domRect.x + x, this.domRect.y + y, this.domRect.width, this.domRect.height);
  }

  findFirstParentDragRootElement() {
    if (this.dragRootElement) {
      let parentRoot: HTMLElement | null = ElementHelper.findParentBySelector(this.el, this.dragRootElement);
      if (parentRoot) {
        this.el = parentRoot;
      }
    }
    this.el.classList.add('ngx-draggable');
    this.dragRegister.registerDragItem(this);
  }
  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this._autoScroll.stop();
    // this._autoScroll._stopScrollTimers.complete();
    this.dragRegister.removeDragItem(this);
  }

  init() {
    const xy = getXYfromTransform(this.el);
    this.x = xy.x;
    this.y = xy.y;
    if (this.boundary) {
      this.boundaryDomRect = this.boundary.getBoundingClientRect();
    }
  }

  initDragHandler() {
    this.subscriptions.push(
      fromEvent<MouseEvent>(this.el, 'mousedown').subscribe((ev) => this.onMouseDown(ev)),
      fromEvent<TouchEvent>(this.el, 'touchstart').subscribe((ev) => this.onMouseDown(ev)),

      fromEvent<PointerEvent>(window, 'pointerup', { capture: true }).subscribe((ev) => this.onEndDrag(ev)),
      fromEvent<PointerEvent>(window, 'pointercancel', { capture: true }).subscribe((ev) => this.onEndDrag(ev))
    );
  }

  onEndDrag(ev: MouseEvent | TouchEvent) {
    if (this.dragging) {
      this._dragService.stopDrag(this);
      this.dragEnd.emit({ x: this.x, y: this.y });
    }
    this.dragging = false;
    this.isTouched = false;
    this._autoScroll.stop();
  }

  onMouseDown(ev: MouseEvent | TouchEvent) {
    this.previousXY = getPointerPosition(ev);
    this.isTouched = true;
    ev.preventDefault();
    ev.stopPropagation();
    this.init();
    this.subscriptions = this.subscriptions.filter((x) => !x.closed);
    this.subscriptions.push(
      fromEvent<MouseEvent>(this.doc, 'mousemove').subscribe((ev) => this.onMouseMove(ev)),
      fromEvent<TouchEvent>(this.doc, 'touchmove').subscribe((ev) => this.onMouseMove(ev))
    );
  }

  onMouseMove(ev: MouseEvent | TouchEvent) {
    let p = getPointerPositionOnViewPort(ev);
    this._dragService.getPointerElement(p);

    if (this.isTouched && !this.dragging) {
      this._dragService.startDrag(this);
      this.dragStart.emit(this.previousXY);
      this.dragging = true;
    }
    if (!this.dragging) {
      return;
    }
    let position = getPointerPosition(ev);
    // console.time('drgmv');
    const offsetX = position.x - this.previousXY.x;
    const offsetY = position.y - this.previousXY.y;
    const transform = this.updatePosition(offsetX, offsetY, position);
    // this._autoScroll.handleAutoScroll(ev);
    this._dragService.dragMove(this, ev, transform);
    this.dragMove.emit({ x: this.x, y: this.y });
    // console.timeEnd('drgmv');
  }

  updatePosition(offsetX: number, offsetY: number, position: IPosition) {
    if (checkBoundX(this.boundaryDomRect, this.el, offsetX)) {
      this.x += offsetX;
      this.previousXY.x = position.x;
    }
    if (checkBoundY(this.boundaryDomRect, this.el, offsetY)) {
      this.y += offsetY;
      this.previousXY.y = position.y;
    }
    let transform = `translate(${this.x}px, ${this.y}px)`;

    if (!this.dropList || !this.dropList.disableSort) {
      this._renderer.setStyle(this.el, 'transform', transform);
    }
    return transform;
  }
}
