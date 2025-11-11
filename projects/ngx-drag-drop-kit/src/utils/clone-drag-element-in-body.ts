import { copyEssentialStyles } from './clone-style';

export function cloneDragElementInBody(dragElement: HTMLElement, currDomRect: DOMRect): HTMLElement {
  let newEL = dragElement.cloneNode(true) as HTMLElement;
  copyEssentialStyles(dragElement, newEL);
  newEL.innerHTML = dragElement.innerHTML;
  newEL.className = dragElement.className + ' ngx-drag-in-body';
  newEL.style.position = 'absolute';
  newEL.style.top = '0px';
  newEL.style.left = '0px';
  newEL.style.width = currDomRect.width + 'px';
  newEL.style.height = currDomRect.height + 'px';
  newEL.style.pointerEvents = 'none';
  newEL.style.opacity = '0.85';
  newEL.style.boxShadow = '0px 3px 20px rgba(0,0,0,.5)';
  newEL.style.zIndex = '1000';
  newEL.style.transitionProperty = 'none';
  return newEL;
}
