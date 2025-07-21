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
  sortGridItems,
} from '../utils/grid.utils';
import { FakeItem, GridItemConfig } from '../options/gride-item-config';
import { mergeDeep } from '../../../utils/deep-merge';
import { log } from '../utils/log';
import { getRelativePosition } from '../../../utils/get-relative-position';

export const DEFAULT_GRID_ITEM_CONFIG = new GridItemConfig();
export const DEFAULT_GRID_LAYOUT_CONFIG = new GridLayoutOptions();

@Injectable()
export class GridLayoutService {
  public _options: GridLayoutOptions = DEFAULT_GRID_LAYOUT_CONFIG;
  public _mainEl!: HTMLElement;
  public _gridItems: GridItemComponent[] = [];
  public isRtl: boolean = false;

  public _placeholderContainerRef!: ViewContainerRef;
  private placeHolder?: GridItemComponent;
  private placeHolderRef?: ComponentRef<GridItemComponent>;

  private updatePlaceholderPosition$ = new Subject<FakeItem>();
  private _renderer: Renderer2;

  constructor(rendererFactory: RendererFactory2, @Inject(DOCUMENT) private _document: Document) {
    this._renderer = rendererFactory.createRenderer(null, null);
    this.updatePlaceholderPosition$
      .pipe(
        distinctUntilChanged((prev, curr) => {
          return (
            prev.x == curr.x && prev.y == curr.y && prev.w == curr.w && prev.h == curr.h
            // && prev.gridItem == curr.gridItem
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
    item.width = gridWToScreenWidth(this.cellWidth, item.config.w, this._options.gap);
    item.height = gridHToScreenHeight(this.cellHeight, item.config.h, this._options.gap);
    item.left = gridXToScreenX(
      this.cellWidth,
      item.config.x,
      this._options.gap,
      this._options.cols,
      item.config.w,
      this.isRtl
    );
    item.top = gridYToScreenY(this.cellHeight, item.config.y, this._options.gap);
    item.updateView();
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
    if (!this._mainEl) return;
    const itemRect = item.el.getBoundingClientRect();
    const position = item.el.getBoundingClientRect();
    if (this.isRtl) {
      position.x = this.mainWidth - position.x - itemRect.width;
      position.y = this.mainHeight - position.y - itemRect.height;
    }

    let plcInfo = this.convertPointToCell(position.x, position.y, itemRect.width, itemRect.height);
    const fakeItem: FakeItem = {
      x: plcInfo.cellX,
      y: plcInfo.cellY,
      w: plcInfo.cellW,
      h: plcInfo.cellH,
      id: item.id,
    };
    console.log('placeholder', position, fakeItem);
    this.updatePlaceholderPosition$.next(fakeItem);
  }

  onMoveOrResizeEnd(item: GridItemComponent) {
    this.placeHolderRef?.destroy();
    if (!this.placeHolder) {
      // this.updateGridItem(item);
      return;
    }
    //console.log(this.placeHolderData);
    item.config = this.placeHolder.config;
    this.updateGridItem(item);
    this._renderer.setStyle(item.el, 'transform', '');
    this.placeHolder = undefined;
    // todo: if pushOnDrag config is on -> no need to checkCollisson in end drag
    this.cehckCollesions({ ...item.config, id: item.id });
    this.compactGridItems();
    // console.log(this._gridItems.map((x) => x.id));
  }

  convertPointToCell(x: number, y: number, width: number, height: number) {
    const mainRec = this._mainEl.getBoundingClientRect();
    const newX = x;
    const newY = y;
    let cellX = screenXToGridX(newX, this._options.cols, mainRec.width, this._options.gap);
    let cellY = screenYToGridY(newY, this.cellHeight, this._options.gap);
    let cellW = screenWidthToGridWidth(width, this._options.cols, mainRec.width, this._options.gap);
    let cellH = screenHeightToGridHeight(height, this.cellHeight, mainRec.height, this._options.gap);
    if (cellX + cellW > this._options.cols) {
      cellX -= cellX + cellW - this._options.cols;
    }
    if (cellX < 0) cellX = 0;
    if (cellY < 0) cellY = 0;
    if (cellW <= 0) cellW = 1;
    if (cellH <= 0) cellH = 1;
    return { cellX, cellY, cellW, cellH };
  }

  /**
   * update place holder position
   * @param input
   */
  private updatePlaceholderPosition(fakeItem: FakeItem) {
    // console.log(input);
    if (this._options.pushOnDrag) {
      this.cehckCollesions(fakeItem);
    }

    if (!this.placeHolderRef || !this.placeHolder) {
      this.placeHolderRef = this._placeholderContainerRef.createComponent(GridItemComponent);
      this.placeHolder = this.placeHolderRef.instance;
      this.placeHolder.el.className = 'grid-item-placeholder grid-item-placeholder-default';
      this.placeHolder.id = 'PLACEHOLDER_GRID_ITEM';
    }
    while (fakeItem.y > 0 && getFirstCollision(this._gridItems, { ...fakeItem, y: fakeItem.y - 1 }) == null) {
      fakeItem.y--;
    }
    this.placeHolder.config = new GridItemConfig(fakeItem.x, fakeItem.y, fakeItem.w, fakeItem.h);
    this.updateGridItem(this.placeHolder);

    this.compactGridItems();
  }

  cehckCollesions(fakeItem: FakeItem) {
    const allCollisions = getAllCollisions(this._gridItems, fakeItem);
    for (let c of allCollisions) {
      let movedElement = this.moveGridItem(c, fakeItem.x + fakeItem.w, fakeItem.y + fakeItem.h);
      // console.log('must move down :', movedElement.id);
      let fakeItemMoved: FakeItem = {
        x: movedElement.config.x,
        y: movedElement.config.y,
        w: movedElement.config.w,
        h: movedElement.config.h,
        id: movedElement.id,
      };
      this.cehckCollesions(fakeItemMoved);
    }
  }

  private moveGridItem(gridItem: GridItemComponent, cellX: number, cellY: number) {
    if (!gridItem.isDraggingOrResizing) {
      gridItem.config.y = cellY;
    }
    this.updateGridItem(gridItem);
    return gridItem;
  }

  compactGridItems() {
    this._gridItems = sortGridItems(this._gridItems, 'vertical');
    for (let gridItem of this._gridItems) {
      if (gridItem.config.y <= 0 || gridItem.config.h <= 0) {
        continue;
      }
      let fakeItem: FakeItem = {
        x: gridItem.config.x,
        y: gridItem.config.y - 1,
        w: gridItem.config.w,
        h: gridItem.config.h,
        id: gridItem.id,
      };
      while (gridItem.config.y > 0 && getFirstCollision(this._gridItems, fakeItem) == null) {
        if (
          gridItem.isDraggingOrResizing ||
          (this.placeHolder &&
            collides(gridItem, {
              ...this.placeHolder.config,
              y: this.placeHolder.config.y + 1,
              id: this.placeHolder.id,
            }))
        ) {
          // console.log('has collission with placehlder');
          break;
        }
        log('shift up');
        fakeItem.y--;
        gridItem.config.y--;
      }

      this.updateGridItem(gridItem);
    }
    // todo:perhaps  must sort after compact
  }
}
