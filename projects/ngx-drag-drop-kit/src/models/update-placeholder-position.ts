import { NgxDropListDirective, NgxDraggableDirective } from "../public-api";

export interface IUpdatePlaceholderPosition {
  dropList: NgxDropListDirective;
  currentDrag: NgxDraggableDirective;
  isAfter: boolean;
  dragOverItem?: NgxDraggableDirective;
  currentDragRec?: DOMRect;
  direction: 'horizontal' | 'vertical';
}
