import { NgxDropListDirective, NgxDraggableDirective, IPosition } from '../public-api';

export interface IUpdatePlaceholder {
  dropList: NgxDropListDirective;
  currentDrag: NgxDraggableDirective;
  isAfter?: boolean;
  dragOverItem?: NgxDraggableDirective;
  currentDragRec: DOMRect;
  overItemRec?: DOMRect;
  position?: IPosition;
  state: 'show' | 'hidden' | 'update';
}
