import {
  Directive,
  ElementRef,
  HostListener,
  Inject,
  InjectionToken,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Renderer2,
  SkipSelf,
} from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { getPointerPosition } from '../../utils/get-position';
import { checkBoundX, checkBoundY } from '../../utils/check-boundary';
import { NgxDropListDirective } from './ngx-drop-list.directive';
import { NgxDragDropService } from '../services/ngx-drag-drop.service';
import { getXYfromTransform } from '../../utils/get-transform';
export const NGX_DROP_LIST = new InjectionToken<NgxDropListDirective>(
  'NgxDropList'
);

export interface IPosition {
  x: number;
  y: number;
}

@Directive({
  selector: '[ngxDraggable]',
  host: {
    '[style.transition-property]': 'dragging ? "none" : ""',
    '[style.pointer-events]': 'dragging ? "none" : ""',
    '[style.user-select]': 'dragging ? "none" : ""',
    '[style.cursor]': 'dragging ? "grabbing" : ""',
    '[style.z-index]': 'dragging ? "999999" : ""',
    '[class.dragging]': 'dragging',
    '[style.touch-action]': 'dragging ? "none" : ""',
    '[style.-webkit-user-drag]': 'dragging ? "none" : ""',
    '[style.-webkit-tap-highlight-color]': 'dragging ? "transparent" : ""',
    class: 'ngx-draggable',
  },
})
export class NgxDraggableDirective implements OnDestroy, OnInit {
  @Input() boundary?: HTMLElement;
  dragging = false;
  el: HTMLElement;
  protected x: number = 0;
  protected y: number = 0;
  private previousXY: IPosition = { x: 0, y: 0 };
  private scrollSpeed = 10;
  private scrollThreshold = 100;
  private subscriptions: Subscription[] = [];
  containerDropList?: NgxDropListDirective;
  constructor(
    elRef: ElementRef,
    private _renderer: Renderer2,
    private _dragService: NgxDragDropService
  ) {
    this.el = elRef.nativeElement;
    this.initDrag();
  }

  ngOnInit(): void {
    this.initXY();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  initXY() {
    const xy = getXYfromTransform(this.el);
    this.x = xy.x;
    this.y = xy.y;
  }

  initDrag() {
    this.subscriptions.push(
      fromEvent<MouseEvent>(this.el, 'mousedown').subscribe((ev) =>
        this.onMouseDown(ev)
      ),
      fromEvent<TouchEvent>(this.el, 'touchstart').subscribe((ev) =>
        this.onMouseDown(ev)
      ),

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
    this.dragging = false;
    this._dragService.stopDrag(this);
  }

  onMouseDown(ev: MouseEvent | TouchEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    this.previousXY = getPointerPosition(ev);
    this.dragging = true;
    this.initXY();
    this._dragService.startDrag(this);

    this.subscriptions.push(
      fromEvent<MouseEvent>(document, 'mousemove').subscribe((ev) =>
        this.onMouseMove(ev)
      ),
      fromEvent<TouchEvent>(document, 'touchmove').subscribe((ev) =>
        this.onMouseMove(ev)
      )
    );
  }

  onMouseMove(ev: MouseEvent | TouchEvent) {
    if (!this.dragging) {
      return;
    }

    // ev.preventDefault();
    // ev.stopPropagation();
    let position = getPointerPosition(ev);

    const offsetX = position.x - this.previousXY.x;
    const offsetY = position.y - this.previousXY.y;
    this.updatePosition(offsetX, offsetY, position);
    this.handleAutoScroll(ev);
    this._dragService.dragMove(this, ev);
  }

  updatePosition(offsetX: number, offsetY: number, position: IPosition) {
    if (checkBoundX(this.boundary, this.el, offsetX)) {
      this.x += offsetX;
      this.previousXY.x = position.x;
    }
    if (checkBoundY(this.boundary, this.el, offsetY)) {
      this.y += offsetY;
      this.previousXY.y = position.y;
    }
    let transform = `translate(${this.x}px, ${this.y}px)`;
    this._renderer.setStyle(this.el, 'transform', transform);
  }
  handleAutoScroll(ev: MouseEvent | TouchEvent) {
    const clientX =
      ev instanceof MouseEvent ? ev.clientX : ev.targetTouches[0].clientX;
    const clientY =
      ev instanceof MouseEvent ? ev.clientY : ev.targetTouches[0].clientY;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if (clientX < this.scrollThreshold) {
      window.scrollBy(-this.scrollSpeed, 0);
    } else if (clientX > windowWidth - this.scrollThreshold) {
      window.scrollBy(this.scrollSpeed, 0);
    }

    if (clientY < this.scrollThreshold) {
      window.scrollBy(0, -this.scrollSpeed);
    } else if (clientY > windowHeight - this.scrollThreshold) {
      window.scrollBy(0, this.scrollSpeed);
    }
  }
}
