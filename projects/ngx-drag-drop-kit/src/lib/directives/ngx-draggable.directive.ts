import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  inject,
  InjectionToken,
  Input,
  OnDestroy,
  Output,
  Renderer2,
  RendererStyleFlags2,
  DOCUMENT,
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

import { AutoScrollService } from '../services/auto-scroll.service';
import { DragItemRef } from './DragItemRef';
import { isFullRowElement } from '../../utils/element-is-full-row';
export const NGX_DROP_LIST = new InjectionToken<NgxDropListDirective>('NgxDropList');

@Directive({
  selector: '[ngxDraggable]',
  standalone: true,
  exportAs: 'NgxDraggable',
})
export class NgxDraggableDirective extends DragItemRef implements OnDestroy, AfterViewInit {
  private boundaryDomRect?: DOMRect;
  @Input() boundary?: HTMLElement;

  @Input() dragRootElement = '';
  @Output() dragStart = new EventEmitter<IPosition>();
  @Output() dragMove = new EventEmitter<IPosition>();
  @Output() dragEnd = new EventEmitter<IPosition>();

  private previousTransitionProprety?: string;
  set dragging(val: boolean) {
    this.isDragging = val == true;
    if (this.isDragging) {
      this.previousTransitionProprety = this.el.style.transitionProperty;
      this.renderer.setStyle(this.el, 'transition-property', 'none', RendererStyleFlags2.Important);
      this.renderer.setStyle(this.el, 'user-select', 'none');
      this.renderer.setStyle(this.el, 'pointer-events', 'none');
      this.renderer.setStyle(this.el, 'cursor', 'grabbing');
      this.renderer.setStyle(this.el, 'z-index', '999999');
      this.renderer.setStyle(this.el, 'touch-action', 'none');
      this.renderer.setStyle(this.el, '-webkit-user-drag', 'none');
      this.renderer.setStyle(this.el, '-webkit-tap-highlight-color', 'transparent');
      this.renderer.setStyle(this.el, 'will-change', 'transform');
      this.el.classList.add('dragging');
    } else {
      if (this.previousTransitionProprety)
        this.renderer.setStyle(this.el, 'transition-property', this.previousTransitionProprety);
      else this.renderer.removeStyle(this.el, 'transition-property');
      this.renderer.removeStyle(this.el, 'user-select');
      this.renderer.removeStyle(this.el, 'pointer-events');
      this.renderer.removeStyle(this.el, 'cursor');
      this.renderer.removeStyle(this.el, 'z-index');
      this.renderer.removeStyle(this.el, 'touch-action');
      this.renderer.removeStyle(this.el, '-webkit-user-drag');
      this.renderer.removeStyle(this.el, '-webkit-tap-highlight-color');
      this.renderer.removeStyle(this.el, 'will-change');

      this.el.classList.remove('dragging');
    }
  }
  get dragging() {
    return this.isDragging;
  }
  isTouched = false;
  protected x: number = 0;
  protected y: number = 0;
  private previousXY: IPosition = { x: 0, y: 0 };
  private isFixedPosition = false;
  private startSubscriptions: Subscription[] = [];
  private subscriptions: Subscription[] = [];

  private readonly renderer = inject(Renderer2);
  private readonly doc = inject(DOCUMENT);
  private readonly dragRegister = inject(NgxDragRegisterService);
  private readonly dragService = inject(NgxDragDropService);
  private readonly autoScroll = inject(AutoScrollService);

  constructor(elRef: ElementRef) {
    super(elRef.nativeElement);
    this.el = elRef.nativeElement;
    this.initDragHandler();
  }

  ngAfterViewInit(): void {
    this.findFirstParentDragRootElement();
    this.isFullRow = isFullRowElement(this.el);
    this.init();
    this.updateDomRect();
  }

  adjustDomRect(x: number, y: number) {
    // this._domRect.top = this._domRect.y;
    // this._domRect.left = this._domRect.x;
    // this._domRect.bottom = this._domRect.y + this._domRect.height;
    // this._domRect.right = this._domRect.x + this._domRect.width;
    this._domRect = new DOMRect(
      this._domRect.left + x,
      this._domRect.top + y,
      this._domRect.width,
      this._domRect.height
    );
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
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.startSubscriptions.forEach(sub => sub.unsubscribe());
    this.autoScroll.stop();
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
    this.startSubscriptions = [
      (fromEvent<MouseEvent>(this.el, 'mousedown').subscribe(ev => this.onMouseDown(ev)),
      fromEvent<TouchEvent>(this.el, 'touchstart', { passive: false }).subscribe(ev => this.onMouseDown(ev))),
    ];
  }

  onEndDrag(ev: MouseEvent | TouchEvent) {
    if (this.dragging) {
      this.dragService.stopDrag(this);
      this.dragEnd.emit({ x: this.x, y: this.y });
    }
    this.dragging = false;
    this.isTouched = false;
    this.autoScroll.stop();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onMouseDown(ev: MouseEvent | TouchEvent) {
    const isLeftClick = ev instanceof MouseEvent ? ev.button === 0 : true;
    if (!isLeftClick) return;
    ev.preventDefault();
    ev.stopPropagation();
    const styles = getComputedStyle(this.el);
    this.isFixedPosition = styles.position === 'fixed';

    // اگر fixed است از viewport position استفاده کن
    this.previousXY = this.isFixedPosition ? getPointerPositionOnViewPort(ev) : getPointerPosition(ev);

    this.isTouched = true;
    this.init();
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [
      fromEvent<MouseEvent>(this.doc, 'mousemove').subscribe(ev => this.onMouseMove(ev)),
      fromEvent<TouchEvent>(this.doc, 'touchmove').subscribe(ev => this.onMouseMove(ev)),
      fromEvent<PointerEvent>(window, 'pointerup', { capture: true }).subscribe(ev => this.onEndDrag(ev)),
      fromEvent<PointerEvent>(window, 'pointercancel', { capture: true }).subscribe(ev => this.onEndDrag(ev)),
    ];
  }

  onMouseMove(ev: MouseEvent | TouchEvent) {
    let p = getPointerPositionOnViewPort(ev);
    this.dragService.getPointerElement(p);

    if (this.isTouched && !this.dragging) {
      this.dragging = true;
      this.dragService.startDrag(this);
      this.dragStart.emit(this.previousXY);
    }
    if (!this.dragging) {
      return;
    }

    let position = getPointerPosition(ev);

    if (this.isFixedPosition) {
      position = getPointerPositionOnViewPort(ev);
    }

    const offsetX = position.x - this.previousXY.x;
    const offsetY = position.y - this.previousXY.y;

    this.autoScroll.handleAutoScroll(ev);

    if (this.dropList) {
      this.dragService.dragMove(this, ev, offsetX, offsetY);
    } else {
      this.updatePosition(offsetX, offsetY, position);
    }
    this.dragMove.emit({ x: this.x, y: this.y });
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
    let transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
    this.renderer.setStyle(this.el, 'transform', transform);
    return transform;
  }
}
