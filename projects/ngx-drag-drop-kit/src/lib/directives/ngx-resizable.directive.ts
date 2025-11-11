import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  Output,
  Renderer2,
  DOCUMENT,
} from '@angular/core';
import { Corner } from '../../utils/corner-type';
import { checkBoundX, checkBoundY } from '../../utils/check-boundary';
import { IResizableOutput } from '../../interfaces/IResizableOutput';
import { fromEvent, Subscription } from 'rxjs';
import { throttleTime, asyncScheduler } from 'rxjs';

@Directive({
  selector: '[ngxResizable]',
  host: {
    '[style.transition-property]': 'resizing ? "none" : ""',
    '[style.user-select]': 'resizing ? "none" : ""',
    '[style.z-index]': 'resizing ? "999999" : ""',
    '[style.will-change]': 'resizing ? "width, height, top, left" : ""',
    '[class.resizing]': 'resizing',
    '[attr.role]': '"img"',
    '[attr.aria-label]': '"Resizable element"',
    '(pointerdown)': 'onPointerDown($event)',
  },
  standalone: true,
  exportAs: 'NgxResizable',
})
export class NgxResizableDirective implements AfterViewInit, OnDestroy {
  private boundaryDomRect?: DOMRect;
  @Input() boundary?: HTMLElement;
  @Input() minWidth = 20;
  @Input() minHeight = 20;
  @Input() maxWidth?: number;
  @Input() maxHeight?: number;
  @Input() aspectRatio?: number; // e.g., 16/9
  @Input() cornerSize = 10; // Pixel size for corner detection
  @Input() enableKeyboard = true; // Keyboard resize support
  @Input() corners: Corner[] = [
    'top',
    'right',
    'left',
    'bottom',
    'topLeft',
    'topRight',
    'bottomLeft',
    'bottomRight',
  ];
  @Output() resizeStart = new EventEmitter();
  @Output() resize = new EventEmitter<IResizableOutput>();
  @Output() resizeEnd = new EventEmitter<IResizableOutput>();

  protected resizer!: Function;
  protected px: number = 0;
  protected py: number = 0;

  left: number = 0;
  top: number = 0;

  width!: number;
  height!: number;

  resizing = false;
  el: HTMLElement;
  isRtl: boolean = false;
  private currentCorner: Corner | null = null;
  private isShiftPressed = false;

  private isAbsoluteOrFixed: boolean = false;
  private subscriptions: Subscription[] = [];
  private resizeObserver?: ResizeObserver;
  private boundaryObserver?: ResizeObserver;

  private readonly elRef = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly doc = inject(DOCUMENT);

  // Store original aspect ratio
  private originalAspectRatio?: number;

  constructor() {
    this.el = this.elRef.nativeElement;
    this.initHandler();
  }

  ngAfterViewInit(): void {
    this.checkFlexible();
    const selfStyle = getComputedStyle(this.el);
    this.isAbsoluteOrFixed =
      selfStyle.position === 'absolute' || selfStyle.position === 'fixed';
    if (!this.isAbsoluteOrFixed) {
      this.renderer.setStyle(this.el, 'position', 'relative');
    }
    this.isRtl =
      selfStyle.direction === 'rtl' || this.el.closest('[dir=rtl]') !== null;
    this.el.classList.add('ngx-resizable');

    // Add corner indicators with CSS only
    this.addCornerStyles();
    this.init();

    // Setup ResizeObserver for element
    this.setupResizeObserver();

    // Setup keyboard support
    if (this.enableKeyboard) {
      this.setupKeyboardSupport();
    }

    // Setup boundary observer
    if (this.boundary) {
      this.setupBoundaryObserver();
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.resizeObserver?.disconnect();
    this.boundaryObserver?.disconnect();
  }

  private getRealPosition() {
    const rect = this.el.getBoundingClientRect();
    const parentRect =
      this.el.offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 };
    return {
      realLeft: rect.left,
      realTop: rect.top,
      offsetLeft: rect.left - parentRect.left,
      offsetTop: rect.top - parentRect.top,
    };
  }

