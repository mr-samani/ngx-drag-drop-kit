import {
  Directive,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  Output,
  Renderer2,
  DOCUMENT,
  OnInit,
} from '@angular/core';
import { clampWithinBoundary } from '../../utils/check-boundary';
import { IResizableOutput } from '../../interfaces/IResizableOutput';
import { fromEvent, Subscription } from 'rxjs';
import { filter } from 'rxjs';
import { InteractionLockService } from '../services/interaction-lock.service';
export declare type Corner =
  | 'top'
  | 'right'
  | 'left'
  | 'bottom'
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight';

@Directive({
  selector: '[ngxResizable]',
  host: {
    '[style.transition-property]': 'resizing ? "none" : ""',
    '[style.user-select]': 'resizing ? "none" : ""',
    '[style.z-index]': 'resizing ? "999999" : ""',
    '[style.touch-action]': '"none"', // CRITICAL: Always disable touch actions
    '[style.will-change]': 'resizing ? "width, height, top, left" : ""',
    '[class.resizing]': 'resizing',
    '[attr.role]': '"img"',
    '[attr.aria-label]': '"Resizable element"',
    '[attr.resizing]': 'resizing',
    '[style.--ngx-resize-handles]': 'handlerStyle',
  },
  standalone: true,
  exportAs: 'NgxResizable',
})
export class NgxResizableDirective implements OnInit, OnDestroy {
  private boundaryDomRect?: DOMRect;
  @Input() boundary?: HTMLElement;
  @Input() minWidth = 20;
  @Input() minHeight = 20;
  @Input() maxWidth?: number;
  @Input() maxHeight?: number;
  /**
   * e.g., 16/9
   */
  @Input() aspectRatio?: number;
  /**
   * Pixel size for corner detection
   */
  @Input() cornerSize = 10;
  @Input() enableKeyboard = true;

