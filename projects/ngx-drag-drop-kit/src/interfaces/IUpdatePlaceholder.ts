import { DragItemRef } from '../lib/directives/DragItemRef';
import { IDropList } from './IDropList';
import { IScrollOffset } from './IScrollOffset';

export interface IUpdatePlaceholder {
  dragItem: DragItemRef;
  dragOverItem?: DragItemRef;
  destinationDropList: IDropList;
  sourceDropList: IDropList;
  /**
   * placeholder index
   */
  newIndex: number;

  before: boolean;
  initialScrollOffset: IScrollOffset;
}
