import { IDropList } from '../../interfaces/IDropList';

export class DragItemRef {
  boundaryDomRect?: DOMRect;
  _boundary?: HTMLElement;
  el: HTMLElement;
  dropList?: IDropList;

  _domRect!: DOMRect;
  isPlaceholder: boolean = false;
  isDragging: boolean = false;

  isFullRow: boolean = false;

  constructor(el: HTMLElement) {
    this.el = el;
  }
  public get domRect(): DOMRect {
    return new DOMRect(this._domRect.x, this._domRect.y, this._domRect.width, this._domRect.height);
  }

  updateDomRect() {
    this._domRect = this.el.getBoundingClientRect();
    if (this._boundary) {
      this.boundaryDomRect = this._boundary.getBoundingClientRect();
    }
  }
}
