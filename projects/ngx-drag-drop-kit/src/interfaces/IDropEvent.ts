import { DragItemRef } from '../lib/directives/DragItemRef';
import { IDropList } from './IDropList';

export interface IDropEvent<DataType = any> {
	/** Index of the item when it was picked up. */
	previousIndex: number;
	/** Current index of the item. */
	currentIndex: number;
	/** Item that is being dropped. */
	item: DragItemRef;
	/** Container in which the item was dropped. */
	container: IDropList;
	/** Container from which the item was picked up. Can be the same as the `container`. */
	previousContainer: IDropList;
}
