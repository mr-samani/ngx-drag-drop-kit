import { IPosition } from '../models/IPosition';

export function getOffsetPosition(evt: MouseEvent | TouchEvent, parent?: HTMLElement) {
  if (evt instanceof MouseEvent) {
    return {
      x: evt.offsetX,
      y: evt.offsetY,
    };
  }
  var position = {
    x: evt.targetTouches ? evt.targetTouches[0].pageX : evt.touches[0].clientX,
    y: evt.targetTouches ? evt.targetTouches[0].pageY : evt.touches[0].clientY,
  };

  while (parent?.offsetParent) {
    position.x -= parent.offsetLeft - parent.scrollLeft;
    position.y -= parent.offsetTop - parent.scrollTop;

    parent = parent.offsetParent as any;
  }
  return position;
}

export function getPointerPosition(evt: MouseEvent | TouchEvent): IPosition {
  if (evt instanceof MouseEvent) {
    return {
      x: evt.pageX,
      y: evt.pageY,
    };
  } else {
    const touch = evt.targetTouches[0] || evt.changedTouches[0];
    return {
      x: touch.pageX,
      y: touch.pageY,
    };
  }
}

export function getRelativePosition(el: HTMLElement, container: HTMLElement): { x: number; y: number } {
  let elX = 0,
    elY = 0;
  let current: HTMLElement | null = el;

  // جمع کردن offset های والدها تا زمانی که به container برسیم یا null بشه
  while (current && current !== container) {
    const currentStyles = getComputedStyle(current);
    const bl: number = parseFloat(currentStyles.borderLeftWidth || '0');
    const bt: number = parseFloat(currentStyles.borderTopWidth || '0');
    elX += current.offsetLeft - current.scrollLeft + current.clientLeft - bl;
    elY += current.offsetTop - current.scrollTop + current.clientTop - bt;
    current = current.offsetParent as HTMLElement;
  }

  if (current !== container) {
    // اگه container اصلاً توی مسیر offsetParent نبود، باید fallback کنیم
    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    return {
      x: elRect.left - containerRect.left,
      y: elRect.top - containerRect.top,
    };
  }

  return { x: elX, y: elY };
}
