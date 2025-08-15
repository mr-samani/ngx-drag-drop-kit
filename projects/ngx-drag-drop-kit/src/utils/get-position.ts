import { IPosition } from '../interfaces/IPosition';
import { getXYfromTransform } from './get-transform';

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

/**
 * نکته : pageX,pageY اگر صفحه اسکرول داشته باشه هم محاسبه میکنه
 * اگر بخواهیم فقط Viewport باشد باید clientX , clientY استفاده کنیم
 * @param evt
 * @returns
 */
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
export function getPointerPositionOnViewPort(evt: MouseEvent | TouchEvent): IPosition {
  if (evt instanceof MouseEvent) {
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
export function getRelativePosition(el: HTMLElement, container: HTMLElement): DOMRect {
  let elX = 0,
    elY = 0;
  let current: HTMLElement | null = el;

  // اگر المنت display:none هست، موقتاً نمایش بدیم
  const hiddenElements: { el: HTMLElement; display: string }[] = [];
  let temp: HTMLElement | null = el;
  while (temp) {
    const style = getComputedStyle(temp);
    if (style.display === 'none') {
      hiddenElements.push({ el: temp, display: temp.style.display });
      temp.style.display = 'block';
    }
    temp = temp.parentElement;
  }

  while (current && current !== container) {
    const currentStyles = getComputedStyle(current);
    const bl: number = parseFloat(currentStyles.borderLeftWidth || '0');
    const bt: number = parseFloat(currentStyles.borderTopWidth || '0');

    const matrix = currentStyles.transform.replace(/[^0-9\-.,]/g, '').split(',');
    const tx = parseFloat(matrix.length > 6 ? matrix[12] : matrix[4]) || 0;
    const ty = parseFloat(matrix.length > 6 ? matrix[13] : matrix[5]) || 0;

    elX += current.offsetLeft - current.scrollLeft + current.clientLeft - bl + tx;
    elY += current.offsetTop - current.scrollTop + current.clientTop - bt + ty;

    current = current.offsetParent as HTMLElement;
  }
  const elRect = el.getBoundingClientRect();

  // اگه container پیدا نشد → fallback به getBoundingClientRect
  if (current !== container) {
    const containerRect = container.getBoundingClientRect();

    // بازگرداندن display های قبلی
    for (const { el, display } of hiddenElements) el.style.display = display;

    return new DOMRect(elRect.left - containerRect.left, elRect.top - containerRect.top, elRect.width, elRect.height);
  }

  // بازگرداندن display های قبلی
  for (const { el, display } of hiddenElements) el.style.display = display;

  return new DOMRect(elX, elY, elRect.width, elRect.height);
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
