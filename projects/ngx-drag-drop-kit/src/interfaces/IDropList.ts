import { DragItemRef } from '../lib/directives/DragItemRef';
import { IDropEvent } from './IDropEvent';

export interface IDropList<T = any> {
	el: HTMLElement;
	domRect: DOMRect;
	dragItems: DragItemRef[];
	isRtl: boolean;
	isFlexWrap: boolean;
	disableSort: boolean;
	connectedTo: HTMLElement[];
	updateDomRect(): void;
	registerDragItem(item: DragItemRef): void;
	removeDragItem(item: DragItemRef): void;
	checkAllowedConnections(sourceDropList?: IDropList): boolean;

	addPlaceholder(drag: DragItemRef): HTMLElement;
	disposePlaceholder(): void;
	onDrop(_dropEvent: IDropEvent<any>): unknown;
	dragging?: boolean;
	data?: T;
}
