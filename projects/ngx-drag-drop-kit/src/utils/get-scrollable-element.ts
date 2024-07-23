export function getScrollableElement(
  elementsOnPoint: Element[]
): HTMLElement | null {
  for (let el of elementsOnPoint) {
    var hs = el.scrollWidth > el.clientWidth;
    var vs = el.scrollHeight > el.clientHeight;
    if (vs) return el as HTMLElement;
  }
  return null;
}
