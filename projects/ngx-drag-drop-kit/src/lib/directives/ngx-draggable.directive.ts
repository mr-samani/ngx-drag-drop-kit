import {
  AfterViewInit,
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
  RendererStyleFlags2,
} from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { getPointerPosition } from '../../utils/get-position';
import { checkBoundX, checkBoundY } from '../../utils/check-boundary';
import { NgxDropListDirective } from './ngx-drop-list.directive';
import { NgxDragDropService } from '../services/ngx-drag-drop.service';
import { getXYfromTransform } from '../../utils/get-transform';
import { AutoScroll } from '../services/auto-scroll.service';
import { IPosition } from '../../interfaces/IPosition';
import { ElementHelper } from '../../utils/element.helper';
export const NGX_DROP_LIST = new InjectionToken<NgxDropListDirective>('NgxDropList');

@Directive({
  selector: '[ngxDraggable]',
  host: {
    '[style.user-select]': 'dragging  ? "none" : ""',
    '[style.cursor]': 'dragging ? "grabbing" : ""',
    '[style.z-index]': 'dragging ? "999999" : ""',
    '[class.dragging]': 'dragging',
    '[style.touch-action]': 'dragging ? "none" : ""',
    '[style.-webkit-user-drag]': 'dragging ? "none" : ""',
    '[style.-webkit-tap-highlight-color]': 'dragging ? "transparent" : ""',
  },
  standalone: true,
  exportAs: 'NgxDraggable',
})
export class NgxDraggableDirective implements OnDestroy, AfterViewInit {
  private boundaryDomRect?: DOMRect;
  @Input() boundary?: HTMLElement;

  @Input() dragRootElement = '';
  @Output() dragStart = new EventEmitter<IPosition>();
  @Output() dragMove = new EventEmitter<IPosition>();
  @Output() dragEnd = new EventEmitter<IPosition>();

  @Output() entered = new EventEmitter<IPosition>();
  @Output() exited = new EventEmitter<IPosition>();

  private previousTransitionProprety?: string;
  _dragging: boolean = false;
  set dragging(val: boolean) {
    this._dragging = val == true;
    if (this._dragging) {
      this.previousTransitionProprety = getComputedStyle(this.el).transitionProperty;
      this._renderer.setStyle(this.el, 'transition-property', 'none', RendererStyleFlags2.Important);
    } else {
      this._renderer.setStyle(this.el, 'transition-property', this.previousTransitionProprety);
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
  containerDropList?: NgxDropListDirective;

  constructor(
    elRef: ElementRef,
    private _renderer: Renderer2,
    public _dragService: NgxDragDropService,
    private _autoScroll: AutoScroll
  ) {
    this.el = elRef.nativeElement;
    this.initDragHandler();
  }

  ngAfterViewInit(): void {
    this.findFirstParentDragRootElement();
    this.initDragItems();
    this.init();
  }
  findFirstParentDragRootElement() {
    if (this.dragRootElement) {
      let parentRoot: HTMLElement | null = ElementHelper.findParentBySelector(this.el, this.dragRootElement);
      if (parentRoot) {
        this.el = parentRoot;
      }
    }
    this.el.classList.add('ngx-draggable');
  }
  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this._autoScroll._stopScrolling();
    // this._autoScroll._stopScrollTimers.complete();
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
      fromEvent<TouchEvent>(this.el, 'touchstart').subscribe((ev) => this.onMouseDown(ev))
    );
  }
  initDragItems() {
    this.subscriptions.push(
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
    this.init();
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
    if (checkBoundX(this.boundaryDomRect, this.el, offsetX)) {
      this.x += offsetX;
      this.previousXY.x = position.x;
    }
    if (checkBoundY(this.boundaryDomRect, this.el, offsetY)) {
      this.y += offsetY;
      this.previousXY.y = position.y;
    }

    // Use transform positioning when transform is enabled
    let transform = `translate(${this.x}px, ${this.y}px)`;
    this._renderer.setStyle(this.el, 'transform', transform);
  }
}
