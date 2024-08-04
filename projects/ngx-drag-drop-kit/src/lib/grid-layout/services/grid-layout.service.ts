import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { GridLayoutOptions } from '../options/options';
import { GridItemComponent } from '../grid-item/grid-item.component';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import {
  collides,
  getAllCollisions,
  getFirstCollision,
  gridHToScreenHeight,
  gridWToScreenWidth,
  gridXToScreenX,
  gridYToScreenY,
  screenHeightToGridHeight,
  screenWidthToGridWidth,
  screenXToGridX,
  screenYToGridY,
} from '../utils/grid.utils';
import { FakeItem } from '../options/gride-item-config';

export interface IUpdatePlaceholderPosition {
  gridItem: GridItemComponent;
  // mouse position X
  x: number;
  // mouse position Y
  y: number;

  width: number;
  height: number;

  // place in cel X
  cellX: number;
  // place in cel Y
  cellY: number;
  // cel width
  cellW: number;
  // cel height
  cellH: number;
}

@Injectable()
export class GridLayoutService {
  public _options: GridLayoutOptions = new GridLayoutOptions();
  public _mainEl!: HTMLElement;
  private _gridItems: GridItemComponent[] = [];

  private _renderer: Renderer2;
  private _placeholder: HTMLElement | undefined;
  private placeHolderData?: IUpdatePlaceholderPosition;
  private updatePlaceholderPosition$ = new Subject<IUpdatePlaceholderPosition>();
  constructor(rendererFactory: RendererFactory2, @Inject(DOCUMENT) private _document: Document) {
    this._renderer = rendererFactory.createRenderer(null, null);
    this.updatePlaceholderPosition$
      .pipe(
        distinctUntilChanged((prev, curr) => {
          return prev.x == curr.x && prev.y == curr.y && prev.width == curr.width && prev.height == curr.height;
        }),
        debounceTime(10)
      )
      .subscribe((input) => {
        this.updatePlaceholderPosition(input);
      });
  }

  /**
   * Add new grid item
   * @param item drid item
   */
  public registerGridItem(item: GridItemComponent) {
    const findedIndex = this._gridItems.findIndex((x) => x == item);
    if (findedIndex === -1) {
      this._gridItems.push(item);
    }
  }

