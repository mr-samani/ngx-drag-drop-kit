import { IDragItem } from './IDragItem';
import { IDropList } from './IDropList';

export interface IUpdatePlaceholder {
  dragItem: IDragItem;
  destinationDropList?: IDropList;
  /**
   * placeholder index
   */
  newIndex: number;
  /**
   * current drag index
   */
  previousIndex: number;
}
