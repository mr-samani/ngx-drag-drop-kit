import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
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
import { IResizableOutput } from '../../interfaces/IResizableOutput';
import { getRelativePosition } from '../../utils/get-position';

@Directive({
  selector: '[ngxResizable]',
  host: {
    '[style.transition-property]': 'resizing ? "none" : ""',
    '[style.user-select]': 'resizing ? "none" : ""',
    '[style.z-index]': 'resizing ? "999999" : ""',
    '[class.resizing]': 'resizing',
    class: 'ngx-resizable',
  },
  standalone: true,
  exportAs: 'NgxResizable',
})
export class NgxResizableDirective implements AfterViewInit {
  private boundaryDomRect?: DOMRect;
  @Input() boundary?: HTMLElement;
  @Input() minWidth = 20;
  @Input() minHeight = 20;
  @Input() corners: Corner[] = ['top', 'right', 'left', 'bottom', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
  @Output() resizeStart = new EventEmitter();
  @Output() resize = new EventEmitter<IResizableOutput>();
  @Output() resizeEnd = new EventEmitter<IResizableOutput>();

  protected resizer!: Function;
  protected px: number = 0;
  protected py: number = 0;

  protected left: number = 0;
  protected top: number = 0;

  protected width!: number;
  protected height!: number;

  resizing = false;
  el: HTMLElement;
  isRtl: boolean = false;

  private isAbsoluteOrFixed: boolean = false;

  constructor(
    elRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.el = elRef.nativeElement;
  }

  ngAfterViewInit(): void {
    this.checkFlexibale();
    const selfStyle = getComputedStyle(this.el);
    this.isAbsoluteOrFixed = selfStyle.position === 'absolute' || selfStyle.position === 'fixed';
    if (!this.isAbsoluteOrFixed) {
      this.renderer.setStyle(this.el, 'position', 'relative');
    }
    this.isRtl = selfStyle.direction === 'rtl' || this.el.closest('[dir=rtl]') !== null;

    this.addCornerDiv();
    this.init();
  }

  private getRealPosition() {
    const rect = this.el.getBoundingClientRect();
    const parentRect = this.el.offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 };
    return {
      realLeft: rect.left,
      realTop: rect.top,
      offsetLeft: rect.left - parentRect.left,
      offsetTop: rect.top - parentRect.top,
    };
  }

  @HostListener('document:mousemove', ['$event'])
  private onCornerMouseMove(event: MouseEvent) {
    if (!this.resizing) return;
    let offsetX = event.clientX - this.px;
    let offsetY = event.clientY - this.py;
    this.onCornerMove(offsetX, offsetY, event.clientX, event.clientY);
  }

  @HostListener('document:touchmove', ['$event'])
  private onCornerTouchMove(event: TouchEvent) {
    if (!this.resizing) return;
    let offsetX = event.touches[0].clientX - this.px;
    let offsetY = event.touches[0].clientY - this.py;
    let clientX = event.touches[0].clientX;
    let clientY = event.touches[0].clientY;
    this.onCornerMove(offsetX, offsetY, clientX, clientY);
  }

