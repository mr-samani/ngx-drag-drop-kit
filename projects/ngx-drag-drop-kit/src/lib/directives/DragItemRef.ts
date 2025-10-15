import { IDropList } from '../../interfaces/IDropList';

export class DragItemRef {
  el: HTMLElement;
  dropList?: IDropList;
  transform: { x: number; y: number } = { x: 0, y: 0 };

  _domRect!: DOMRect;

  constructor(el: HTMLElement) {
    this.el = el;
  }
  public get domRect(): DOMRect {
    return new DOMRect(
      this._domRect.x - this.transform.x,
      this._domRect.y - this.transform.y,
      this._domRect.width,
      this._domRect.height
    );
  }

  updateDomRect() {
    this._domRect = this.el.getBoundingClientRect();
    this.transform = { x: 0, y: 0 };
  }
}