  initHandler() {
    // Throttle move events to 60fps (16ms)
    this.subscriptions.push(
      fromEvent<MouseEvent>(this.doc, 'mousemove')
        .pipe(
          throttleTime(16, asyncScheduler, { leading: true, trailing: true })
        )
        .subscribe((ev) => this.onPointerMove(ev)),

      fromEvent<TouchEvent>(this.doc, 'touchmove', { passive: false })
        .pipe(
          throttleTime(16, asyncScheduler, { leading: true, trailing: true })
        )
        .subscribe((ev) => this.onPointerMove(ev)),

      fromEvent<MouseEvent | TouchEvent>(window, 'mouseup').subscribe((ev) =>
        this.onPointerRelease(ev)
      ),
      fromEvent<MouseEvent | TouchEvent>(window, 'touchend').subscribe((ev) =>
        this.onPointerRelease(ev)
      ),
      fromEvent<MouseEvent | TouchEvent>(window, 'touchcancel').subscribe(
        (ev) => this.onPointerRelease(ev)
      ),

      // Track shift key for aspect ratio lock
      fromEvent<KeyboardEvent>(window, 'keydown').subscribe((ev) => {
        if (ev.key === 'Shift') this.isShiftPressed = true;
      }),
      fromEvent<KeyboardEvent>(window, 'keyup').subscribe((ev) => {
        if (ev.key === 'Shift') this.isShiftPressed = false;
      })
    );
  }

  private onPointerMove(event: MouseEvent | TouchEvent) {
    if (!this.resizing) return;

    // Prevent default to avoid scrolling on touch devices
    if (event instanceof TouchEvent) {
      event.preventDefault();
    }

    const clientX =
      event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY =
      event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    let offsetX = clientX - this.px;
    let offsetY = clientY - this.py;

    this.onCornerMove(offsetX, offsetY, clientX, clientY);
  }

  private onPointerRelease(event: MouseEvent | TouchEvent) {
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
    this.currentCorner = null;
  }

  private addCornerStyles() {
    // Add CSS-based corner indicators
    const style = this.doc.createElement('style');
    style.textContent = `
      .ngx-resizable {
        box-sizing: border-box;
      }
      .ngx-resizable::before {
        content: '';
        position: absolute;
        pointer-events: none;
      }
      ${this.corners
        .map(
          (corner) => `
        .ngx-resizable[data-corner="${corner}"] {
          cursor: ${this.getCornerCursor(corner)};
        }
      `
        )
        .join('')}
    `;
    this.doc.head.appendChild(style);
  }

  private getCornerCursor(corner: Corner): string {
    const cursors: Record<Corner, string> = {
      top: 'ns-resize',
      bottom: 'ns-resize',
      left: 'ew-resize',
      right: 'ew-resize',
      topLeft: 'nwse-resize',
      topRight: 'nesw-resize',
      bottomLeft: 'nesw-resize',
      bottomRight: 'nwse-resize',
    };
    return cursors[corner];
  }

  onPointerDown(event: PointerEvent) {
    // Only handle left click or touch
    if (event.button !== 0) return;

    const corner = this.detectCorner(event);
    if (!corner) return;

    this.resizing = true;
    this.currentCorner = corner;

    // Store original aspect ratio if shift is pressed or aspectRatio is set
    if (this.aspectRatio || this.isShiftPressed) {
      this.originalAspectRatio = this.aspectRatio || this.width / this.height;
    }

    let computed = getComputedStyle(this.el);

    this.renderer.setStyle(this.el, 'right', 'unset');
    if (!computed.left || computed.left === 'auto') {
      const rect = this.el.getBoundingClientRect();
      const parentRect =
        this.el.offsetParent?.getBoundingClientRect() ?? { left: 0 };
      this.left = rect.left - parentRect.left;
    }

    this.px = event.clientX;
    this.py = event.clientY;

    // Get resizer function
    const resizerName = corner + 'Resize';
    this.resizer = (this as any)[resizerName].bind(this);

    event.preventDefault();
    event.stopPropagation();
    this.init();
    this.resizeStart.emit();

    // Set cursor
    this.renderer.setAttribute(this.el, 'data-corner', corner);
  }

  private detectCorner(event: PointerEvent): Corner | null {
    const rect = this.el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const threshold = this.cornerSize;

    const isLeft = x < threshold;
    const isRight = x > rect.width - threshold;
    const isTop = y < threshold;
    const isBottom = y > rect.height - threshold;

    // Check corners first (higher priority)
    if (isTop && isLeft && this.corners.includes('topLeft')) return 'topLeft';
    if (isTop && isRight && this.corners.includes('topRight'))
      return 'topRight';
    if (isBottom && isLeft && this.corners.includes('bottomLeft'))
      return 'bottomLeft';
    if (isBottom && isRight && this.corners.includes('bottomRight'))
      return 'bottomRight';

    // Check edges
    if (isTop && this.corners.includes('top')) return 'top';
    if (isBottom && this.corners.includes('bottom')) return 'bottom';
    if (isLeft && this.corners.includes('left')) return 'left';
    if (isRight && this.corners.includes('right')) return 'right';

    return null;
  }

