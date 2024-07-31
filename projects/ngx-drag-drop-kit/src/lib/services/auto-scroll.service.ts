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

  handleAutoScroll(ev: MouseEvent | TouchEvent) {
    const clientX = ev instanceof MouseEvent ? ev.clientX : ev.targetTouches[0].clientX;
    const clientY = ev instanceof MouseEvent ? ev.clientY : ev.targetTouches[0].clientY;

    let elementsOnPoint = this._document.elementsFromPoint(clientX, clientY);
    this._scrollNode = getScrollableElement(elementsOnPoint);
    if (!this._scrollNode) {
      return;
    }

    // console.log(clientX, clientY, '_scrollNode', this._scrollNode.tagName);
    // if (this._scrollNode.tagName.toLowerCase() === 'html') {
    //   debugger
    // }
    // Get the viewport-relative coordinates of the mousemove event.
    var _scrollNodePosition = this._scrollNode.getBoundingClientRect();
    var viewportX = clientX - (_scrollNodePosition.x > 0 ? _scrollNodePosition.x : 0);
    var viewportY = clientY - (_scrollNodePosition.y > 0 ? _scrollNodePosition.y : 0);
    // Get the viewport dimensions.
    var viewportWidth = this._scrollNode.clientWidth;
    var viewportHeight = this._scrollNode.clientHeight;
    // Next, we need to determine if the mouse is within the "edge" of the
    // viewport, which may require scrolling the window. To do this, we need to
    // calculate the boundaries of the edge in the viewport (these coordinates
    // are relative to the viewport grid system).
    var edgeTop = this.scrollThreshold;
    var edgeLeft = this.scrollThreshold;
    var edgeBottom = viewportHeight - this.scrollThreshold - window.scrollY;
    var edgeRight = viewportWidth - this.scrollThreshold - window.scrollX;
    //  console.log('edgeTop', edgeTop, 'edgeLeft', edgeLeft, 'edgeBottom', edgeBottom, 'edgeRight', edgeRight ,'viewportX',viewportX,'viewportY',viewportY);
    // return;
    var isInLeftEdge = viewportX < edgeLeft;
    var isInRightEdge = viewportX > edgeRight;
    var isInTopEdge = viewportY < edgeTop;
    var isInBottomEdge = viewportY > edgeBottom;

    var innerWidth = Math.max(this._scrollNode.scrollWidth, this._scrollNode.offsetWidth, this._scrollNode.clientWidth);
    var innerHeight = Math.max(
      this._scrollNode.scrollHeight,
      this._scrollNode.offsetHeight,
      this._scrollNode.clientHeight
    );
    // Calculate the maximum scroll offset in each direction. Since you can only
    // scroll the overflow portion of the document, the maximum represents the
    // length of the document that is NOT in the viewport.
    var maxScrollX = innerWidth - viewportWidth;
    var maxScrollY = innerHeight - viewportHeight;
    // Get the current scroll position of the document.
    var currentScrollX = this._scrollNode.scrollLeft;
    var currentScrollY = this._scrollNode.scrollTop;

    // Determine if the window can be scrolled in any particular direction.
    var canScrollUp = currentScrollY > 0;
    var canScrollDown = currentScrollY < maxScrollY;
    var canScrollLeft = currentScrollX > 0;
    var canScrollRight = currentScrollX < maxScrollX;

    this._horizontalScrollDirection = AutoScrollHorizontalDirection.NONE;
    this._verticalScrollDirection = AutoScrollVerticalDirection.NONE;

    // console.log(this._scrollNode.tagName, 'canScrollUp', canScrollUp, 'isInTopEdge', isInTopEdge);
    // console.log(      this._scrollNode.tagName,      'canScrollDown',      canScrollDown,      'isInBottomEdge',      isInBottomEdge    );
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

    // console.log(
    //   Object.values(AutoScrollVerticalDirection)[this._verticalScrollDirection],
    //   Object.values(AutoScrollHorizontalDirection)[this._horizontalScrollDirection]
    //   );
    // console.log(      this._verticalScrollDirection || this._horizontalScrollDirection    );
    if (this._verticalScrollDirection || this._horizontalScrollDirection) {
      this._ngZone.runOutsideAngular(this._startScrollInterval);
    } else {
      this._stopScrolling();
    }
  }

  /** Starts the interval that'll auto-scroll the element. */
  private _startScrollInterval = () => {
    this._stopScrolling();

    interval(0, animationFrameScheduler)
      .pipe(takeUntil(this._stopScrollTimers))
      .subscribe(() => {
        const node = this._scrollNode;
        if (!node) return;
        // node.style.display = 'unset';
        // console.log(node.tagName, node.scrollTop);
        if (this._verticalScrollDirection === AutoScrollVerticalDirection.UP) {
          node.scrollBy(0, -this.scrollSpeed);
        } else if (this._verticalScrollDirection === AutoScrollVerticalDirection.DOWN) {
          node.scrollBy(0, this.scrollSpeed);
        }

        if (this._horizontalScrollDirection === AutoScrollHorizontalDirection.LEFT) {
          node.scrollBy(-this.scrollSpeed, 0);
        } else if (this._horizontalScrollDirection === AutoScrollHorizontalDirection.RIGHT) {
          node.scrollBy(this.scrollSpeed, 0);
        }
      });
  };

  /** Stops any currently-running auto-scroll sequences. */
  _stopScrolling() {
    // console.log('stop')
    this._stopScrollTimers.next();
  }
}
