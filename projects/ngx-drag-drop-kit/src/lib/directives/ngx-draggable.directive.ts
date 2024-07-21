import {
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { getPointerPosition } from '../../helper/get-position';

export interface IPosition {
  x: number;
  y: number;
}

@Directive({
  selector: '[NgxDraggable]',
  host: {
    '[style.transition-property]': 'dragging ? "none" : ""',
    '[style.user-select]': 'dragging ? "none" : ""',
    '[style.cursor]': 'dragging ? "grabbing" : ""',
  },
})
export class NgxDraggableDirective implements OnDestroy, OnInit {
  dragging = false;
  el: HTMLElement;
  protected x: number = 0;
  protected y: number = 0;
  private previousXY: IPosition = { x: 0, y: 0 };
  private scrollSpeed = 25;
  private scrollThreshold = 100;
  private subscriptions: Subscription[] = [];
  constructor(elRef: ElementRef, private _renderer: Renderer2) {
    this.el = elRef.nativeElement;
    this.initDrag();
  }

  ngOnInit(): void {
    const trans = getComputedStyle(this.el).getPropertyValue('transform');
    const matrix = trans.replace(/[^0-9\-.,]/g, '').split(',');
    this.x = parseFloat(matrix.length > 6 ? matrix[12] : matrix[4]) || 0;
    this.y = parseFloat(matrix.length > 6 ? matrix[13] : matrix[5]) || 0;
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  initDrag() {
    this.subscriptions.push(
      fromEvent<MouseEvent>(this.el, 'mousedown').subscribe((ev) =>
        this.onMouseDown(ev)
      ),
      fromEvent<TouchEvent>(this.el, 'touchstart').subscribe((ev) =>
        this.onMouseDown(ev)
      )
    );
  }

  @HostListener('document:mouseup', ['$event'])
  @HostListener('document:touchend', ['$event'])
  onEndDrag(ev: MouseEvent | TouchEvent) {
    this.dragging = false;
  }

  onMouseDown(ev: MouseEvent | TouchEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    this.previousXY = getPointerPosition(ev);
    this.dragging = true;

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

    ev.preventDefault();
    ev.stopPropagation();
    let position = getPointerPosition(ev);

    this.updatePosition(
      position.x - this.previousXY.x,
      position.y - this.previousXY.y,
      position
    );
    this.handleAutoScroll(ev);
  }

  updatePosition(offsetX: number, offsetY: number, position: IPosition) {
    this.x += offsetX;
    this.y += offsetY;
    let transform = `translate(${this.x}px, ${this.y}px)`;
    this.previousXY = position;
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
