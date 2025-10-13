import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, NgZone, Renderer2, RendererFactory2 } from '@angular/core';
import { Subject, animationFrameScheduler, interval, takeUntil, fromEvent, Subscription, throttleTime } from 'rxjs';

// ============================================================================
// AUTO SCROLL SERVICE - Refactored
// ============================================================================

export enum AutoScrollDirection {
  NONE = 0,
  UP = 1,
  DOWN = 2,
  LEFT = 3,
  RIGHT = 4,
}

interface AutoScrollConfig {
  speed: number;
  threshold: number;
}

interface ScrollState {
  node: HTMLElement | null;
  verticalDirection: AutoScrollDirection;
  horizontalDirection: AutoScrollDirection;
}

@Injectable({ providedIn: 'root' })
export class AutoScrollService {
  private readonly config: AutoScrollConfig = {
    speed: 5,
    threshold: 130,
  };

  private readonly stopSignal$ = new Subject<void>();
  private state: ScrollState = {
    node: null,
    verticalDirection: AutoScrollDirection.NONE,
    horizontalDirection: AutoScrollDirection.NONE,
  };

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private ngZone: NgZone
  ) {}

  handleAutoScroll(event: MouseEvent | TouchEvent): void {
    const { clientX, clientY } = this.getPointerPosition(event);
    const scrollNode = this.findScrollableElement(clientX, clientY);

    if (!scrollNode) {
      this.stop();
      return;
    }

    this.state.node = scrollNode;
    this.updateScrollDirections(clientX, clientY);

    if (this.shouldScroll()) {
      this.ngZone.runOutsideAngular(() => this.startScrolling());
    } else {
      this.stop();
    }
  }

  stop(): void {
    this.stopSignal$.next();
    this.resetState();
  }

  setConfig(config: Partial<AutoScrollConfig>): void {
    Object.assign(this.config, config);
  }

  private getPointerPosition(event: MouseEvent | TouchEvent): { clientX: number; clientY: number } {
    if (event instanceof MouseEvent) {
      return { clientX: event.clientX, clientY: event.clientY };
    }
    return {
      clientX: event.targetTouches[0].clientX,
      clientY: event.targetTouches[0].clientY,
    };
  }

  private findScrollableElement(clientX: number, clientY: number): HTMLElement | null {
    const elements = this.document.elementsFromPoint(clientX, clientY);
    
    for (const element of elements) {
      if (this.isScrollable(element as HTMLElement)) {
        return element as HTMLElement;
      }
    }
    
    return null;
  }

  private isScrollable(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    const overflowRegex = /auto|scroll/;
    
    return (
      overflowRegex.test(style.overflow) ||
      overflowRegex.test(style.overflowY) ||
      overflowRegex.test(style.overflowX)
    );
  }

  private updateScrollDirections(clientX: number, clientY: number): void {
    if (!this.state.node) return;

    const rect = this.state.node.getBoundingClientRect();
    const viewportX = clientX - Math.max(rect.x, 0);
    const viewportY = clientY - Math.max(rect.y, 0);

    const { scrollCapabilities, edges } = this.calculateScrollMetrics();

    this.state.horizontalDirection = AutoScrollDirection.NONE;
    this.state.verticalDirection = AutoScrollDirection.NONE;

    // Horizontal
    if (viewportX < edges.left && scrollCapabilities.canScrollLeft) {
      this.state.horizontalDirection = AutoScrollDirection.LEFT;
    } else if (viewportX > edges.right && scrollCapabilities.canScrollRight) {
      this.state.horizontalDirection = AutoScrollDirection.RIGHT;
    }

    // Vertical
    if (viewportY < edges.top && scrollCapabilities.canScrollUp) {
      this.state.verticalDirection = AutoScrollDirection.UP;
    } else if (viewportY > edges.bottom && scrollCapabilities.canScrollDown) {
      this.state.verticalDirection = AutoScrollDirection.DOWN;
    }
  }

  private calculateScrollMetrics() {
    if (!this.state.node) {
      return {
        scrollCapabilities: {
          canScrollUp: false,
          canScrollDown: false,
          canScrollLeft: false,
          canScrollRight: false,
        },
        edges: { top: 0, left: 0, bottom: 0, right: 0 },
      };
    }

    const node = this.state.node;
    const innerWidth = Math.max(node.scrollWidth, node.offsetWidth, node.clientWidth);
    const innerHeight = Math.max(node.scrollHeight, node.offsetHeight, node.clientHeight);
    const maxScrollX = innerWidth - node.clientWidth;
    const maxScrollY = innerHeight - node.clientHeight;

    return {
      scrollCapabilities: {
        canScrollUp: node.scrollTop > 0,
        canScrollDown: node.scrollTop < maxScrollY,
        canScrollLeft: node.scrollLeft > 0,
        canScrollRight: node.scrollLeft < maxScrollX,
      },
      edges: {
        top: this.config.threshold,
        left: this.config.threshold,
        bottom: node.clientHeight - this.config.threshold,
        right: node.clientWidth - this.config.threshold,
      },
    };
  }

  private shouldScroll(): boolean {
    return (
      this.state.verticalDirection !== AutoScrollDirection.NONE ||
      this.state.horizontalDirection !== AutoScrollDirection.NONE
    );
  }

  private startScrolling(): void {
    this.stop();

    interval(0, animationFrameScheduler)
      .pipe(takeUntil(this.stopSignal$))
      .subscribe(() => this.performScroll());
  }

  private performScroll(): void {
    if (!this.state.node) return;

    const { verticalDirection, horizontalDirection } = this.state;
    let deltaX = 0;
    let deltaY = 0;

    // Vertical scrolling
    if (verticalDirection === AutoScrollDirection.UP) {
      deltaY = -this.config.speed;
    } else if (verticalDirection === AutoScrollDirection.DOWN) {
      deltaY = this.config.speed;
    }

    // Horizontal scrolling
    if (horizontalDirection === AutoScrollDirection.LEFT) {
      deltaX = -this.config.speed;
    } else if (horizontalDirection === AutoScrollDirection.RIGHT) {
      deltaX = this.config.speed;
    }

    this.state.node.scrollBy(deltaX, deltaY);
  }

  private resetState(): void {
    this.state = {
      node: null,
      verticalDirection: AutoScrollDirection.NONE,
      horizontalDirection: AutoScrollDirection.NONE,
    };
  }
}