import { IDragItem } from './IDragItem';
import { IDropEvent } from './IDropEvent';

export interface IDropList<T = any> {
  el: HTMLElement;
  domRect: DOMRect;
  dragItems: IDragItem[];
  direction: 'horizontal' | 'vertical';
  isRtl: boolean;
  isFlexWrap: boolean;
  disableSort: boolean;
  connectedTo: HTMLElement[];
  updateDomRect(): void;
  registerDragItem(item: IDragItem): void;
  removeDragItem(item: IDragItem): void;
  checkAllowedConnections(sourceDropList?: IDropList): boolean;

  addPlaceholder(dragRect: DOMRect): HTMLElement;
  disposePlaceholder(): void;
  onDrop(_dropEvent: IDropEvent<any>): unknown;
  dragging?: boolean;
  data?: T;
}
