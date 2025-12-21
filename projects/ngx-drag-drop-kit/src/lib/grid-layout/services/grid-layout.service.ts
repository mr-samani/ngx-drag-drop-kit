import { ComponentRef, Injectable, Renderer2, RendererFactory2, ViewContainerRef } from '@angular/core';
import { GridLayoutOptions } from '../options/options';
import { NgxGridItemComponent } from '../grid-item/grid-item.component';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import {
  collides,
  getAllCollisions,
  getFirstCollision,
  getFirstCollisionOnAbove,
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
      // Apply placeholder position to the dragged item
      item.config.x = this.placeHolder.config.x;
      item.config.y = this.placeHolder.config.y;
      item.config.w = this.placeHolder.config.w;
      item.config.h = this.placeHolder.config.h;
    }

    this.updateGridItem(item);
    this.placeHolder = undefined;

    // Now resolve collisions and compact
    this.resolveCollisionsAfterDrop(item);
    this.compactGridItems();
    this.calcLayout();
  }

  /**
   * Resolve collisions after an item is dropped
   * Only pushes items down that directly collide with the dropped item
   */
  private resolveCollisionsAfterDrop(droppedItem: NgxGridItemComponent): void {
    const directCollisions = getAllCollisions(this._gridItems, {
      x: droppedItem.config.x,
      y: droppedItem.config.y,
      w: droppedItem.config.w,
      h: droppedItem.config.h,
      id: droppedItem.id,
    });

    // Sort collisions by Y position (top to bottom)
    const sortedCollisions = directCollisions.sort((a, b) => a.config.y - b.config.y);

    // Push each colliding item down
    for (const collision of sortedCollisions) {
      if (collision.id === droppedItem.id) continue;

      // Move the colliding item just below the dropped item
      const newY = droppedItem.config.y + droppedItem.config.h;
      if (collision.config.y < newY) {
        collision.config.y = newY;
        this.updateGridItem(collision);

        // Recursively resolve any new collisions this created
        this.resolveCollisionsAfterDrop(collision);
      }
    }
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
   * Update placeholder position - only moves placeholder, doesn't push other items
   */
  private updatePlaceholderPosition(fakeItem: FakeItem): void {
    if (!this.placeHolderRef || !this.placeHolder) {
      this.placeHolderRef = this._placeholderContainerRef.createComponent(NgxGridItemComponent);
      this.placeHolder = this.placeHolderRef.instance;
      this.placeHolder.el.className = 'grid-item-placeholder grid-item-placeholder-default';
      this.placeHolder.id = 'PLACEHOLDER_GRID_ITEM';
    }

    // Find the highest valid position for the placeholder
    let targetY = fakeItem.y;

    // Move placeholder up until it hits a collision or reaches top
    while (targetY > 0) {
      const testItem: FakeItem = {
        ...fakeItem,
        y: targetY - 1,
        id: this.placeHolder.id,
      };

      // چک کن آیتمی که زیر placeholder هست و باهاش collision افقی داره
      const itemBelow = getFirstCollisionOnAbove(this._gridItems, testItem);

      if (itemBelow) {
        // آیتمی پیدا شد، placeholder باید درست بالای اون باشه
        targetY = itemBelow.config.y + itemBelow.config.h;
        break;
      }

      targetY--;
    }

    // Update placeholder without triggering item movements
    this.placeHolder.config = new GridItemConfig(fakeItem.x, targetY, fakeItem.w, fakeItem.h);
    this.updateGridItem(this.placeHolder);

    this.compactGridItems();
  }
  


  /**
   * Compact grid items - move items up when there's space
   * Respects the placeholder position during drag
   */
  compactGridItems(): void {
    this._gridItems = sortGridItems(this._gridItems);

    for (const gridItem of this._gridItems) {
      // Skip invalid items
      if (gridItem.config.y <= 0 || gridItem.config.h <= 0) {
        continue;
      }

      // Skip if currently being dragged/resized
      if (gridItem.isDraggingOrResizing) {
        continue;
      }

      // Try to move item up as much as possible
      let targetY = gridItem.config.y;

      while (targetY > 0) {
        const testItem: FakeItem = {
          x: gridItem.config.x,
          y: targetY - 1,
          w: gridItem.config.w,
          h: gridItem.config.h,
          id: gridItem.id,
        };

        // Check collision with other items
        const collision = getFirstCollision(this._gridItems, testItem);
        if (collision) {
          break;
        }

        // Check collision with placeholder (if it exists)
        if (this.placeHolder) {
          const placeholderCollision = collides(
            {
              id: gridItem.id,
              config: { ...testItem },
              isDraggingOrResizing: false,
            } as any,
            {
              x: this.placeHolder.config.x,
              y: this.placeHolder.config.y,
              w: this.placeHolder.config.w,
              h: this.placeHolder.config.h,
              id: this.placeHolder.id,
            }
          );

          if (placeholderCollision) {
            break;
          }
        }

        targetY--;
      }

      // Only update if position changed
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
