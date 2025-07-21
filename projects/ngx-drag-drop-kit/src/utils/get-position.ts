import { IPosition } from '../interfaces/IPosition';

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


