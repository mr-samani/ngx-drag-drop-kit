import { IDragItem } from './IDragItem';
import { IDropList } from './IDropList';

export interface IUpdatePlaceholder {
  dragItem: IDragItem;
  destinationDropList: IDropList;
  sourceDropList: IDropList;
  /**
   * placeholder index
   */
  newIndex: number;
  /**
   * current drag index
   */
  previousIndex: number;

  /** pointer is greater than center */
  isAfter: boolean;
}
