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
import { getPositionFromElement } from '../../utils/get-transform';
import { AutoScroll } from '../services/auto-scroll.service';
import { IPosition } from '../../interfaces/IPosition';
export const NGX_DROP_LIST = new InjectionToken<NgxDropListDirective>('NgxDropList');

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
    '[style.position]': 'disableTransform ? "absolute" : ""',
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
  @Input() disableTransform = false;

  @Output() dragStart = new EventEmitter<IPosition>();
  @Output() dragMove = new EventEmitter<IPosition>();
  @Output() dragEnd = new EventEmitter<IPosition>();

  @Output() entered = new EventEmitter<IPosition>();
  @Output() exited = new EventEmitter<IPosition>();

  dragging = false;
  isTouched = false;
  el: HTMLElement;
  protected x: number = 0;
  protected y: number = 0;
  private previousXY: IPosition = { x: 0, y: 0 };
  private subscriptions: Subscription[] = [];
  private originalPosition: { left: string; top: string; transform: string } = { left: '', top: '', transform: '' };
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
    const xy = getPositionFromElement(this.el, true);
    this.x = xy.x;
    this.y = xy.y;

    if (this.disableTransform) {
      // Get position using the appropriate method based on disableTransform setting
      const position = getPositionFromElement(this.el, !this.disableTransform);
      this.x = position.x;
      this.y = position.y;
      // Store original position styles when using left/top positioning
      const computedStyle = getComputedStyle(this.el);
      this.originalPosition.left = computedStyle.left;
      this.originalPosition.top = computedStyle.top;
      this.originalPosition.transform = computedStyle.transform;

      // Ensure element has absolute positioning when disableTransform is true
      if (computedStyle.position !== 'absolute') {
        this._renderer.setStyle(this.el, 'position', 'absolute');
      }
    }

    console.log('initXY', this.x, this.y, 'disableTransform:', this.disableTransform);
  }

  initDrag() {
    this.subscriptions.push(
      fromEvent<MouseEvent>(this.el, 'mousedown').subscribe((ev) => this.onMouseDown(ev)),
      fromEvent<TouchEvent>(this.el, 'touchstart').subscribe((ev) => this.onMouseDown(ev)),

      fromEvent<TouchEvent>(this.el, 'mouseenter').subscribe((ev) => {
        if (!this._dragService.isDragging) return;
        this._dragService.enterDrag(this);

        let position = getPointerPosition(ev);
        this.entered.emit(position);
      }),
      fromEvent<TouchEvent>(this.el, 'mouseleave').subscribe((ev) => {
        if (!this._dragService.isDragging) return;
        this._dragService.leaveDrag(this);
        let position = getPointerPosition(ev);
        this.exited.emit(position);
      })
    );
  }

  @HostListener('document:mouseup', ['$event'])
  @HostListener('document:touchend', ['$event'])
  onEndDrag(ev: MouseEvent | TouchEvent) {
    if (this.dragging) {
      this._dragService.stopDrag(this);
      this.dragEnd.emit({ x: this.x, y: this.y });
    }
    this.dragging = false;
    this.isTouched = false;
    this._autoScroll._stopScrolling();
    let position = getPointerPosition(ev);
    this.exited.emit(position);
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
    let position = getPointerPosition(ev);

    const offsetX = position.x - this.previousXY.x;
    const offsetY = position.y - this.previousXY.y;
    this._autoScroll.handleAutoScroll(ev);
    this._dragService.dragMove(this, ev);
    this.updatePosition(offsetX, offsetY, position);
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

    console.log('offsetX', offsetX, 'offsetY', offsetY, 'x', this.x, 'y', this.y);

    if (this.disableTransform) {
      // Use left/top positioning when transform is disabled
      this._renderer.setStyle(this.el, 'left', this.x + 'px');
      this._renderer.setStyle(this.el, 'top', this.y + 'px');
      // Clear any existing transform to avoid conflicts
      this._renderer.setStyle(this.el, 'transform', 'none');
    } else {
      // Use transform positioning when transform is enabled
      let transform = `translate(${this.x}px, ${this.y}px)`;
      this._renderer.setStyle(this.el, 'transform', transform);
      // Clear left/top styles to avoid conflicts
      this._renderer.setStyle(this.el, 'left', '');
      this._renderer.setStyle(this.el, 'top', '');
    }
  }

  /**
   * Reset the element's position to its original state
   */
  resetPosition() {
    if (this.disableTransform) {
      this._renderer.setStyle(this.el, 'left', this.originalPosition.left);
      this._renderer.setStyle(this.el, 'top', this.originalPosition.top);
      this._renderer.setStyle(this.el, 'transform', this.originalPosition.transform);
    } else {
      this._renderer.setStyle(this.el, 'transform', 'translate(0px, 0px)');
      this._renderer.setStyle(this.el, 'left', '');
      this._renderer.setStyle(this.el, 'top', '');
    }
    this.x = 0;
    this.y = 0;
  }

  /**
   * Set the element's position manually
   */
  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.updatePosition(0, 0, { x: 0, y: 0 });
  }
}
