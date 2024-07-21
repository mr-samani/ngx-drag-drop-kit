import {
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import {
  getOffsetPosition,
  getPointerPosition,
} from '../../helper/get-position';
import { Subscription, fromEvent } from 'rxjs';
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
   // '[style.position]': 'dragging ? "absolute" : ""',
  },
})
export class NgxDraggableDirective implements OnDestroy, OnInit {
  dragging = false;
  el: HTMLElement;
  // private curserPositionInElement :  IPosition = { x :  0, y :  0 };

  protected x: number = 0;
  protected y: number = 0;
  private previousXY: IPosition = { x: 0, y: 0 };

  private subscriptions: Subscription[] = [];
  constructor(elRef: ElementRef, private _renderer: Renderer2) {
    this.el = elRef.nativeElement;
    this.initDrag();
  }

  ngOnInit(): void {
    var trans = getComputedStyle(this.el).getPropertyValue('transform');
    var matrix = trans.replace(/[^0-9\-.,]/g, '').split(',');
    var ty = parseFloat(matrix.length > 6 ? matrix[13] : matrix[5]);
    // TODO :  set initialize translate x , y
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
  /**
   * End dragging
   * on document mouse up
   * @param ev mouse event | touch event
   */
  @HostListener('document : mouseup', ['$event'])
  onMouseUp(ev: MouseEvent | TouchEvent) {
    this.dragging = false;
  }

  /**
   * End dragging
   * on document touch end
   * @param ev mouse event | touch event
   */
  @HostListener('document : touchend', ['$event'])
  onTouchEnd(ev: MouseEvent | TouchEvent) {
    this.dragging = false;
  }

  /**
   * Start dragging
   * on mouse or touch down
   * @param ev mouse event | touch event
   */
  onMouseDown(ev: MouseEvent | TouchEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    this.previousXY = getPointerPosition(ev);
    this.dragging = true;
  }

  /**
   * Move
   * on mouse or touch move
   * @param ev mouse event | touch event
   */
  @HostListener('document : mousemove', ['$event'])
  @HostListener('document : touchmove', ['$event'])
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
  }

  updatePosition(offsetX: number, offsetY: number, position: IPosition) {
    this.x += offsetX;
    this.y += offsetY;
    let transform = 'translate(' + this.x + 'px, ' + this.y + 'px)';
    this.previousXY = position;
    this._renderer.setStyle(this.el, 'transform', transform);
  }
}
