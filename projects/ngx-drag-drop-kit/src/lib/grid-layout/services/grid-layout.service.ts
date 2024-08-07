import { ComponentRef, Inject, Injectable, Renderer2, RendererFactory2, ViewContainerRef } from '@angular/core';
import { GridLayoutOptions } from '../options/options';
import { GridItemComponent } from '../grid-item/grid-item.component';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import {
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
    item.left = gridXToScreenX(this.cellWidth, item.config.x, this._options.gap);
    item.top = gridYToScreenY(this.cellHeight, item.config.y, this._options.gap);
    item.width = gridWToScreenWidth(this.cellWidth, item.config.w, this._options.gap);
    item.height = gridHToScreenHeight(this.cellHeight, item.config.h, this._options.gap);
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
    const gridItemRec = item.el.getBoundingClientRect();
    // console.log(item.el, gridItemRec);
    let plcInfo = this.convertPointToCell(gridItemRec.left, gridItemRec.top, gridItemRec.width, gridItemRec.height);
    const fakeItem: FakeItem = {
      x: plcInfo.cellX,
      y: plcInfo.cellY,
      w: plcInfo.cellW,
      h: plcInfo.cellH,
      id: item.id,
    };
    // TODO: check available position
    //const firstCollission = getPreviusY(this._gridItems, fakeItem);
    //fakeItem.y = firstCollission;

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
    this.compactGridItems();
    this.placeHolder = undefined;
    console.log(this._gridItems.map((x) => x.id));
  }

  convertPointToCell(x: number, y: number, width: number, height: number) {
    const mainRec = this._mainEl.getBoundingClientRect();
    const newX = x - mainRec.left;
    const newY = y - mainRec.top;
    const cellX = screenXToGridX(newX, this._options.cols, mainRec.width, this._options.gap);
    const cellY = screenYToGridY(newY, this.cellHeight, this._options.gap);
    const cellW = screenWidthToGridWidth(width, this._options.cols, mainRec.width, this._options.gap);
    const cellH = screenHeightToGridHeight(height, this.cellHeight, mainRec.height, this._options.gap);
    return { cellX, cellY, cellW, cellH };
  }

  /**
   * update place holder position
   * @param input
   */
  private updatePlaceholderPosition(fakeItem: FakeItem) {
    // console.log(input);
    // this.undoMovedCollisions();

    this.cehckCollesions(fakeItem);
    if (!this.placeHolderRef || !this.placeHolder) {
      this.placeHolderRef = this._placeholderContainerRef.createComponent(GridItemComponent);
      this.placeHolder = this.placeHolderRef.instance;
      this.placeHolder.el.className = 'grid-item-placeholder grid-item-placeholder-default';
    }
    this.placeHolder.config = new GridItemConfig(fakeItem.x, fakeItem.y, fakeItem.w, fakeItem.h);
    this.updateGridItem(this.placeHolder);
  }

  cehckCollesions(fakeItem: FakeItem) {
    const allCollisions = getAllCollisions(this._gridItems, fakeItem);

    for (let c of allCollisions) {
      let movedElement = this.moveGridItem(c, fakeItem.x + fakeItem.w, fakeItem.y + fakeItem.h);
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

  // undoMovedCollisions() {
  //   for (let item of this._gridItems) {
  //     if (this.placeHolder) {
  //       if (collides(item, { ...this.placeHolder.config, id: this.placeHolder.id }) == false) {
  //         this.compactGridItem(item);
  //       }
  //     } else {
  //       this.compactGridItem(item);
  //     }
  //   }
  // }

  private moveGridItem(gridItem: GridItemComponent, cellX: number, cellY: number) {
    gridItem.config.y = cellY;
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
        log('shift up');
        fakeItem.y--;
        gridItem.config.y--;
      }
      this.updateGridItem(gridItem);
    }
    // todo:perhaps  must sort after compact
  }
}
