/**
 * Improved boundary checking with floating point tolerance and transform support
 */

const FLOATING_POINT_TOLERANCE = 1; // pixels

/**
 * Check if new position exceeds boundary in Y axis
 * @param boundaryDomRec - Boundary element rectangle
 * @param el - Element being resized
 * @param offsetY - Y offset to apply
 * @param checkTop - Check if top boundary is exceeded
 * @param checkBottom - Check if bottom boundary is exceeded
 * @returns true if within bounds, false otherwise
 */
export function checkBoundY(
  selfRec: DOMRect,
  boundaryDomRec: DOMRect | undefined,
  offsetY: number,
  checkTop = true,
  checkBottom = true
): number {
  if (!boundaryDomRec) {
    return offsetY;
  }

  console.log('selfRec', selfRec.top);

  const newTop = selfRec.top + offsetY;
  const newBottom = selfRec.bottom + offsetY;

  // Check top boundary
  if (checkTop && newTop < boundaryDomRec.top + FLOATING_POINT_TOLERANCE) {
    // المان از بالا خارج شده، offset را محدود کن
    const overflow = boundaryDomRec.top - newTop;
    return offsetY + overflow;
  }

  // Check bottom boundary
  if (checkBottom && newBottom > boundaryDomRec.bottom - FLOATING_POINT_TOLERANCE) {
    // المان از پایین خارج شده، offset را محدود کن
    const overflow = newBottom - boundaryDomRec.bottom;
    return offsetY - overflow;
  }

  return offsetY;
}

/**
 * Check if new position exceeds boundary in X axis
 * @param boundaryDomRec - Boundary element rectangle
 * @param el - Element being resized
 * @param offsetX - X offset to apply
 * @param checkLeft - Check if left boundary is exceeded
 * @param checkRight - Check if right boundary is exceeded
 * @returns true if within bounds, false otherwise
 */
export function checkBoundX(
  selfRec: DOMRect,
  boundaryDomRec: DOMRect | undefined,
  offsetX: number,
  checkLeft = true,
  checkRight = true
): number {
  if (!boundaryDomRec) {
    return offsetX;
  }
  const newLeft = selfRec.left + offsetX;
  const newRight = selfRec.right + offsetX;

  // Check left boundary
  if (checkLeft && newLeft < boundaryDomRec.left + FLOATING_POINT_TOLERANCE) {
    // المان از چپ خارج شده
    const overflow = boundaryDomRec.left - newLeft;
    return offsetX + overflow;
  }

  // Check right boundary
  if (checkRight && newRight > boundaryDomRec.right - FLOATING_POINT_TOLERANCE) {
    // المان از راست خارج شده
    const overflow = newRight - boundaryDomRec.right;
    return offsetX - overflow;
  }

  return offsetX;
}

/**
 * ✅ Clamp resize within boundary 
 * @param boundaryDomRec - Boundary element rectangle (viewport coordinates)
 * @param el - Element being resized
 * @param newWidth - Proposed new width
 * @param newHeight - Proposed new height
 * @param newLeft - Proposed new left position (relative to current position)
 * @param newTop - Proposed new top position (relative to current position)
 * @returns Clamped dimensions and position
 */
export function clampWithinBoundary(
  boundaryDomRec: DOMRect | undefined,
  el: HTMLElement,
  newWidth: number,
  newHeight: number,
  newLeft: number,
  newTop: number
): { width: number; height: number; left: number; top: number } {
  if (!boundaryDomRec) {
    return { width: newWidth, height: newHeight, left: newLeft, top: newTop };
  }

  // ✅ Get element's CURRENT position in viewport
  const currentRect = el.getBoundingClientRect();

  // ✅ Calculate where element WOULD BE after applying new values
  // currentRect gives us viewport position, newLeft/newTop are CSS left/top values
  const computed = getComputedStyle(el);
  const currentCSSLeft = parseFloat(computed.left || '0');
  const currentCSSTop = parseFloat(computed.top || '0');

  // Calculate the offset between current CSS values and new values
  const leftDelta = newLeft - currentCSSLeft;
  const topDelta = newTop - currentCSSTop;

  // Calculate new viewport position
  const newViewportLeft = currentRect.left + leftDelta;
  const newViewportTop = currentRect.top + topDelta;
  const newViewportRight = newViewportLeft + newWidth;
  const newViewportBottom = newViewportTop + newHeight;

  let clampedWidth = newWidth;
  let clampedHeight = newHeight;
  let clampedLeft = newLeft;
  let clampedTop = newTop;

  // ✅ Clamp left edge
  if (newViewportLeft < boundaryDomRec.left) {
    const overflow = boundaryDomRec.left - newViewportLeft;
    clampedLeft = newLeft + overflow;
    clampedWidth = Math.max(0, clampedWidth - overflow);
  }

  // ✅ Clamp top edge
  if (newViewportTop < boundaryDomRec.top) {
    const overflow = boundaryDomRec.top - newViewportTop;
    clampedTop = newTop + overflow;
    clampedHeight = Math.max(0, clampedHeight - overflow);
  }

  // ✅ Clamp right edge
  const clampedViewportLeft = newViewportLeft + (clampedLeft - newLeft);
  const clampedRightEdge = clampedViewportLeft + clampedWidth;
  if (clampedRightEdge > boundaryDomRec.right) {
    clampedWidth = Math.max(0, boundaryDomRec.right - clampedViewportLeft);
  }

  // ✅ Clamp bottom edge
  const clampedViewportTop = newViewportTop + (clampedTop - newTop);
  const clampedBottomEdge = clampedViewportTop + clampedHeight;
  if (clampedBottomEdge > boundaryDomRec.bottom) {
    clampedHeight = Math.max(0, boundaryDomRec.bottom - clampedViewportTop);
  }

  return {
    width: clampedWidth,
    height: clampedHeight,
    left: clampedLeft,
    top: clampedTop,
  };
}

/**
 * Get zoom level of the page
 * @returns Current zoom level (1.0 = 100%, 1.5 = 150%, etc.)
 */
export function getPageZoom(): number {
  // Modern browsers
  if (window.visualViewport) {
    return window.visualViewport.scale;
  }

  // Fallback
  return window.devicePixelRatio || 1;
}

/**
 * Adjust coordinates for page zoom
 * @param value - Value to adjust
 * @returns Adjusted value accounting for zoom
 */
export function adjustForZoom(value: number): number {
  const zoom = getPageZoom();
  return value / zoom;
}
