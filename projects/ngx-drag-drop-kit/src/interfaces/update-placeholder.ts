import { NgxDropListDirective, NgxDraggableDirective } from '../public-api';

export interface IUpdatePlaceholder {
  dropList: NgxDropListDirective;
  currentDrag: NgxDraggableDirective;
  isAfter: boolean;
  dragOverItem?: NgxDraggableDirective;
  currentDragRec: DOMRect;
  overItemRec?: DOMRect;

  state: 'show' | 'hidden' | 'update';
}
