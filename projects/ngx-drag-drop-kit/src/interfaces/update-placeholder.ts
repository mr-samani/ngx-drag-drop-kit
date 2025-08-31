import { NgxDropListDirective, NgxDraggableDirective } from '../public-api';

export interface IUpdatePlaceholder {
  /** current drag item */
  dragItem: NgxDraggableDirective;
  destinationDropList?: NgxDropListDirective;
  isAfter: boolean;
  dragOverItem?: NgxDraggableDirective;
  state: 'show' | 'hidden' | 'update';
}
