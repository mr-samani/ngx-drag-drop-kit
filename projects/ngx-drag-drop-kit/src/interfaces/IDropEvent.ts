import { NgxDraggableDirective } from '../lib/directives/ngx-draggable.directive';
import { NgxDropListDirective } from '../lib/directives/ngx-drop-list.directive';

export interface IDropEvent<DataType = any> {
  /** Index of the item when it was picked up. */
  previousIndex: number;
  /** Current index of the item. */
  currentIndex: number;
  /** Item that is being dropped. */
  item: NgxDraggableDirective;
  /** Container in which the item was dropped. */
  container: NgxDropListDirective<DataType>;
  /** Container from which the item was picked up. Can be the same as the `container`. */
  previousContainer: NgxDropListDirective<DataType>;
}
