export function checkBoundY(
  boundaryDomRec: DOMRect | undefined,
  el: HTMLElement,
  offsetY: number,
  checkTop = true,
  checkHeight = true
) {
  if (!boundaryDomRec) {
    return true;
  }
  const selfRec = el.getBoundingClientRect();
  const newY = selfRec.y + offsetY;
  if (newY < boundaryDomRec.y && checkTop) {
    return false;
  } else if (newY + selfRec.height > boundaryDomRec.y + boundaryDomRec.height && checkHeight) {
    return false;
  } else {
    return true;
  }
}

/**
 * checkLeft and checkWidth useful in resize
 */
export function checkBoundX(
  boundaryDomRec: DOMRect | undefined,
  el: HTMLElement,
  offsetX: number,
  checkLeft = true,
  checkWidth = true
) {
  if (!boundaryDomRec) {
    return true;
  }
  const selfRec = el.getBoundingClientRect();
  const newX = selfRec.x + offsetX;
  if (newX < boundaryDomRec.x && checkLeft) {
    return false;
  } else if (newX + selfRec.width > boundaryDomRec.x + boundaryDomRec.width && checkWidth) {
    return false;
  } else {
    return true;
  }
}
