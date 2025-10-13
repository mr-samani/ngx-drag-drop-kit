import { IDropList } from "./IDropList";

export interface IDragItem {
    el: HTMLElement;
    domRect: DOMRect;
    dropList?: IDropList;
    updateDomRect(): void;
}
