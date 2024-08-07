import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, NgZone } from '@angular/core';
import { Subject, animationFrameScheduler, interval, takeUntil } from 'rxjs';
import { getScrollableElement } from '../../utils/get-scrollable-element';

/** Vertical direction in which we can auto-scroll. */
export enum AutoScrollVerticalDirection {
  NONE,
  UP,
  DOWN,
}

/** Horizontal direction in which we can auto-scroll. */
export enum AutoScrollHorizontalDirection {
  NONE,
  LEFT,
  RIGHT,
}

@Injectable({
  providedIn: 'root',
})
export class AutoScroll {
  private scrollSpeed = 5;
  private scrollThreshold = 30;

  /** Used to signal to the current auto-scroll sequence when to stop. */
  private readonly _stopScrollTimers = new Subject<void>();

  /** Node that is being auto-scrolled. */
  private _scrollNode: HTMLElement | null = null;

  /** Vertical direction in which the list is currently scrolling. */
  private _verticalScrollDirection = AutoScrollVerticalDirection.NONE;

  /** Horizontal direction in which the list is currently scrolling. */
  private _horizontalScrollDirection = AutoScrollHorizontalDirection.NONE;

  constructor(@Inject(DOCUMENT) private _document: Document, private _ngZone: NgZone) {}

  /**
   * Handles the auto-scroll logic based on the mouse or touch event.
   * @param ev MouseEvent or TouchEvent used to determine scroll behavior.
   */
  handleAutoScroll(ev: MouseEvent | TouchEvent) {
    const clientX = ev instanceof MouseEvent ? ev.clientX : ev.targetTouches[0].clientX;
    const clientY = ev instanceof MouseEvent ? ev.clientY : ev.targetTouches[0].clientY;

    let elementsOnPoint = this._document.elementsFromPoint(clientX, clientY);
    this._scrollNode = getScrollableElement(elementsOnPoint);

    if (!this._scrollNode) {
      this._stopScrolling();
      return;
    }

    const scrollNodePosition = this._scrollNode.getBoundingClientRect();
    const viewportX = clientX - Math.max(scrollNodePosition.x, 0);
    const viewportY = clientY - Math.max(scrollNodePosition.y, 0);
    const viewportWidth = this._scrollNode.clientWidth;
    const viewportHeight = this._scrollNode.clientHeight;

    const edgeTop = this.scrollThreshold;
    const edgeLeft = this.scrollThreshold;
    const edgeBottom = viewportHeight - this.scrollThreshold;
    const edgeRight = viewportWidth - this.scrollThreshold;

    const isInLeftEdge = viewportX < edgeLeft;
    const isInRightEdge = viewportX > edgeRight;
    const isInTopEdge = viewportY < edgeTop;
    const isInBottomEdge = viewportY > edgeBottom;

    const innerWidth = Math.max(
      this._scrollNode.scrollWidth,
      this._scrollNode.offsetWidth,
      this._scrollNode.clientWidth
    );
    const innerHeight = Math.max(
      this._scrollNode.scrollHeight,
      this._scrollNode.offsetHeight,
      this._scrollNode.clientHeight
    );

    const maxScrollX = innerWidth - viewportWidth;
    const maxScrollY = innerHeight - viewportHeight;

    const currentScrollX = this._scrollNode.scrollLeft;
    const currentScrollY = this._scrollNode.scrollTop;

    const canScrollUp = currentScrollY > 0;
    const canScrollDown = currentScrollY < maxScrollY;
    const canScrollLeft = currentScrollX > 0;
    const canScrollRight = currentScrollX < maxScrollX;

    this._horizontalScrollDirection = AutoScrollHorizontalDirection.NONE;
    this._verticalScrollDirection = AutoScrollVerticalDirection.NONE;

    if (isInLeftEdge && canScrollLeft) {
      this._horizontalScrollDirection = AutoScrollHorizontalDirection.LEFT;
    } else if (isInRightEdge && canScrollRight) {
      this._horizontalScrollDirection = AutoScrollHorizontalDirection.RIGHT;
    }

    if (isInTopEdge && canScrollUp) {
      this._verticalScrollDirection = AutoScrollVerticalDirection.UP;
    } else if (isInBottomEdge && canScrollDown) {
      this._verticalScrollDirection = AutoScrollVerticalDirection.DOWN;
    }

    if (
      this._verticalScrollDirection !== AutoScrollVerticalDirection.NONE ||
      this._horizontalScrollDirection !== AutoScrollHorizontalDirection.NONE
    ) {
      this._ngZone.runOutsideAngular(() => this._startScrollInterval());
    } else {
      this._stopScrolling();
    }
  }

  /** Starts the interval that'll auto-scroll the element. */
  private _startScrollInterval() {
    this._stopScrolling();

    interval(0, animationFrameScheduler)
      .pipe(takeUntil(this._stopScrollTimers))
      .subscribe(() => {
        if (!this._scrollNode) return;

        if (this._verticalScrollDirection === AutoScrollVerticalDirection.UP) {
          this._scrollNode.scrollBy(0, -this.scrollSpeed);
        } else if (this._verticalScrollDirection === AutoScrollVerticalDirection.DOWN) {
          this._scrollNode.scrollBy(0, this.scrollSpeed);
        }

        if (this._horizontalScrollDirection === AutoScrollHorizontalDirection.LEFT) {
          this._scrollNode.scrollBy(-this.scrollSpeed, 0);
        } else if (this._horizontalScrollDirection === AutoScrollHorizontalDirection.RIGHT) {
          this._scrollNode.scrollBy(this.scrollSpeed, 0);
        }
      });
  }

  /** Stops any currently-running auto-scroll sequences. */
  private _stopScrolling() {
    this._stopScrollTimers.next();
  }
}
