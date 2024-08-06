import { ComponentRef, Inject, Injectable, Renderer2, RendererFactory2, ViewContainerRef } from '@angular/core';
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
import { FakeItem, GridItemConfig } from '../options/gride-item-config';
import { mergeDeep } from '../../../utils/deep-merge';
import { log } from '../utils/log';
import { GridLayoutComponent } from '../grid-layout/grid-layout.component';

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

export const DEFAULT_GRID_ITEM_CONFIG = new GridItemConfig();
export const DEFAULT_GRID_LAYOUT_CONFIG = new GridLayoutOptions();

@Injectable()
export class GridLayoutService {
  public _options: GridLayoutOptions = DEFAULT_GRID_LAYOUT_CONFIG;
  public _mainEl!: HTMLElement;
  public _gridItems: GridItemComponent[] = [];

  public _placeholderContainerRef!: ViewContainerRef;
  private placeHolder?: GridItemComponent;
  private placeHolderRef?: ComponentRef<GridItemComponent>;

  private updatePlaceholderPosition$ = new Subject<IUpdatePlaceholderPosition>();
  private _renderer: Renderer2;
  constructor(rendererFactory: RendererFactory2, @Inject(DOCUMENT) private _document: Document) {
    this._renderer = rendererFactory.createRenderer(null, null);
    this.updatePlaceholderPosition$
      .pipe(
        distinctUntilChanged((prev, curr) => {
          return (
            prev.x == curr.x &&
            prev.y == curr.y &&
            prev.width == curr.width &&
            prev.height == curr.height &&
            prev.gridItem == curr.gridItem
          );
        }),
        debounceTime(10)
      )
      .subscribe((input) => {
        this.updatePlaceholderPosition(input);
      });
  }

  public updateGridItem(item: GridItemComponent) {
    item.config = mergeDeep(DEFAULT_GRID_ITEM_CONFIG, item.config);
    item.left = gridXToScreenX(this.cellWidth, item.config.x, this._options.gap);
    item.top = gridYToScreenY(this.cellHeight, item.config.y, this._options.gap);
    item.width = gridWToScreenWidth(this.cellWidth, item.config.w, this._options.gap);
    item.height = gridHToScreenHeight(this.cellHeight, item.config.h, this._options.gap);
    item._changeDetection.detectChanges();
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
          cur.config.y + cur.config.h // +
          //  gap * (cur.config.y+1  + cur.config.h-1) //+
          // Math.max(cur.config.y + cur.config.h, 0)
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
    const placeHolderData = {
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
    this.updatePlaceholderPosition$.next(placeHolderData);
  }
  onMoveOrResizeEnd(item: GridItemComponent) {
    this.placeHolderRef?.destroy();
    if (!this.placeHolder) {
      return;
    }
    //console.log(this.placeHolderData);
    item.config = this.placeHolder.config;
    this.updateGridItem(item);
    this._renderer.setStyle(item.el, 'transform', '');
    this.compactGridItems();
    this.placeHolder = undefined;
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
    const { gridItem, cellX, cellY, cellW, cellH } = input;
    let fakeItem: FakeItem = {
      x: cellX,
      y: cellY,
      h: cellH,
      w: cellW,
      id: gridItem.id,
    };
    this.cehckCollesions(fakeItem);
    if (!this.placeHolderRef || !this.placeHolder) {
      this.placeHolderRef = this._placeholderContainerRef.createComponent(GridItemComponent);
      this.placeHolder = this.placeHolderRef.instance;
      this.placeHolder.el.className = 'grid-item-placeholder grid-item-placeholder-default';
    }
    this.placeHolder.config = new GridItemConfig(cellX, cellY, cellW, cellH);
    this.updateGridItem(this.placeHolder);
  }

  cehckCollesions(fakeItem: FakeItem, expIds: string[] = []) {
    const allCollessions = getAllCollisions(this._gridItems, fakeItem).filter((x) => expIds.indexOf(x.id) == -1);
    for (let c of allCollessions) {
      let movedElement = this.moveGridItem(c, fakeItem.x + fakeItem.w, fakeItem.y + fakeItem.h);
      let fakeItemMoved: FakeItem = {
        x: movedElement.config.x,
        y: movedElement.config.y,
        w: movedElement.config.w,
        h: movedElement.config.h,
        id: movedElement.id,
      };
      // if (movedElement.el == fakeItem.el) {
      //   continue;
      // }
      expIds.push(fakeItem.id);
      // console.log('must moved:', fakeItemMoved.el, exp);
      this.cehckCollesions(fakeItemMoved, expIds);
    }

    // // TODO : must compact other
    // log(expIds)
    // this.compactGridItems(expIds);
  }

  private moveGridItem(gridItem: GridItemComponent, cellX: number, cellY: number) {
    gridItem.config.y = cellY;
    this.updateGridItem(gridItem);
    return gridItem;
  }

  compactGridItems(expIds?: string[]) {
    for (let item of this._gridItems) {
      if (expIds) {
        if (expIds.indexOf(item.id) == -1) this.compactGridItem(item);
      } else {
        this.compactGridItem(item);
      }
    }
  }

  private compactGridItem(gridItem: GridItemComponent) {
    if (gridItem.config.y <= 0) {
      return;
    }
    let fakeItem: FakeItem = {
      x: gridItem.config.x,
      y: gridItem.config.y - 1,
      w: gridItem.config.w,
      h: gridItem.config.h,
      id: gridItem.id,
    };
    //let can = (placeholderFakeItem && !collides(gridItem, placeholderFakeItem)) ?? true;
    if (!getFirstCollision(this._gridItems, fakeItem)) {
      gridItem.config.y--;
      this.updateGridItem(gridItem);
      this.compactGridItem(gridItem);
    }
  }
}
