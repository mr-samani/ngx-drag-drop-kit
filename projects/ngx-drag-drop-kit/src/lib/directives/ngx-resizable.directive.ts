import { DOCUMENT } from '@angular/common';
import {
  Directive,
  ElementRef,
  HostListener,
  Inject,
  Input,
  Renderer2,
} from '@angular/core';
import { Corner } from '../../utils/corner-type';
import { checkBoundX, checkBoundY } from '../../utils/check-boundary';

@Directive({
  selector: '[ngxResizable]',
  host: {
    '[style.position]': '"relative"',
    '[style.transition-property]': 'dragging ? "none" : ""',
    '[style.user-select]': 'dragging ? "none" : ""',
    '[style.z-index]': 'dragging ? "999999" : ""',
  },
})
export class NgxResizableDirective {
  @Input() boundary?: HTMLElement;
  @Input() minWidth = 20;
  @Input() minHeight = 20;

  protected resizer!: Function;
  protected px: number = 0;
  protected py: number = 0;

  protected x: number = 0;
  protected y: number = 0;

  protected width!: number;
  protected height!: number;
  protected left!: number;
  protected top!: number;

  dragging = false;
  protected corners: Corner[] = [
    'top',
    'right',
    'left',
    'bottom',
    'topLeft',
    'topRight',
    'bottomLeft',
    'bottomRight',
  ];
  el: HTMLElement;
  constructor(
    elRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.el = elRef.nativeElement;
    this.addCornerDiv();
  }

  @HostListener('document:mousemove', ['$event'])
  private onCornerMouseMove(event: MouseEvent) {
    if (!this.dragging) {
      return;
    }
    let offsetX = event.clientX - this.px;
    let offsetY = event.clientY - this.py;
    this.onCornerMove(offsetX, offsetY, event.clientX, event.clientY);
  }

  @HostListener('document:touchmove', ['$event'])
  private onCornerTouchMove(event: TouchEvent) {
    if (!this.dragging) {
      return;
    }
    let offsetX = event.touches[0].clientX - this.px;
    let offsetY = event.touches[0].clientY - this.py;
    let clientX = event.touches[0].clientX;
    let clientY = event.touches[0].clientY;
    this.onCornerMove(offsetX, offsetY, clientX, clientY);
  }
  @HostListener('document:mouseup', ['$event'])
  @HostListener('document:touchend', ['$event'])
  private onCornerRelease(event: MouseEvent) {
    // if (this.draggingWindow) {
    //   this.onDragEnd.emit(this.getPosition());
    // }
    // if (this.draggingCorner) {
    //   this.onResizeEnd.emit(this.getPosition());
    // }
    this.dragging = false;
  }

  private addCornerDiv() {
    for (const corner of this.corners) {
      const child = this.document.createElement('div');
      child.classList.add('widget-corner-resize', corner);
      const self: any = this;
      child.addEventListener('mousedown', ($event) => {
        this.onCornerClick($event, self[corner + 'Resize']);
      });
      child.addEventListener('touchstart', ($event) => {
        this.onCornerClick($event, self[corner + 'Resize']);
      });
      this.renderer.appendChild(this.el, child);
    }
  }

  private onCornerClick(event: MouseEvent | TouchEvent, resizer: Function) {
    this.dragging = true;
    this.px =
      event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    this.py =
      event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    this.resizer = resizer;
    event.preventDefault();
    event.stopPropagation();
    this.initSize();
    this.checkFlexibale();
  }

  private initSize() {
    const elRec = this.el.getBoundingClientRect();
    this.width = elRec.width;
    this.height = elRec.height;
    this.left = this.el.offsetLeft;
    this.top = this.el.offsetTop;
    this.el.style.top = this.top + 'px';
    this.el.style.left = this.left + 'px';
    this.setElPosition();
  }

  public setElPosition() {
    this.el.style.transform = `translate(${this.x}px,${this.y}px)`;
    //this.el.style.removeProperty('position');
    this.el.style.position = 'fixed';
    this.el.style.width = this.width + 'px';
    this.el.style.height = this.height + 'px';
  }

  // TODO : resize material dialog
  // TODO not working in rtl
  private checkFlexibale() {
    if (!document.defaultView || !this.el.parentElement) {
      return;
    }
    let parentStyle = document.defaultView.getComputedStyle(
      this.el.parentElement
    );
    if (
      (parentStyle.alignItems && parentStyle.alignItems !== 'normal') ||
      (parentStyle.justifyContent && parentStyle.justifyContent !== 'normal')
    ) {
      this.el.parentElement.style.display = 'block';
      this.el.parentElement.style.alignItems = 'unset';
      this.el.parentElement.style.justifyContent = 'unset';
      this.el.style.position = 'unset !important';
    }
  }

  private onCornerMove(
    offsetX: number,
    offsetY: number,
    clientX: number,
    clientY: number
  ) {
    let lastX = this.x;
    let lastY = this.y;
    let pWidth = this.width;
    let pHeight = this.height;
    this.resizer(offsetX, offsetY);
    if (this.width < this.minWidth) {
      this.x = lastX;
      this.width = pWidth;
    }
    if (this.height < this.minHeight) {
      this.y = lastY;
      this.height = pHeight;
    }

    this.px = clientX;
    this.py = clientY;
    this.setElPosition();
    // this.onResize.emit(this.getPosition());
  }

  /*--------------RESIZE FUNCTIONS--------------------------*/
  private topLeftResize(offsetX: number, offsetY: number) {
    if (checkBoundX(this.boundary, this.el, offsetX, true, false)) {
      this.x += offsetX;
      this.width -= offsetX;
    }
    if (checkBoundY(this.boundary, this.el, offsetY)) {
      this.y += offsetY;
      this.height -= offsetY;
    }
  }

  private topRightResize(offsetX: number, offsetY: number) {
    if (checkBoundX(this.boundary, this.el, offsetX, false, true)) {
      this.width += offsetX;
    }
    if (checkBoundY(this.boundary, this.el, offsetY, true, false)) {
      this.y += offsetY;
      this.height -= offsetY;
    }
  }

  private bottomLeftResize(offsetX: number, offsetY: number) {
    if (checkBoundX(this.boundary, this.el, offsetX, true, false)) {
      this.x += offsetX;
      this.width -= offsetX;
    }
    if (checkBoundY(this.boundary, this.el, offsetY, false)) {
      this.height += offsetY;
    }
  }

  private bottomRightResize(offsetX: number, offsetY: number) {
    if (checkBoundX(this.boundary, this.el, offsetX, false)) {
      this.width += offsetX;
    }
    if (checkBoundY(this.boundary, this.el, offsetY, false)) {
      this.height += offsetY;
    }
  }
  private topResize(offsetX: number, offsetY: number) {
    if (checkBoundY(this.boundary, this.el, offsetY, true, false)) {
      this.y += offsetY;
      this.height -= offsetY;
    }
  }
  private rightResize(offsetX: number, offsetY: number) {
    if (checkBoundX(this.boundary, this.el, offsetX, false)) {
      this.width += offsetX;
    }
  }
  private bottomResize(offsetX: number, offsetY: number) {
    if (checkBoundY(this.boundary, this.el, offsetY, false)) {
      this.height += offsetY;
    }
  }
  private leftResize(offsetX: number, offsetY: number) {
    if (checkBoundX(this.boundary, this.el, offsetX, true, false)) {
      this.x += offsetX;
      this.width -= offsetX;
    }
  }
}