  /**
   * Remove grid item
   * @param item grid item
   */
  public removeGridItem(item: GridItemComponent) {
    const findedIndex = this._gridItems.findIndex((x) => x == item);
    this._gridItems.splice(findedIndex, 1);
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

  onMoveOrResize(item: GridItemComponent) {
    const gridItemRec = item.el.getBoundingClientRect();
    // console.log(item.el, gridItemRec);
    let plcInfo = this.convertPointToCell(gridItemRec.left, gridItemRec.top, gridItemRec.width, gridItemRec.height);
    this.placeHolderData = {
      x: plcInfo.plcX,
      y: plcInfo.plcY,
      cellX: plcInfo.cellX,
      cellY: plcInfo.cellY,
      cellW: plcInfo.cellW,
      cellH: plcInfo.cellH,
      width: plcInfo.plcW,
      height: plcInfo.plcH,
      gridItem: item,
    };
    this.updatePlaceholderPosition$.next(this.placeHolderData);
  }
  onMoveOrResizeEnd(item: GridItemComponent) {
    this.removePlaceholder();
    if (!this.placeHolderData) {
      return;
    }
    //console.log(this.placeHolderData);
    let newConfix = item._config;
    newConfix.x = this.placeHolderData.cellX;
    newConfix.y = this.placeHolderData.cellY;
    newConfix.w = this.placeHolderData.cellW;
    newConfix.h = this.placeHolderData.cellH;
    item.config = newConfix;
    this._renderer.setStyle(item.el, 'transform', '');
  }

  convertPointToCell(x: number, y: number, width: number, height: number) {
    const mainRec = this._mainEl.getBoundingClientRect();
    const newX = x - mainRec.left;
    const newY = y - mainRec.top;
    const cellX = screenXToGridX(newX, this._options.cols, mainRec.width, this._options.gap);
    const cellY = screenYToGridY(newY, this.cellHeight, this._options.gap);
    const plcX = gridXToScreenX(this.cellWidth, cellX, this._options.gap);
    const plcY = gridYToScreenY(this.cellHeight, cellY, this._options.gap);
    const cellW = screenWidthToGridWidth(width, this._options.cols, mainRec.width, this._options.gap);
    const cellH = screenHeightToGridHeight(height, this.cellHeight, mainRec.height, this._options.gap);
    const plcW = gridWToScreenWidth(this.cellWidth, cellW, this._options.gap);
    const plcH = gridHToScreenHeight(this.cellHeight, cellH, this._options.gap);
    return { cellX, cellY, plcX, plcY, cellW, cellH, plcW, plcH };
  }

  /**
   * update place holder position
   * @param input
   */
  private updatePlaceholderPosition(input: IUpdatePlaceholderPosition) {
    // console.log(input);
    const { gridItem, x, y, width, height, cellX, cellY, cellW, cellH } = input;
    let fakeItem: FakeItem = {
      x: cellX,
      y: cellY,
      h: cellH,
      w: cellW,
      el: gridItem.el,
    };
    this.cehckCollesions(fakeItem);
    this.showPlaceholder(input).then((plcEl) => {
      this._renderer.setStyle(this._placeholder, 'width', width + 'px');
      this._renderer.setStyle(this._placeholder, 'height', height + 'px');
      this._renderer.setStyle(this._placeholder, 'top', y + 'px');
      this._renderer.setStyle(this._placeholder, 'left', x + 'px');
    });
  }

  private showPlaceholder(input: IUpdatePlaceholderPosition): Promise<HTMLElement> {
    return new Promise<HTMLElement>((resolve, reject) => {
      try {
        if (this._placeholder) {
          resolve(this._placeholder);
          return;
        }
        const { gridItem, x, y } = input;
        this.removePlaceholder();
        this._placeholder = this._document.createElement('div');
        this._placeholder.className = 'grid-item-placeholder grid-item-placeholder-default';
        this._placeholder.innerHTML = 'placeholder';
        this._renderer.setStyle(this._placeholder, 'width', gridItem.width + 'px');
        this._renderer.setStyle(this._placeholder, 'height', gridItem.height + 'px');
        this._renderer.setStyle(this._placeholder, 'left', x + 'px');
        this._renderer.setStyle(this._placeholder, 'top', y + 'px');
        this._renderer.setStyle(this._placeholder, 'opacity', 0.4);
        this._renderer.setStyle(this._placeholder, 'background-color', '#6e02fc');
        this._renderer.setStyle(this._placeholder, 'pointer-events', 'none');
        this._renderer.setStyle(this._placeholder, 'position', 'absolute');
        this._renderer.setStyle(this._placeholder, 'transition', 'all 100ms ease-in 0s');

        this._renderer.appendChild(this._mainEl, this._placeholder);
        resolve(this._placeholder);
      } catch (error) {
        reject();
      }
    });
  }

  private removePlaceholder() {
    if (this._placeholder) {
      this._placeholder.remove();
      this._placeholder = undefined;
    }
  }

  cehckCollesions(fakeItem: FakeItem, exp: HTMLElement[] = []) {
    const allCollessions = getAllCollisions(this._gridItems, fakeItem).filter((x) => exp.indexOf(x.el) == -1);
    for (let c of allCollessions) {
      let movedElement = this.moveGridItem(c, fakeItem.x + fakeItem.w, fakeItem.y + fakeItem.h);
      let fakeItemMoved: FakeItem = {
        x: movedElement._config.x,
        y: movedElement._config.y,
        w: movedElement._config.w,
        h: movedElement._config.h,
        el: movedElement.el,
      };
      // if (movedElement.el == fakeItem.el) {
      //   continue;
      // }
      exp.push(fakeItem.el);
      // console.log('must moved:', fakeItemMoved.el, exp);
      this.cehckCollesions(fakeItemMoved, exp);
    }
    // this.compactGridItems(fakeItem);
  }

  private moveGridItem(gridItem: GridItemComponent, cellX: number, cellY: number) {
    let newConfix = gridItem._config;
    // newConfix.x = cellX;
    newConfix.y = cellY;
    gridItem.config = newConfix;
    return gridItem;
  }

  compactGridItems(fakeItem?: FakeItem) {
    this._gridItems.forEach((el) => this.compactGridItem(el, fakeItem));
  }

  private compactGridItem(gridItem: GridItemComponent, placeholderFakeItem?: FakeItem) {
    if (gridItem._config.y <= 0) {
      return;
    }
    let fakeItem: FakeItem = {
      x: gridItem._config.x,
      y: gridItem._config.y - 1,
      w: gridItem._config.w,
      h: gridItem._config.h,
      el: gridItem.el,
    };
    let can = (placeholderFakeItem && !collides(gridItem, placeholderFakeItem)) ?? true;
    if (!getFirstCollision(this._gridItems, fakeItem) && can) {
      const newConfig = gridItem._config;
      newConfig.y--;
      gridItem.config = newConfig;
      this.compactGridItem(gridItem, placeholderFakeItem);
    }
  }
}