  @HostListener('window:mouseup', ['$event'])
  @HostListener('window:touchend', ['$event'])
  private onCornerRelease() {
    if (this.resizing) {
      const realPos = this.getRealPosition();
      this.resizeEnd.emit({
        width: this.width,
        height: this.height,
        moveLeft: this.left,
        moveTop: this.top,
        left: realPos.realLeft,
        top: realPos.realTop,
      });
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
    let computed = getComputedStyle(this.el);

    this.renderer.setStyle(this.el, 'right', 'unset');
    if (!computed.left || computed.left === 'auto') {
      const rect = this.el.getBoundingClientRect();
      const parentRect = this.el.offsetParent?.getBoundingClientRect() ?? { left: 0 };
      this.left = rect.left - parentRect.left;
    }

    this.px = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    this.py = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    this.resizer = resizer;
    event.preventDefault();
    event.stopPropagation();
    this.init();
    this.resizeStart.emit();
  }

  init() {
    const elRec = this.el.getBoundingClientRect();
    const position = getRelativePosition(this.el, this.el.offsetParent as HTMLElement);
    const computed = getComputedStyle(this.el);
    this.left = parseFloat(computed.left || '0');
    this.top = parseFloat(computed.top || '0');
    this.width = elRec.width;
    this.height = elRec.height;
    // this.left = position.x;
    // this.top = position.y;
    this.setElPosition();
    if (this.boundary) {
      this.boundaryDomRect = this.boundary.getBoundingClientRect();
    }
  }

  private setElPosition() {
    if (!this.corners) return;

    // بررسی کرنرها برای تنظیم استایل‌های مناسب
    const canSetLeft = this.corners.some((corner) => ['left', 'topLeft', 'bottomLeft'].includes(corner));
    const canSetRight = this.corners.some((corner) => ['right', 'topRight', 'bottomRight'].includes(corner));
    const canSetTop = this.corners.some((corner) => ['top', 'topLeft', 'topRight'].includes(corner));
    const canSetBottom = this.corners.some((corner) => ['bottom', 'bottomLeft', 'bottomRight'].includes(corner));

    // تنظیم استایل‌ها بر اساس کرنرهای مجاز
    if (canSetLeft) {
      this.renderer.setStyle(this.el, 'left', `${this.left}px`);
    }
    if (canSetTop) {
      this.renderer.setStyle(this.el, 'top', `${this.top}px`);
    }
    // اگر کرنر شامل right یا left باشد، عرض تغییر می‌کند
    if (canSetLeft || canSetRight) {
      this.renderer.setStyle(this.el, 'width', `${this.width}px`);
    }
    // اگر کرنر شامل top یا bottom باشد، ارتفاع تغییر می‌کند
    if (canSetTop || canSetBottom) {
      this.renderer.setStyle(this.el, 'height', `${this.height}px`);
    }
  }

  // TODO : check parent flexible for resize
  private checkFlexibale() {
    // اگر داخل parent فلکسی هست و باعث پرش می‌شه، تغییرات لازم را بده
    // const parent = this.el.parentElement;
    // if (!parent) return;
    // const style = getComputedStyle(parent);
    // if (['flex', 'inline-flex'].includes(style.display)) {
    //   this.renderer.setStyle(this.el, 'position', 'absolute');
    // }
  }

  private onCornerMove(offsetX: number, offsetY: number, clientX: number, clientY: number) {
    const lastLeft = this.left;
    const lastTop = this.top;
    const lastWidth = this.width;
    const lastHeight = this.height;

    this.resizer(offsetX, offsetY);

    if (this.width < this.minWidth) {
      this.left = lastLeft;
      this.width = lastWidth;
    }
    if (this.height < this.minHeight) {
      this.top = lastTop;
      this.height = lastHeight;
    }

    this.px = clientX;
    this.py = clientY;
    if (this.left !== lastLeft || this.top !== lastTop || this.width !== lastWidth || this.height !== lastHeight) {
      this.setElPosition();
      const realPos = this.getRealPosition();
      this.resize.emit({
        width: this.width,
        height: this.height,
        moveLeft: this.left,
        moveTop: this.top,
        left: realPos.realLeft,
        top: realPos.realTop,
      });
    }
  }

  /* ----------------- Resize Corner Logic ----------------- */
  private topLeftResize(offsetX: number, offsetY: number) {
    if (checkBoundX(this.boundaryDomRect, this.el, offsetX, true, false)) {
      this.width -= offsetX;
      if (this.isAbsoluteOrFixed || !this.isRtl) this.left += offsetX;
    }
    if (checkBoundY(this.boundaryDomRect, this.el, offsetY)) {
      this.top += offsetY;
      this.height -= offsetY;
    }
  }

  private topRightResize(offsetX: number, offsetY: number) {
    if (checkBoundX(this.boundaryDomRect, this.el, offsetX, false, true)) {
      this.width += offsetX;
      if (this.isRtl && !this.isAbsoluteOrFixed) this.left += offsetX;
    }
    if (checkBoundY(this.boundaryDomRect, this.el, offsetY, true, false)) {
      this.top += offsetY;
      this.height -= offsetY;
    }
  }

  private bottomLeftResize(offsetX: number, offsetY: number) {
    if (checkBoundX(this.boundaryDomRect, this.el, offsetX, true, false)) {
      this.width -= offsetX;
      if (this.isAbsoluteOrFixed || !this.isRtl) this.left += offsetX;
    }
    if (checkBoundY(this.boundaryDomRect, this.el, offsetY, false)) {
      this.height += offsetY;
    }
  }

  private bottomRightResize(offsetX: number, offsetY: number) {
    if (checkBoundX(this.boundaryDomRect, this.el, offsetX, false)) {
      this.width += offsetX;
      if (this.isRtl && !this.isAbsoluteOrFixed) this.left += offsetX;
    }
    if (checkBoundY(this.boundaryDomRect, this.el, offsetY, false)) {
      this.height += offsetY;
    }
  }

  private topResize(offsetX: number, offsetY: number) {
    if (checkBoundY(this.boundaryDomRect, this.el, offsetY, true, false)) {
      this.top += offsetY;
      this.height -= offsetY;
    }
  }

  private rightResize(offsetX: number, offsetY: number) {
    if (checkBoundX(this.boundaryDomRect, this.el, offsetX, false)) {
      this.width += offsetX;
      if (this.isRtl && !this.isAbsoluteOrFixed) this.left += offsetX;
    }
  }

  private bottomResize(offsetX: number, offsetY: number) {
    if (checkBoundY(this.boundaryDomRect, this.el, offsetY, false)) {
      this.height += offsetY;
    }
  }

  private leftResize(offsetX: number, offsetY: number) {
    if (checkBoundX(this.boundaryDomRect, this.el, offsetX, true, false)) {
      this.width -= offsetX;
      if (this.isAbsoluteOrFixed || !this.isRtl) this.left += offsetX;
    }
  }
}