  init() {
    const elRec = this.el.getBoundingClientRect();
    const computed = getComputedStyle(this.el);
    this.left = parseFloat(computed.left || '0');
    this.top = parseFloat(computed.top || '0');
    this.width = elRec.width;
    this.height = elRec.height;
    this.setElPosition();
    this.updateBoundaryRect();
  }

  private updateBoundaryRect() {
    if (this.boundary) {
      this.boundaryDomRect = this.boundary.getBoundingClientRect();
    }
  }

  private setElPosition() {
    if (!this.corners) return;

    const canSetLeft = this.corners.some((corner) =>
      ['left', 'topLeft', 'bottomLeft'].includes(corner)
    );
    const canSetRight = this.corners.some((corner) =>
      ['right', 'topRight', 'bottomRight'].includes(corner)
    );
    const canSetTop = this.corners.some((corner) =>
      ['top', 'topLeft', 'topRight'].includes(corner)
    );
    const canSetBottom = this.corners.some((corner) =>
      ['bottom', 'bottomLeft', 'bottomRight'].includes(corner)
    );

    if (canSetLeft) {
      this.renderer.setStyle(this.el, 'left', `${this.left}px`);
    }
    if (canSetTop) {
      this.renderer.setStyle(this.el, 'top', `${this.top}px`);
    }
    if (canSetLeft || canSetRight) {
      this.renderer.setStyle(this.el, 'width', `${this.width}px`);
    }
    if (canSetTop || canSetBottom) {
      this.renderer.setStyle(this.el, 'height', `${this.height}px`);
    }
  }

  private checkFlexible() {
    const parent = this.el.parentElement;
    if (!parent) return;
    const style = getComputedStyle(parent);
    if (['flex', 'inline-flex'].includes(style.display)) {
      // Set flex properties to prevent unwanted grow/shrink
      this.renderer.setStyle(this.el, 'flex-shrink', '0');
      this.renderer.setStyle(this.el, 'flex-grow', '0');
    }
  }

  private setupResizeObserver() {
    if (typeof ResizeObserver === 'undefined') return;

    this.resizeObserver = new ResizeObserver((entries) => {
      if (this.resizing) return; // Don't update during manual resize
      for (const entry of entries) {
        const rect = entry.contentRect;
        this.width = rect.width;
        this.height = rect.height;
      }
    });

    this.resizeObserver.observe(this.el);
  }

  private setupBoundaryObserver() {
    if (typeof ResizeObserver === 'undefined' || !this.boundary) return;

    this.boundaryObserver = new ResizeObserver(() => {
      this.updateBoundaryRect();
    });

    this.boundaryObserver.observe(this.boundary);
  }

