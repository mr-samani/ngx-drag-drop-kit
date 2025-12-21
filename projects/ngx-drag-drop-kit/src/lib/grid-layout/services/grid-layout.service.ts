import { ComponentRef, Injectable, Renderer2, RendererFactory2, ViewContainerRef } from '@angular/core';
import { GridLayoutOptions } from '../options/options';
import { NgxGridItemComponent } from '../grid-item/grid-item.component';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

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
import { LayoutOutput } from '../options/layout-output';
import { mergeDeep } from '../../../utils/deep-merge';
import { NgxGridLayoutComponent } from '../grid-layout/grid-layout.component';

export const DEFAULT_GRID_ITEM_CONFIG = new GridItemConfig();
export const DEFAULT_GRID_LAYOUT_CONFIG = new GridLayoutOptions();

@Injectable()
export class GridLayoutService {
  public _options: GridLayoutOptions = DEFAULT_GRID_LAYOUT_CONFIG;
  public gridLayout!: NgxGridLayoutComponent;
  public _gridItems: NgxGridItemComponent[] = [];

  public _placeholderContainerRef!: ViewContainerRef;
  private placeHolder?: NgxGridItemComponent;
  private placeHolderRef?: ComponentRef<NgxGridItemComponent>;

  private updatePlaceholderPosition$ = new Subject<FakeItem>();
  private renderer: Renderer2;
  private _editMode: boolean = true;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.updatePlaceholderPosition$
      .pipe(
        distinctUntilChanged((prev, curr) => {
          return prev.x === curr.x && prev.y === curr.y && prev.w === curr.w && prev.h === curr.h;
        }),
        debounceTime(10)
      )
      .subscribe(input => {
        this.updatePlaceholderPosition(input);
      });
  }

  public get editMode(): boolean {
    return this._editMode;
  }

  public set editMode(value: boolean) {
    if (this._editMode !== value) {
      this._editMode = value;
      this.updateGridItemsEditMode();
    }
  }

  /**
   * Update edit mode for all grid items
   */
  private updateGridItemsEditMode(): void {
    this._gridItems.forEach(item => {
      item.setEditMode(this._editMode);
    });
  }

  public updateGridItem(item: NgxGridItemComponent): void {
    item.config = mergeDeep(DEFAULT_GRID_ITEM_CONFIG, item.config);
    item.width = gridWToScreenWidth(this.cellWidth, item.config.w, this._options.gap);
    item.height = gridHToScreenHeight(this.cellHeight, item.config.h, this._options.gap);
    item.left = gridXToScreenX(this.cellWidth, item.config.x, this._options.gap);
    item.top = gridYToScreenY(this.cellHeight, item.config.y, this._options.gap);
    item.updateView();
  }

  public get mainWidth(): number {
    const mainElRec = this.gridLayout.el.getBoundingClientRect();
    return mainElRec.width - (this._options.gap * 2 + this._options.gridBackgroundConfig.borderWidth * 2);
  }

  public get mainHeight(): number {
    const mainElRec = this.gridLayout.el.getBoundingClientRect();
    return mainElRec.height;
  }

  public get cellWidth(): number {
    const { cols, gap } = this._options;
    const widthExcludingGap = this.mainWidth - Math.max(gap * (cols - 1), 0);
    return widthExcludingGap / cols;
  }

  public get cellHeight(): number {
    if (typeof this._options.rowHeight === 'number') {
      return this._options.rowHeight;
    }
    return this.mainHeight;
  }

  public get getGridHeight(): number {
    const rowHeight = this.cellHeight;
    const gap = this._options.gap;
    const border = this._options.gridBackgroundConfig.borderWidth;

    const maxY = this._gridItems.reduce((acc, cur) => Math.max(acc, cur.config.y + cur.config.h), 0);

    return (
      rowHeight * maxY +
      gap * Math.max(maxY - 1, 0) +
      gap * 2 + // padding
      border * 2 // border
    );
  }

  onMoveOrResize(item: NgxGridItemComponent): void {
    const gridItemRec = item.el.getBoundingClientRect();
    const plcInfo = this.convertPointToCell(gridItemRec.left, gridItemRec.top, gridItemRec.width, gridItemRec.height);

    const fakeItem: FakeItem = {
      x: plcInfo.cellX,
      y: plcInfo.cellY,
      w: plcInfo.cellW,
      h: plcInfo.cellH,
      id: 'plc_' + item.id,
    };

    this.updatePlaceholderPosition$.next(fakeItem);
  }

  onMoveOrResizeEnd(item: NgxGridItemComponent): void {
    this.placeHolderRef?.destroy();

    if (this.placeHolder) {
      item.config.x = this.placeHolder.config.x;
      item.config.y = this.placeHolder.config.y;
      item.config.w = this.placeHolder.config.w;
      item.config.h = this.placeHolder.config.h;
    }

    this.updateGridItem(item);
    this.placeHolder = undefined;

    this.checkCollisions({ ...item.config, id: item.id });
    this.compactGridItems();
    this.calcLayout();
  }

  convertPointToCell(x: number, y: number, width: number, height: number) {
    const mainRec = this.gridLayout.el.getBoundingClientRect();
    const newX = x - mainRec.left;
    const newY = y - mainRec.top;

    let cellX = screenXToGridX(newX, this._options.cols, mainRec.width, this._options.gap);
    let cellY = screenYToGridY(newY, this.cellHeight, this._options.gap);
    let cellW = screenWidthToGridWidth(width, this._options.cols, mainRec.width, this._options.gap);
    let cellH = screenHeightToGridHeight(height, this.cellHeight, mainRec.height, this._options.gap);

    // Boundary checks
    if (cellX + cellW > this._options.cols) {
      cellX = Math.max(0, this._options.cols - cellW);
    }
    cellX = Math.max(0, cellX);
    cellY = Math.max(0, cellY);
    cellW = Math.max(1, cellW);
    cellH = Math.max(1, cellH);

    return { cellX, cellY, cellW, cellH };
  }

  /**
   * Update placeholder position and handle collisions
   */
  private updatePlaceholderPosition(fakeItem: FakeItem): void {
    if (!this.placeHolderRef || !this.placeHolder) {
      this.placeHolderRef = this._placeholderContainerRef.createComponent(NgxGridItemComponent);
      this.placeHolder = this.placeHolderRef.instance;
      this.placeHolder.el.className = 'grid-item-placeholder grid-item-placeholder-default';
      this.placeHolder.id = 'PLACEHOLDER_GRID_ITEM';
    }

    // Move placeholder up until it hits a collision or reaches top
    let targetY = fakeItem.y;
    while (targetY > 0) {
      const testItem = { ...fakeItem, y: targetY - 1 };
      const collision = getFirstCollision(this._gridItems, testItem);

      if (collision) {
        // If there's a collision, stay above it
        break;
      }
      targetY--;
    }

    this.placeHolder.config = new GridItemConfig(fakeItem.x, targetY, fakeItem.w, fakeItem.h);
    this.updateGridItem(this.placeHolder);

    // Push down items that collide with placeholder
    if (this._options.pushOnDrag) {
      this.checkCollisions(fakeItem);
    }

   // this.compactGridItems();
  }

  /**
   * Check and resolve collisions recursively
   */
  private checkCollisions(fakeItem: FakeItem): void {
    const collisions = getAllCollisions(this._gridItems, fakeItem);
    const movedItems = new Set<string>();

    for (const collision of collisions) {
      if (movedItems.has(collision.id!)) continue;

      const moved = this.moveGridItem(collision, fakeItem.y + fakeItem.h);
      movedItems.add(moved.id!);

      const movedFakeItem: FakeItem = {
        x: moved.config.x,
        y: moved.config.y,
        w: moved.config.w,
        h: moved.config.h,
        id: moved.id,
      };

      this.checkCollisions(movedFakeItem);
    }
  }

  /**
   * Move grid item to avoid collision
   */
  private moveGridItem(gridItem: NgxGridItemComponent, targetY: number): NgxGridItemComponent {
    if (!gridItem.isDraggingOrResizing) {
      gridItem.config.y = targetY;
      this.updateGridItem(gridItem);
    }
    return gridItem;
  }

  /**
   * Compact grid items - move items up when there's space
   */
  compactGridItems(): void {
    this._gridItems = sortGridItems(this._gridItems, 'vertical');

    for (const gridItem of this._gridItems) {
      if (gridItem.config.y <= 0 || gridItem.config.h <= 0) {
        continue;
      }

      // Skip if currently being dragged/resized
      if (gridItem.isDraggingOrResizing) {
        continue;
      }

      // Try to move item up
      let targetY = gridItem.config.y;
      while (targetY > 0) {
        const testItem: FakeItem = {
          x: gridItem.config.x,
          y: targetY - 1,
          w: gridItem.config.w,
          h: gridItem.config.h,
          id: gridItem.id,
        };

        const collision = getFirstCollision(this._gridItems, testItem);

        // Check collision with placeholder
        if (
          this.placeHolder &&
          collides(gridItem, {
            ...this.placeHolder.config,
            y: this.placeHolder.config.y,
            id: this.placeHolder.id,
          })
        ) {
          break;
        }

        if (collision) {
          break;
        }

        targetY--;
      }

      if (targetY !== gridItem.config.y) {
        gridItem.config.y = targetY;
        this.updateGridItem(gridItem);
      }
    }
  }

  /**
   * Calculate and emit layout changes
   */
  calcLayout(): void {
    const layout: LayoutOutput[] = this._gridItems.map(item => ({
      id: item.id,
      h: item.config.h,
      w: item.config.w,
      x: item.config.x,
      y: item.config.y,
    }));

    this.gridLayout.emitChangeLayout(layout);
  }
}