  handlerStyle = '';
  @Input() corners: Corner[] = ['top', 'right', 'left', 'bottom', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'];

  protected allCorners: Corner[] = [
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
  domRect!: DOMRect;
  width!: number;
  height!: number;

  resizing = false;
  el: HTMLElement;
  private currentCorner: Corner | null = null;
  private isShiftPressed = false;

  private isAbsoluteOrFixed: boolean = false;
  private subscriptions: Subscription[] = [];
  private originalAspectRatio?: number;

  private readonly elRef = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly doc = inject(DOCUMENT);
  private readonly interaction = inject(InteractionLockService);

  constructor() {
    this.el = this.elRef.nativeElement;
  }

  ngOnInit(): void {
    this.initHandler(); // Initialize all handlers at once
    this.checkFlexible();
    const selfStyle = getComputedStyle(this.el);
    this.isAbsoluteOrFixed = selfStyle.position === 'absolute' || selfStyle.position === 'fixed';
    if (!this.isAbsoluteOrFixed) {
      this.renderer.setStyle(this.el, 'position', 'relative');
    }
    this.el.classList.add('ngx-resizable');

    // Add corner indicators with CSS only
    this.addCornerStyles();
    this.init();

    // Setup keyboard support
    if (this.enableKeyboard) {
      this.setupKeyboardSupport();
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get isRtl() {
    return getComputedStyle(this.el).direction === 'rtl' || this.el.closest('[dir=rtl]') !== null;
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

  initHandler() {
    // ✅ Subscribe to ALL events from the start (not lazily)
    const moveStream = fromEvent<PointerEvent>(this.doc, 'pointermove', { passive: false });
    const endStream = fromEvent<PointerEvent>(this.doc, 'pointerup', { passive: false });
    const cancelStream = fromEvent<PointerEvent>(this.doc, 'pointercancel', { passive: false });

    this.subscriptions.push(
      // Pointerdown on element
      fromEvent<PointerEvent>(this.el, 'pointerdown', { passive: false }).subscribe(ev => this.onPointerDown(ev)),

      // Pointermove - only process when resizing
      moveStream.pipe(filter(() => this.resizing)).subscribe(ev => this.onPointerMove(ev)),

      // Pointerup/cancel - only process when resizing
      endStream.pipe(filter(() => this.resizing)).subscribe(ev => this.onPointerRelease(ev)),
      cancelStream.pipe(filter(() => this.resizing)).subscribe(ev => this.onPointerRelease(ev)),

      // Shift key tracking
      fromEvent<KeyboardEvent>(this.doc, 'keydown').subscribe(ev => {
        if (ev.key === 'Shift') this.isShiftPressed = true;
      }),
      fromEvent<KeyboardEvent>(this.doc, 'keyup').subscribe(ev => {
        if (ev.key === 'Shift') this.isShiftPressed = false;
      })
    );
  }

  onPointerDown(event: PointerEvent) {
    // Only handle left click or touch
    if (event.button !== 0) return;

    const corner = this.detectCorner(event);
    if (!corner) return;

    // Start resizing
    this.resizing = true;
    this.interaction.startResizing();
    this.currentCorner = corner;

    // Store original aspect ratio if shift is pressed or aspectRatio is set
    if (this.aspectRatio || this.isShiftPressed) {
      this.originalAspectRatio = this.aspectRatio || this.width / this.height;
    }

    const computed = getComputedStyle(this.el);
    this.renderer.setStyle(this.el, 'right', 'unset');

    if (!computed.left || computed.left === 'auto') {
      const rect = this.el.getBoundingClientRect();
      const parentRect = this.el.offsetParent?.getBoundingClientRect() ?? { left: 0 };
      this.left = rect.left - parentRect.left;
    }
    this.domRect = this.el.getBoundingClientRect();

    this.px = event.clientX;
    this.py = event.clientY;

    // set pointer capture so this element receives pointermove/up exclusively
    try {
      this.el.setPointerCapture(event.pointerId);
    } catch (err) {
      // ignore if not supported
    }

    // stop other handlers (مثل drag) from starting
    event.preventDefault();
    event.stopPropagation();

    // Get resizer function
    const resizerName = corner + 'Resize';
    this.resizer = (this as any)[resizerName].bind(this);

    this.init();
    this.resizeStart.emit();

    // Set cursor
    this.renderer.setAttribute(this.el, 'data-corner', corner);
  }

  private onPointerMove(event: PointerEvent) {
    // console.log('pointer move');
    if (!this.resizing) return;

    event.preventDefault();
    event.stopPropagation();

    const offsetX = event.clientX - this.px;
    const offsetY = event.clientY - this.py;

    this.onCornerMove(offsetX, offsetY, event.clientX, event.clientY);
  }

  private onPointerRelease(event: PointerEvent) {
    if (!this.resizing) return;

    // Release pointer capture
    try {
      this.el.releasePointerCapture(event.pointerId);
    } catch (err) {
      // ignore if not supported
    }

    const realPos = this.getRealPosition();
    this.renderer.removeAttribute(this.el, 'data-corner');

    this.resizeEnd.emit({
      width: this.width,
      height: this.height,
      moveLeft: this.left,
      moveTop: this.top,
      left: realPos.realLeft,
      top: realPos.realTop,
    });

    this.resizing = false;
    this.interaction.stopResizing();
    this.currentCorner = null;
  }

  private addCornerStyles() {
    this.handlerStyle = this.buildResizeHandlesBackground(this.corners);

    if (this.doc.head.querySelector('#ngx-resizable-corner-styles')) return;

    // Add CSS-based corner indicators
    const style = this.doc.createElement('style');
    style.id = 'ngx-resizable-corner-styles';
    style.textContent = `
      .ngx-resizable {
        box-sizing: border-box;
      }
      ${this.allCorners
        .map(
          corner => `
        .ngx-resizable[data-corner="${corner}"] {
          cursor: ${this.getCornerCursor(corner)} !important;
        }
      `
        )
        .join('')}
    `;
    this.doc.head.appendChild(style);
  }

  buildResizeHandlesBackground(corners: Corner[], color = '#2196f3', size = 5, offset = 5): string {
    const positions: Record<Corner, string> = {
      top: `center ${offset}px`,
      right: `calc(100% - ${offset}px) center`,
      bottom: `center calc(100% - ${offset}px)`,
      left: `${offset}px center`,
      topLeft: `${offset}px ${offset}px`,
      topRight: `calc(100% - ${offset}px) ${offset}px`,
      bottomLeft: `${offset}px calc(100% - ${offset}px)`,
      bottomRight: `calc(100% - ${offset}px) calc(100% - ${offset}px)`,
    };

    const gradients = corners.map(
      corner => `radial-gradient(circle ${size}px at ${positions[corner]}, ${color} 100%, transparent 0)`
    );

    return gradients.join(', ');
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
    if (isTop && isRight && this.corners.includes('topRight')) return 'topRight';
    if (isBottom && isLeft && this.corners.includes('bottomLeft')) return 'bottomLeft';
    if (isBottom && isRight && this.corners.includes('bottomRight')) return 'bottomRight';

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
    this.updateBoundaryRect();
  }

  private updateBoundaryRect() {
    if (this.boundary) {
      this.boundaryDomRect = this.boundary.getBoundingClientRect();
    }
  }

  private setElPosition() {
    if (!this.corners) return;

    const canSetLeft = this.corners.some(corner => ['left', 'topLeft', 'bottomLeft'].includes(corner));
    const canSetRight = this.corners.some(corner => ['right', 'topRight', 'bottomRight'].includes(corner));
    const canSetTop = this.corners.some(corner => ['top', 'topLeft', 'topRight'].includes(corner));
    const canSetBottom = this.corners.some(corner => ['bottom', 'bottomLeft', 'bottomRight'].includes(corner));

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
    this.domRect = new DOMRect(this.domRect.x + this.left, this.domRect.y + this.top, this.width, this.height);
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

  private setupKeyboardSupport() {
    this.el.setAttribute('tabindex', '0');

    this.subscriptions.push(
      fromEvent<KeyboardEvent>(this.el, 'keydown').subscribe(ev => {
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(ev.key)) {
          return;
        }
        ev.preventDefault();
        const step = ev.shiftKey ? 10 : 1;

        // Handle RTL for keyboard
        const leftKey = this.isRtl && !this.isAbsoluteOrFixed ? 'ArrowRight' : 'ArrowLeft';
        const rightKey = this.isRtl && !this.isAbsoluteOrFixed ? 'ArrowLeft' : 'ArrowRight';

        if (ev.key === rightKey) {
          this.width = Math.min(this.width + step, this.maxWidth || Infinity);
        } else if (ev.key === leftKey) {
          this.width = Math.max(this.width - step, this.minWidth);
        } else if (ev.key === 'ArrowDown') {
          this.height = Math.min(this.height + step, this.maxHeight || Infinity);
        } else if (ev.key === 'ArrowUp') {
          this.height = Math.max(this.height - step, this.minHeight);
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

  private onCornerMove(offsetX: number, offsetY: number, clientX: number, clientY: number) {
    // Update boundary rect on each move (handles scroll/zoom)
    this.updateBoundaryRect();

    const lastLeft = this.left;
    const lastTop = this.top;
    const lastWidth = this.width;
    const lastHeight = this.height;

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

    // Maintain aspect ratio if needed
    if (this.originalAspectRatio && (this.isShiftPressed || this.aspectRatio)) {
      const result = this.maintainAspectRatio(this.width, this.height, this.originalAspectRatio);
      this.width = result.width;
      this.height = result.height;
    }

    // ✅ Clamp within boundary
    const clamped = clampWithinBoundary(this.boundaryDomRect, this.el, this.width, this.height, this.left, this.top);
    // ✅ CRITICAL: Only update px/py based on ACTUAL changes
    // محاسبه تغییرات واقعی
    const actualLeftDelta = clamped.left - this.left;
    const actualTopDelta = clamped.top - this.top;
    const actualWidthDelta = clamped.width - this.width;
    const actualHeightDelta = clamped.height - this.height;

    this.width = clamped.width;
    this.height = clamped.height;
    this.left = clamped.left;
    this.top = clamped.top;

    // محاسبه offset واقعی که المان استفاده کرد
    let usedOffsetX = 0;
    let usedOffsetY = 0;

    if (this.currentCorner?.toLowerCase()?.includes('left')) {
      // از سمت چپ: left تغییر می‌کنه
      usedOffsetX = actualLeftDelta;
    } else if (this.currentCorner?.toLowerCase()?.includes('right')) {
      // از سمت راست: width تغییر می‌کنه
      usedOffsetX = actualWidthDelta;
    }

    if (this.currentCorner?.toLowerCase()?.includes('top')) {
      // از سمت بالا: top تغییر می‌کنه
      usedOffsetY = actualTopDelta;
    } else if (this.currentCorner?.toLowerCase()?.includes('bottom')) {
      // از سمت پایین: height تغییر می‌کنه
      usedOffsetY = actualHeightDelta;
    }
    this.px = clientX + usedOffsetX;
    this.py = clientY + usedOffsetY;

    // Apply changes to DOM if anything changed
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

  /**
   * Adjusts width & height to maintain a given aspect ratio.
   * @param width Current or target width
   * @param height Current or target height
   * @param ratio Aspect ratio (width / height)
   */
  private maintainAspectRatio(width: number, height: number, ratio: number): { width: number; height: number } {
    if (ratio <= 0 || !this.currentCorner) return { width, height };

    const corner = this.currentCorner.toLowerCase();
    const isHorizontal = corner.includes('left') || corner.includes('right');
    const isVertical = corner.includes('top') || corner.includes('bottom');
    let lock: 'width' | 'height' | 'auto' = !isHorizontal && !isVertical ? 'auto' : isHorizontal ? 'width' : 'height';
    // Auto-detect which dimension to lock
    if (lock === 'auto') {
      const widthDiff = Math.abs(width - height * ratio);
      const heightDiff = Math.abs(height - width / ratio);
      lock = widthDiff > heightDiff ? 'width' : 'height';
    }

    if (lock === 'width') {
      // keep width fixed → adjust height
      height = width / ratio;
    } else {
      // keep height fixed → adjust width
      width = height * ratio;
    }

    return { width, height };
  }

  /* ----------------- Resize Corner Logic ----------------- */
  private topLeftResize(offsetX: number, offsetY: number) {
    // Handle X axis with proper RTL support
    this.width += -offsetX;
    if (!this.isRtl || this.isAbsoluteOrFixed) {
      this.left -= -offsetX;
    }

    // Handle Y axis
    this.top += offsetY;
    this.height -= offsetY;
  }

  private topRightResize(offsetX: number, offsetY: number) {
    // Handle X axis with proper RTL support

    this.width += offsetX;
    if (this.isRtl && !this.isAbsoluteOrFixed) {
      this.left -= -offsetX;
    }

    // Handle Y axis
    this.top += offsetY;
    this.height -= offsetY;
  }

  private bottomLeftResize(offsetX: number, offsetY: number) {
    // Handle X axis with proper RTL support
    this.width += -offsetX;
    if (!this.isRtl || this.isAbsoluteOrFixed) {
      this.left -= -offsetX;
    }

    // Handle Y axis
    this.height += offsetY;
  }

  private bottomRightResize(offsetX: number, offsetY: number) {
    // Handle X axis with proper RTL support
    this.width += offsetX;
    if (this.isRtl && !this.isAbsoluteOrFixed) {
      this.left -= -offsetX;
    }

    // Handle Y axis
    this.height += offsetY;
  }

  private topResize(offsetX: number, offsetY: number) {
    this.top += offsetY;
    this.height -= offsetY;
  }

  private rightResize(offsetX: number, offsetY: number) {
    this.width += offsetX;
    if (this.isRtl && !this.isAbsoluteOrFixed) {
      this.left -= -offsetX;
    }
  }

  private bottomResize(offsetX: number, offsetY: number) {
    this.height += offsetY;
  }

  private leftResize(offsetX: number, offsetY: number) {
    this.width += -offsetX;
    if (!this.isRtl || this.isAbsoluteOrFixed) {
      this.left -= -offsetX;
    }
  }
}
