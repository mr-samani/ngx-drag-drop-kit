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
}
