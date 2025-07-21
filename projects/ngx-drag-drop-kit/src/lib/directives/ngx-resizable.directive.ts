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
export class NgxResizableDirective implements OnInit {
  private _boundary?: HTMLElement;
  @Input() set boundary(val: HTMLElement) {
    this._boundary = val;
  }
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

  constructor(
    elRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.el = elRef.nativeElement;
  }

  ngOnInit(): void {
    this.isRtl = getComputedStyle(this.el).direction === 'rtl';
    console.log(this.isRtl);
    this.addCornerDiv();
    this.initXY();
  }

  private getRealPosition() {
    const rect = this.el.getBoundingClientRect();
    return {
      realLeft: rect.left,
      realTop: rect.top,
      offsetLeft: this.el.offsetLeft,
      offsetTop: this.el.offsetTop,
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

  @HostListener('document:mouseup', ['$event'])
  @HostListener('document:touchend', ['$event'])
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
    const selfStyle = getComputedStyle(this.el);
    if (selfStyle.position !== 'absolute' && selfStyle.position !== 'relative' && selfStyle.position !== 'fixed') {
      this.renderer.setStyle(this.el, 'position', 'relative');
    }

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

    this.el.style.setProperty('right', 'unset');

    this.px = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    this.py = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    this.resizer = resizer;
    event.preventDefault();
    event.stopPropagation();
    this.initXY();
    this.checkFlexibale();
    this.resizeStart.emit();
  }

  initXY() {
    const elRec = this.el.getBoundingClientRect();
    const position = getRelativePosition(this.el, this.el.offsetParent as HTMLElement);
    //const computed = getComputedStyle(this.el);
    //this.x = parseFloat(computed.left || '0');
    //this.y = parseFloat(computed.top || '0');
    this.width = elRec.width;
    this.height = elRec.height;
    this.left = position.x;
    this.top = position.y;
    this.setElPosition();
  }

  private setElPosition() {
    this.renderer.setStyle(this.el, 'left', `${this.left}px`);
    this.renderer.setStyle(this.el, 'top', `${this.top}px`);
    this.renderer.setStyle(this.el, 'width', `${this.width}px`);
    this.renderer.setStyle(this.el, 'height', `${this.height}px`);
  }

  private checkFlexibale() {
    // اگر داخل parent فلکسی هست و باعث پرش می‌شه، تغییرات لازم را بده
    const parent = this.el.parentElement;
    if (!parent) return;
    const style = getComputedStyle(parent);

    if (['flex', 'inline-flex'].includes(style.display)) {
      this.renderer.setStyle(this.el, 'position', 'absolute');
    }
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

  /* ----------------- Resize Corner Logic ----------------- */
  private topLeftResize(offsetX: number, offsetY: number) {
    if (checkBoundX(this._boundary, this.el, offsetX, true, false)) {
      this.width -= offsetX;
      this.left += offsetX;
    }
    if (checkBoundY(this._boundary, this.el, offsetY)) {
      this.top += offsetY;
      this.height -= offsetY;
    }
  }

  private topRightResize(offsetX: number, offsetY: number) {
    if (checkBoundX(this._boundary, this.el, offsetX, false, true)) {
      this.width += offsetX;
    }
    if (checkBoundY(this._boundary, this.el, offsetY, true, false)) {
      this.top += offsetY;
      this.height -= offsetY;
    }
  }

  private bottomLeftResize(offsetX: number, offsetY: number) {
    if (checkBoundX(this._boundary, this.el, offsetX, true, false)) {
      this.width -= offsetX;
      this.left += offsetX;
    }
    if (checkBoundY(this._boundary, this.el, offsetY, false)) {
      this.height += offsetY;
    }
  }

  private bottomRightResize(offsetX: number, offsetY: number) {
    if (checkBoundX(this._boundary, this.el, offsetX, false)) {
      this.width += offsetX;
    }
    if (checkBoundY(this._boundary, this.el, offsetY, false)) {
      this.height += offsetY;
    }
  }

  private topResize(offsetX: number, offsetY: number) {
    if (checkBoundY(this._boundary, this.el, offsetY, true, false)) {
      this.top += offsetY;
      this.height -= offsetY;
    }
  }

  private rightResize(offsetX: number, offsetY: number) {
    if (checkBoundX(this._boundary, this.el, offsetX, false)) {
      this.width += offsetX;
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
      if (this.isRtl) this.left += offsetX;
    }
  }
}
