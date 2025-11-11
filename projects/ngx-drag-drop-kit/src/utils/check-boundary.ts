/**
 * Improved boundary checking with floating point tolerance and transform support
 */

const FLOATING_POINT_TOLERANCE = 0.5; // pixels

/**
 * Get element's position accounting for transforms
 */
function getTransformedRect(el: HTMLElement): DOMRect {
  return el.getBoundingClientRect();
}

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
  boundaryDomRec: DOMRect | undefined,
  el: HTMLElement,
  offsetY: number,
  checkTop = true,
  checkBottom = true
): boolean {
  if (!boundaryDomRec) {
    return true;
  }

  const selfRec = getTransformedRect(el);
  const newTop = selfRec.top + offsetY;
  const newBottom = selfRec.bottom + offsetY;

  // Check top boundary with tolerance
  if (checkTop && newTop < boundaryDomRec.top - FLOATING_POINT_TOLERANCE) {
    return false;
  }

  // Check bottom boundary with tolerance
  if (checkBottom && newBottom > boundaryDomRec.bottom + FLOATING_POINT_TOLERANCE) {
    return false;
  }

  return true;
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
  boundaryDomRec: DOMRect | undefined,
  el: HTMLElement,
  offsetX: number,
  checkLeft = true,
  checkRight = true
): boolean {
  if (!boundaryDomRec) {
    return true;
  }

  const selfRec = getTransformedRect(el);
  const newLeft = selfRec.left + offsetX;
  const newRight = selfRec.right + offsetX;

  // Check left boundary with tolerance
  if (checkLeft && newLeft < boundaryDomRec.left - FLOATING_POINT_TOLERANCE) {
    return false;
  }

  // Check right boundary with tolerance
  if (checkRight && newRight > boundaryDomRec.right + FLOATING_POINT_TOLERANCE) {
    return false;
  }

  return true;
}

/**
 * Clamp resize within boundary - prevents element from going outside
 * @param boundaryDomRec - Boundary element rectangle
 * @param el - Element being resized
 * @param newWidth - Proposed new width
 * @param newHeight - Proposed new height
 * @param newLeft - Proposed new left position
 * @param newTop - Proposed new top position
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

  const parentRect = el.offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 };
  
  // Convert boundary coordinates to parent-relative
  const boundaryLeft = boundaryDomRec.left - parentRect.left;
  const boundaryTop = boundaryDomRec.top - parentRect.top;
  const boundaryRight = boundaryDomRec.right - parentRect.left;
  const boundaryBottom = boundaryDomRec.bottom - parentRect.top;

  let clampedWidth = newWidth;
  let clampedHeight = newHeight;
  let clampedLeft = newLeft;
  let clampedTop = newTop;

  // Clamp left
  if (clampedLeft < boundaryLeft) {
    clampedLeft = boundaryLeft;
  }

  // Clamp top
  if (clampedTop < boundaryTop) {
    clampedTop = boundaryTop;
  }

  // Clamp width (don't exceed right boundary)
  if (clampedLeft + clampedWidth > boundaryRight) {
    clampedWidth = boundaryRight - clampedLeft;
  }

  // Clamp height (don't exceed bottom boundary)
  if (clampedTop + clampedHeight > boundaryBottom) {
    clampedHeight = boundaryBottom - clampedTop;
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