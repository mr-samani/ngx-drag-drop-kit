import { NgxDropListDirective, NgxDraggableDirective } from '../public-api';

export interface IUpdatePlaceholder {
  /** current drag item */
  dragItem: NgxDraggableDirective;
  destinationDropList?: NgxDropListDirective;
  isAfter: boolean;
  dragOverItem?: NgxDraggableDirective;
  currentDragRec: DOMRect;
  overItemRec?: DOMRect;
  state: 'show' | 'hidden' | 'update';
}
