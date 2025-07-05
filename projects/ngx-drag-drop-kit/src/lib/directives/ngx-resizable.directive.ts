import { DOCUMENT } from '@angular/common';
import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { Corner } from '../../utils/corner-type';
import { checkBoundX, checkBoundY } from '../../utils/check-boundary';
import { getXYfromTransform } from '../../utils/get-transform';

@Directive({
  selector: '[ngxResizable]',
  host: {
    '[style.position]': '"relative"',
    '[style.transition-property]': 'resizing ? "none" : ""',
    '[style.user-select]': 'resizing ? "none" : ""',
    '[style.z-index]': 'resizing ? "999999" : ""',
    '[class.resizing]': 'resizing',
    class: 'ngx-resizable',
  },
  standalone: true,
  exportAs: 'NgxResizable',
})
export class NgxResizableDirective implements OnInit {
  private _boundary?: HTMLElement;
  @Input() set boundary(val: HTMLElement) {
    this._boundary = val;
  }
  @Input() minWidth = 20;
  @Input() minHeight = 20;
  @Input() disableTransform = false;
  @Input() corners: Corner[] = ['top', 'right', 'left', 'bottom', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
  @Output() resizeStart = new EventEmitter();
  @Output() resize = new EventEmitter();
  @Output() resizeEnd = new EventEmitter();
  protected resizer!: Function;
  protected px: number = 0;
  protected py: number = 0;

  protected x: number = 0;
  protected y: number = 0;

  protected width!: number;
  protected height!: number;
  protected left!: number;
  protected top!: number;

  resizing = false;
  el: HTMLElement;
  isRtl: boolean;
  constructor(
    elRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.el = elRef.nativeElement;
    this.isRtl = getComputedStyle(this.el).direction === 'rtl';
  }

  ngOnInit(): void {
    this.addCornerDiv();
    this.initXY();
  }

  initXY() {
    const xy = getXYfromTransform(this.el);
    this.x = xy.x;
    this.y = xy.y;
  }

  @HostListener('document:mousemove', ['$event'])
  private onCornerMouseMove(event: MouseEvent) {
    if (!this.resizing) {
      return;
    }
    let offsetX = event.clientX - this.px;
    let offsetY = event.clientY - this.py;
    this.onCornerMove(offsetX, offsetY, event.clientX, event.clientY);
  }

  @HostListener('document:touchmove', ['$event'])
  private onCornerTouchMove(event: TouchEvent) {
    if (!this.resizing) {
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
    if (this.resizing) {
      this.resizeEnd.emit();
    }
    this.resizing = false;
  }

  private addCornerDiv() {
    for (const corner of this.corners) {
      const child = this.document.createElement('div');
      child.classList.add('ngx-corner-resize', corner);
      const self: any = this;
      child.addEventListener('mousedown', ($event) => {
        this.onCornerClick($event, self[corner + 'Resize']);
      });
      child.addEventListener('touchstart', ($event) => {
        this.onCornerClick($event, self[corner + 'Resize']);
      });
      this.el.insertAdjacentElement('afterbegin', child);
    }
  }

  private onCornerClick(event: MouseEvent | TouchEvent, resizer: Function) {
    this.resizing = true;
    this.isRtl = getComputedStyle(this.el).direction === 'rtl';

    this.px = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    this.py = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    this.resizer = resizer;
    event.preventDefault();
    event.stopPropagation();
    this.initXY();

    this.initSize();
    this.checkFlexibale();
    this.resizeStart.emit();
  }

  private initSize() {
    const elRec = this.el.getBoundingClientRect();
    this.width = elRec.width;
    this.height = elRec.height;
    this.left = this.el.offsetLeft;
    this.top = this.el.offsetTop;
    // this.el.style.top = this.top + 'px';
    // this.el.style.left = this.left + 'px';
    this.setElPosition();
  }

  public setElPosition() {
    if (!this.disableTransform) {
      this.el.style.transform = `translate(${this.x}px,${this.y}px)`;
    }
    //this.el.style.removeProperty('position');
    // this.el.style.position = 'fixed';
    this.el.style.width = this.width + 'px';
    this.el.style.height = this.height + 'px';
  }

  // TODO : resize material dialog
  // TODO not working in rtl
  private checkFlexibale() {
    // if (!document.defaultView || !this.el.parentElement) {
    //   return;
    // }
    // let parentStyle = document.defaultView.getComputedStyle(
    //   this.el.parentElement
    // );
    // if (
    //   (parentStyle.alignItems && parentStyle.alignItems !== 'normal') ||
    //   (parentStyle.justifyContent && parentStyle.justifyContent !== 'normal')
    // ) {
    //   this.el.parentElement.style.display = 'block';
    //   this.el.parentElement.style.alignItems = 'unset';
    //   this.el.parentElement.style.justifyContent = 'unset';
    //   this.el.style.position = 'unset !important';
    // }
  }

  private onCornerMove(offsetX: number, offsetY: number, clientX: number, clientY: number) {
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
    this.resize.emit();
  }

  /*--------------RESIZE FUNCTIONS--------------------------*/
  private topLeftResize(offsetX: number, offsetY: number) {
    if (checkBoundX(this._boundary, this.el, offsetX, true, false)) {
      this.width -= offsetX;
      if (!this.isRtl) {
        this.x += offsetX;
      }
    }
    if (checkBoundY(this._boundary, this.el, offsetY)) {
      this.y += offsetY;
      this.height -= offsetY;
    }
  }

  private topRightResize(offsetX: number, offsetY: number) {
    if (checkBoundX(this._boundary, this.el, offsetX, false, true)) {
      this.width += offsetX;
      if (this.isRtl) {
        this.x += offsetX;
      }
    }
    if (checkBoundY(this._boundary, this.el, offsetY, true, false)) {
      this.y += offsetY;
      this.height -= offsetY;
    }
  }

  private bottomLeftResize(offsetX: number, offsetY: number) {
    if (checkBoundX(this._boundary, this.el, offsetX, true, false)) {
      this.width -= offsetX;
      if (!this.isRtl) {
        this.x += offsetX;
      }
    }
    if (checkBoundY(this._boundary, this.el, offsetY, false)) {
      this.height += offsetY;
    }
  }

  private bottomRightResize(offsetX: number, offsetY: number) {
    if (checkBoundX(this._boundary, this.el, offsetX, false)) {
      this.width += offsetX;
      if (this.isRtl) {
        this.x += offsetX;
      }
    }
    if (checkBoundY(this._boundary, this.el, offsetY, false)) {
      this.height += offsetY;
    }
  }
  private topResize(offsetX: number, offsetY: number) {
    if (checkBoundY(this._boundary, this.el, offsetY, true, false)) {
      this.y += offsetY;
      this.height -= offsetY;
    }
  }
  private rightResize(offsetX: number, offsetY: number) {
    if (checkBoundX(this._boundary, this.el, offsetX, false)) {
      this.width += offsetX;
      if (this.isRtl) {
        this.x += offsetX;
      }
    }
  }
  private bottomResize(offsetX: number, offsetY: number) {
    if (checkBoundY(this._boundary, this.el, offsetY, false)) {
      this.height += offsetY;
    }
  }
  private leftResize(offsetX: number, offsetY: number) {
    if (checkBoundX(this._boundary, this.el, offsetX, true, false)) {
      this.width -= offsetX;
      if (!this.isRtl) {
        this.x += offsetX;
      }
    }
  }
}
