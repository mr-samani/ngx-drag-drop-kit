import { IPosition } from 'ngx-drag-drop-kit';
import { DragItemRef } from '../lib/directives/DragItemRef';
import { IDropList } from './IDropList';

export interface IUpdatePlaceholder {
  dragItem: DragItemRef;
  dragOverItem?: DragItemRef;
  destinationDropList: IDropList;
  sourceDropList: IDropList;
  /**
   * placeholder index
   */
  newIndex: number;

  isAfter: boolean;
  initialScrollOffset: IPosition;
}