  private setupKeyboardSupport() {
    // Allow arrow keys to resize when element is focused
    this.el.setAttribute('tabindex', '0');

    this.subscriptions.push(
      fromEvent<KeyboardEvent>(this.el, 'keydown').subscribe((ev) => {
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(ev.key)) {
          return;
        }

        ev.preventDefault();
        const step = ev.shiftKey ? 10 : 1;

        switch (ev.key) {
          case 'ArrowRight':
            this.width = Math.min(
              this.width + step,
              this.maxWidth || Infinity
            );
            break;
          case 'ArrowLeft':
            this.width = Math.max(this.width - step, this.minWidth);
            break;
          case 'ArrowDown':
            this.height = Math.min(
              this.height + step,
              this.maxHeight || Infinity
            );
            break;
          case 'ArrowUp':
            this.height = Math.max(this.height - step, this.minHeight);
            break;
        }

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
      })
    );
  }

  private onCornerMove(
    offsetX: number,
    offsetY: number,
    clientX: number,
    clientY: number
  ) {
    // Update boundary rect on each move (handles scroll/zoom)
    this.updateBoundaryRect();

    const lastLeft = this.left;
    const lastTop = this.top;
    const lastWidth = this.width;
    const lastHeight = this.height;

    // Apply aspect ratio if shift is pressed or aspectRatio is set
    if (this.originalAspectRatio && (this.isShiftPressed || this.aspectRatio)) {
      const result = this.calculateAspectRatioResize(
        offsetX,
        offsetY,
        this.originalAspectRatio
      );
      offsetX = result.offsetX;
      offsetY = result.offsetY;
    }

    this.resizer(offsetX, offsetY);

    // Apply min/max constraints
    if (this.width < this.minWidth) {
      this.left = lastLeft;
      this.width = lastWidth;
    }
    if (this.height < this.minHeight) {
      this.top = lastTop;
      this.height = lastHeight;
    }
    if (this.maxWidth && this.width > this.maxWidth) {
      this.left = lastLeft;
      this.width = lastWidth;
    }
    if (this.maxHeight && this.height > this.maxHeight) {
      this.top = lastTop;
      this.height = lastHeight;
    }

    this.px = clientX;
    this.py = clientY;

    if (
      this.left !== lastLeft ||
      this.top !== lastTop ||
      this.width !== lastWidth ||
      this.height !== lastHeight
    ) {
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

  private calculateAspectRatioResize(
    offsetX: number,
    offsetY: number,
    ratio: number
  ): { offsetX: number; offsetY: number } {
    // Determine which dimension to prioritize based on corner
    if (!this.currentCorner) return { offsetX, offsetY };

    const isHorizontalCorner = ['left', 'right'].includes(this.currentCorner);
    const isVerticalCorner = ['top', 'bottom'].includes(this.currentCorner);

    if (isHorizontalCorner) {
      offsetY = offsetX / ratio;
    } else if (isVerticalCorner) {
      offsetX = offsetY * ratio;
    } else {
      // Diagonal corners - use the larger offset
      if (Math.abs(offsetX) > Math.abs(offsetY)) {
        offsetY = offsetX / ratio;
      } else {
        offsetX = offsetY * ratio;
      }
    }

    return { offsetX, offsetY };
  }

  /* ----------------- Resize Corner Logic ----------------- */
  private topLeftResize(offsetX: number, offsetY: number) {
    // Handle X axis with proper RTL support
    if (checkBoundX(this.boundaryDomRect, this.el, offsetX, true, false)) {
      const widthChange = this.isRtl ? offsetX : -offsetX;
      this.width += widthChange;
      if (this.isAbsoluteOrFixed || !this.isRtl) {
        this.left -= widthChange;
      }
    }
    // Handle Y axis
    if (checkBoundY(this.boundaryDomRect, this.el, offsetY, true, false)) {
      this.top += offsetY;
      this.height -= offsetY;
    }
  }

  private topRightResize(offsetX: number, offsetY: number) {
    // Handle X axis with proper RTL support
    if (checkBoundX(this.boundaryDomRect, this.el, offsetX, false, true)) {
      const widthChange = this.isRtl ? -offsetX : offsetX;
      this.width += widthChange;
      if (this.isRtl && !this.isAbsoluteOrFixed) {
        this.left -= widthChange;
      }
    }
    // Handle Y axis
    if (checkBoundY(this.boundaryDomRect, this.el, offsetY, true, false)) {
      this.top += offsetY;
      this.height -= offsetY;
    }
  }

  private bottomLeftResize(offsetX: number, offsetY: number) {
    // Handle X axis with proper RTL support
    if (checkBoundX(this.boundaryDomRect, this.el, offsetX, true, false)) {
      const widthChange = this.isRtl ? offsetX : -offsetX;
      this.width += widthChange;
      if (this.isAbsoluteOrFixed || !this.isRtl) {
        this.left -= widthChange;
      }
    }
    // Handle Y axis
    if (checkBoundY(this.boundaryDomRect, this.el, offsetY, false, true)) {
      this.height += offsetY;
    }
  }

  private bottomRightResize(offsetX: number, offsetY: number) {
    // Handle X axis with proper RTL support
    if (checkBoundX(this.boundaryDomRect, this.el, offsetX, false, true)) {
      const widthChange = this.isRtl ? -offsetX : offsetX;
      this.width += widthChange;
      if (this.isRtl && !this.isAbsoluteOrFixed) {
        this.left -= widthChange;
      }
    }
    // Handle Y axis
    if (checkBoundY(this.boundaryDomRect, this.el, offsetY, false, true)) {
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
    if (checkBoundX(this.boundaryDomRect, this.el, offsetX, false, true)) {
      const widthChange = this.isRtl ? -offsetX : offsetX;
      this.width += widthChange;
      if (this.isRtl && !this.isAbsoluteOrFixed) {
        this.left -= widthChange;
      }
    }
  }

  private bottomResize(offsetX: number, offsetY: number) {
    if (checkBoundY(this.boundaryDomRect, this.el, offsetY, false, true)) {
      this.height += offsetY;
    }
  }

  private leftResize(offsetX: number, offsetY: number) {
    if (checkBoundX(this.boundaryDomRect, this.el, offsetX, true, false)) {
      const widthChange = this.isRtl ? offsetX : -offsetX;
      this.width += widthChange;
      if (this.isAbsoluteOrFixed || !this.isRtl) {
        this.left -= widthChange;
      }
    }
  }
}