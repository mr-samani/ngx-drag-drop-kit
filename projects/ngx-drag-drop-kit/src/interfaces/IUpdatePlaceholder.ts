import { DragItemRef } from '../lib/directives/DragItemRef';
import { CordPosition } from '../lib/services/ngx-drag-register.service';
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

  cord?: CordPosition;
  initialScrollOffset: IScrollOffset;
}
