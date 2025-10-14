import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, NgZone } from '@angular/core';
import { Subject, animationFrames, takeUntil } from 'rxjs';
import { getPointerPositionOnViewPort } from '../../utils/get-position';
import { findScrollableElementFromPointer } from '../../utils/findScrollableElement';

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
  private readonly config: AutoScrollConfig = { speed: 5, threshold: 100 };
  private readonly stopSignal$ = new Subject<void>();
  private state: ScrollState = {
    node: null,
    verticalDirection: AutoScrollDirection.NONE,
    horizontalDirection: AutoScrollDirection.NONE,
  };

  constructor(@Inject(DOCUMENT) private document: Document, private ngZone: NgZone) {}

  handleAutoScroll(event: MouseEvent | TouchEvent): void {
    const { x, y } = getPointerPositionOnViewPort(event);
    const scrollNode = findScrollableElementFromPointer(this.document, x, y);
    if (!scrollNode) {
      this.stop();
      return;
    }

    this.state.node = scrollNode;
    this.updateScrollDirections(x, y);

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

  private updateScrollDirections(clientX: number, clientY: number): void {
    const node = this.state.node;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const offsetY = clientY - rect.top;

    const { canScrollUp, canScrollDown, canScrollLeft, canScrollRight } = this.getScrollCapabilities(node);

    this.state.verticalDirection = AutoScrollDirection.NONE;
    this.state.horizontalDirection = AutoScrollDirection.NONE;

    // Vertical
    if (offsetY < this.config.threshold && canScrollUp) {
      this.state.verticalDirection = AutoScrollDirection.UP;
    } else if (rect.height - offsetY < this.config.threshold && canScrollDown) {
      this.state.verticalDirection = AutoScrollDirection.DOWN;
    }

    // Horizontal
    if (offsetX < this.config.threshold && canScrollLeft) {
      this.state.horizontalDirection = AutoScrollDirection.LEFT;
    } else if (rect.width - offsetX < this.config.threshold && canScrollRight) {
      this.state.horizontalDirection = AutoScrollDirection.RIGHT;
    }
  }

  private getScrollCapabilities(node: HTMLElement) {
    return {
      canScrollUp: node.scrollTop > 0,
      canScrollDown: node.scrollTop < node.scrollHeight - node.clientHeight,
      canScrollLeft: node.scrollLeft > 0,
      canScrollRight: node.scrollLeft < node.scrollWidth - node.clientWidth,
    };
  }

  private shouldScroll(): boolean {
    return (
      this.state.verticalDirection !== AutoScrollDirection.NONE ||
      this.state.horizontalDirection !== AutoScrollDirection.NONE
    );
  }

  private startScrolling(): void {
    animationFrames()
      .pipe(takeUntil(this.stopSignal$))
      .subscribe(() => this.performScroll());
  }

  private performScroll(): void {
    const node = this.state.node;
    if (!node) return;

    const { verticalDirection, horizontalDirection } = this.state;
    let deltaX = 0;
    let deltaY = 0;

    if (verticalDirection === AutoScrollDirection.UP) deltaY = -this.config.speed;
    else if (verticalDirection === AutoScrollDirection.DOWN) deltaY = this.config.speed;

    if (horizontalDirection === AutoScrollDirection.LEFT) deltaX = -this.config.speed;
    else if (horizontalDirection === AutoScrollDirection.RIGHT) deltaX = this.config.speed;

    node.scrollBy(deltaX, deltaY);
  }

  private resetState(): void {
    this.state = {
      node: null,
      verticalDirection: AutoScrollDirection.NONE,
      horizontalDirection: AutoScrollDirection.NONE,
    };
  }
}
