export function checkBoundY(
  boundary: HTMLElement | undefined,
  el: HTMLElement,
  offsetY: number,
  checkTop = true,
  checkHeight = true
) {
  if (!boundary) {
    return true;
  }
  const boundleRec = boundary.getBoundingClientRect();
  const selfRec = el.getBoundingClientRect();
  const newY = selfRec.y + offsetY;
  if (newY < boundleRec.y && checkTop) {
    return false;
  } else if (
    newY + selfRec.height > boundleRec.y + boundleRec.height &&
    checkHeight
  ) {
    return false;
  } else {
    return true;
  }
}

/**
 * checkLeft and checkWidth useful in resize
 */
export function checkBoundX(
  boundary: HTMLElement | undefined,
  el: HTMLElement,
  offsetX: number,
  checkLeft = true,
  checkWidth = true
) {
  if (!boundary) {
    return true;
  }
  const boundleRec = boundary.getBoundingClientRect();
  const selfRec = el.getBoundingClientRect();
  const newX = selfRec.x + offsetX;
  if (newX < boundleRec.x && checkLeft) {
    return false;
  } else if (
    newX + selfRec.width > boundleRec.x + boundleRec.width &&
    checkWidth
  ) {
    return false;
  } else {
    return true;
  }
}
