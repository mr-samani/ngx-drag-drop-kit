import { Injectable } from '@angular/core';
import { GridLayoutOptions } from '../options/options';
import { GridItemComponent } from '../grid-item/grid-item.component';

@Injectable()
export class GridLayoutService {
  public _options: GridLayoutOptions = new GridLayoutOptions();
  public _mainEl!: HTMLElement;
  private _gridItems: GridItemComponent[] = [];

  public registerGridItem(item: GridItemComponent) {
    const findedIndex = this._gridItems.findIndex((x) => x == item);
    if (findedIndex === -1) {
      this._gridItems.push(item);
    }
  }

  public removeGridItem(item: GridItemComponent) {
    const findedIndex = this._gridItems.findIndex((x) => x == item);
    this._gridItems.splice(findedIndex, 1);
  }

  public setMainLayout(el: HTMLElement) {
    this._mainEl = el;
  }
  public get mainWidth() {
    const mainElRec = this._mainEl.getBoundingClientRect();
    return mainElRec.width - (this._options.gap * 2 + this._options.gridBackgroundConfig.borderWidth * 2);
  }
  public get mainHeight() {
    const mainElRec = this._mainEl.getBoundingClientRect();
    return mainElRec.height;
  }

  public get cellWidth() {
    const { cols, gap } = this._options;
    const widthExcludingGap = this.mainWidth - Math.max(gap * (cols - 1), 0);
    return widthExcludingGap / cols;
  }

  public get cellHeight() {
    if (typeof this._options.rowHeight == 'number') {
      return this._options.rowHeight;
    }
    //TODO: unknown
    return this.mainHeight;
  }

  public get getGridHeight(): number {
    const rowHeight = this.cellHeight;
    const gap = this._options.gap;
    const border = this._options.gridBackgroundConfig.borderWidth;
    const height = this._gridItems.reduce(
      (acc, cur) =>
        Math.max(
          acc,
          // rowHeight *
          cur._config.y + cur._config.h // +
          //  gap * (cur._config.y+1  + cur._config.h-1) //+
          // Math.max(cur._config.y + cur._config.h, 0)
        ),
      0
    );
    return (
      rowHeight * height +
      gap * (height - 1) +
      // main padding
      gap * 2 +
      // main border width
      border * 2
    );
  }
}

// this.y = this._gridService.cellHeight * this._config.y + this._gridService._options.gap * (this._config.y + 1);
// this.height = this._gridService.cellHeight * this._config.h + this._gridService._options.gap * (this._config.h - 1);
