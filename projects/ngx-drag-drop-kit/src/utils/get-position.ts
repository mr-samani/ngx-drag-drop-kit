import { IPosition } from '../interfaces/IPosition';

export function getOffsetPosition(evt: MouseEvent | TouchEvent | PointerEvent, parent?: HTMLElement) {
  if (evt instanceof MouseEvent || evt instanceof PointerEvent) {
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

/**
 * نکته : pageX,pageY اگر صفحه اسکرول داشته باشه هم محاسبه میکنه
 * اگر بخواهیم فقط Viewport باشد باید clientX , clientY استفاده کنیم
 * @param evt
 * @returns
 */
export function getPointerPosition(evt: MouseEvent | TouchEvent | PointerEvent): IPosition {
  if (evt instanceof MouseEvent || evt instanceof PointerEvent) {
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
export function getPointerPositionOnViewPort(evt: MouseEvent | TouchEvent | PointerEvent): IPosition {
  if (evt instanceof MouseEvent || evt instanceof PointerEvent) {
    return {
      x: evt.clientX,
      y: evt.clientY,
    };
  } else {
    const touch = evt.targetTouches[0] || evt.changedTouches[0];
    return {
      x: touch.clientX,
      y: touch.clientY,
    };
  }
}
export function getRelativePosition(element: HTMLElement, relativeTo: HTMLElement): { x: number; y: number } {
  if (!element || !relativeTo) {
    return { x: 0, y: 0 };
  }

  // مختصات المان و container
  const elRect = element.getBoundingClientRect();
  const containerRect = relativeTo.getBoundingClientRect();

  // اختلاف بین دو rect
  let x = elRect.left - containerRect.left;
  let y = elRect.top - containerRect.top;

  // جمع کردن اسکرول داخلی تمام اجداد container
  let parent = element.parentElement;
  while (parent && parent !== relativeTo && parent instanceof HTMLElement) {
    x += parent.scrollLeft || 0;
    y += parent.scrollTop || 0;
    parent = parent.parentElement;
  }

  return { x, y };
}

export function getAbsoluteOffset(el: HTMLElement): { x: number; y: number } {
  let x = 0;
  let y = 0;
  let current = el;

  while (current) {
    x += current.offsetLeft - current.scrollLeft + current.clientLeft;
    y += current.offsetTop - current.scrollTop + current.clientTop;
    current = current.offsetParent as HTMLElement;
  }

  return { x, y };
}
