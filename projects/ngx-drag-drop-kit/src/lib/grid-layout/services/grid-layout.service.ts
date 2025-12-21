import {
  ComponentRef,
  Injectable,
  OnDestroy,
  Renderer2,
  RendererFactory2,
  ViewContainerRef,
} from '@angular/core';
import { GridLayoutOptions } from '../options/options';
import { NgxGridItemComponent } from '../grid-item/grid-item.component';
import { BehaviorSubject, Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

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

interface PlaceholderUpdate {
  x: number;
  y: number;
  w: number;
  h: number;
  timestamp: number;
}

@Injectable()
export class GridLayoutService implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly placeholderUpdate$ = new Subject<FakeItem>();
  private readonly gridHeightSubject$ = new BehaviorSubject<number>(0);
  
  public readonly gridHeight$ = this.gridHeightSubject$.asObservable();

  private _options: GridLayoutOptions = DEFAULT_GRID_LAYOUT_CONFIG;
  private gridLayout?: NgxGridLayoutComponent;
  private gridItems: NgxGridItemComponent[] = [];
  private placeholderContainerRef?: ViewContainerRef;
  private placeholder?: NgxGridItemComponent;
  private placeholderRef?: ComponentRef<NgxGridItemComponent>;
  private renderer: Renderer2;
  private cachedCellWidth = 0;
  private cachedCellHeight = 0;
  private cachedMainWidth = 0;
  private draggedItem?: NgxGridItemComponent;

  public editMode = true;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.setupPlaceholderUpdates();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  public cleanup(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyPlaceholder();
    this.gridHeightSubject$.complete();
  }

  private setupPlaceholderUpdates(): void {
    this.placeholderUpdate$
      .pipe(
        distinctUntilChanged((prev, curr) =>
          prev.x === curr.x &&
          prev.y === curr.y &&
          prev.w === curr.w &&
          prev.h === curr.h
        ),
        debounceTime(10),
        takeUntil(this.destroy$)
      )
      .subscribe(fakeItem => {
        this.updatePlaceholderPosition(fakeItem);
      });
  }

  // Public API
  public setGridLayout(layout: NgxGridLayoutComponent): void {
    this.gridLayout = layout;
  }

  public setGridItems(items: NgxGridItemComponent[]): void {
    this.gridItems = items;
  }

  public getGridItems(): NgxGridItemComponent[] {
    return this.gridItems;
  }

  public setPlaceholderContainer(container: ViewContainerRef): void {
    this.placeholderContainerRef = container;
  }

  public get options(): GridLayoutOptions {
    return this._options;
  }

  public set options(val: GridLayoutOptions) {
    this._options = val;
    this.invalidateCache();
  }

  // Cache management
  private invalidateCache(): void {
    this.cachedCellWidth = 0;
    this.cachedCellHeight = 0;
    this.cachedMainWidth = 0;
  }

  // Dimension calculations
  private get mainWidth(): number {
    if (this.cachedMainWidth > 0) {
      return this.cachedMainWidth;
    }

    if (!this.gridLayout) {
      return 0;
    }

    const mainElRec = this.gridLayout.getElement().getBoundingClientRect();
    const bgConfig = this._options.gridBackgroundConfig;
    this.cachedMainWidth =
      mainElRec.width - (this._options.gap * 2 + bgConfig.borderWidth * 2);
    return this.cachedMainWidth;
  }

  private get cellWidth(): number {
    if (this.cachedCellWidth > 0) {
      return this.cachedCellWidth;
    }

    const { cols, gap } = this._options;
    const widthExcludingGap = this.mainWidth - Math.max(gap * (cols - 1), 0);
    this.cachedCellWidth = widthExcludingGap / cols;
    return this.cachedCellWidth;
  }

  private get cellHeight(): number {
    if (this.cachedCellHeight > 0) {
      return this.cachedCellHeight;
    }

    if (typeof this._options.rowHeight === 'number') {
      this.cachedCellHeight = this._options.rowHeight;
      return this.cachedCellHeight;
    }

    // Fallback to container height
    if (this.gridLayout) {
      const mainElRec = this.gridLayout.getElement().getBoundingClientRect();
      this.cachedCellHeight = mainElRec.height;
      return this.cachedCellHeight;
    }

    return 100; // Default fallback
  }

  private calculateGridHeight(): number {
    const rowHeight = this.cellHeight;
    const gap = this._options.gap;
    const border = this._options.gridBackgroundConfig.borderWidth;

    const maxRow = this.gridItems.reduce(
      (max, item) => Math.max(max, item.config.y + item.config.h),
      0
    );

    return (
      rowHeight * maxRow +
      gap * Math.max(maxRow - 1, 0) +
      gap * 2 +
      border * 2
    );
  }

  private updateGridHeight(): void {
    const height = this.calculateGridHeight();
    this.gridHeightSubject$.next(height);
  }

  // Grid item management
  public updateGridItem(item: NgxGridItemComponent, animate = true): void {
    if (!item.config) {
      console.error('[GridLayoutService] Item config is undefined', item);
      return;
    }

    item.config = mergeDeep(DEFAULT_GRID_ITEM_CONFIG, item.config);

    const width = gridWToScreenWidth(this.cellWidth, item.config.w, this._options.gap);
    const height = gridHToScreenHeight(this.cellHeight, item.config.h, this._options.gap);
    const left = gridXToScreenX(this.cellWidth, item.config.x, this._options.gap);
    const top = gridYToScreenY(this.cellHeight, item.config.y, this._options.gap);

    item.updatePosition(left, top, width, height, animate);
  }

  // Drag and resize handlers
  public onDragOrResizeStart(item: NgxGridItemComponent): void {
    this.draggedItem = item;
    this.invalidateCache();
  }

  public onMoveOrResize(item: NgxGridItemComponent): void {
    const rect = item.el.getBoundingClientRect();
    const cellPos = this.convertPointToCell(
      rect.left,
      rect.top,
      rect.width,
      rect.height
    );

    const fakeItem: FakeItem = {
      x: cellPos.cellX,
      y: cellPos.cellY,
      w: cellPos.cellW,
      h: cellPos.cellH,
      id: `placeholder-${item.id}`,
    };

    this.placeholderUpdate$.next(fakeItem);
  }

  public onMoveOrResizeEnd(item: NgxGridItemComponent): void {
    if (this.placeholder) {
      item.setConfig(this.placeholder.config);
    }

    this.updateGridItem(item);
    this.destroyPlaceholder();

    this.checkCollisions({ ...item.config, id: item.id! });
    this.compactGridItems();
    this.calculateLayout();
    
    this.draggedItem = undefined;
  }

  private convertPointToCell(
    x: number,
    y: number,
    width: number,
    height: number
  ): { cellX: number; cellY: number; cellW: number; cellH: number } {
    if (!this.gridLayout) {
      return { cellX: 0, cellY: 0, cellW: 1, cellH: 1 };
    }

    const mainRec = this.gridLayout.getElement().getBoundingClientRect();
    const relX = x - mainRec.left;
    const relY = y - mainRec.top;

    let cellX = screenXToGridX(relX, this._options.cols, mainRec.width, this._options.gap);
    let cellY = screenYToGridY(relY, this.cellHeight, this._options.gap);
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

  // Placeholder management
  private updatePlaceholderPosition(fakeItem: FakeItem): void {
    if (!this.placeholderContainerRef) {
      return;
    }

    if (!this.placeholderRef || !this.placeholder) {
      this.createPlaceholder();
    }

    if (!this.placeholder) {
      return;
    }

    // Snap to top-most available position
    while (
      fakeItem.y > 0 &&
      !getFirstCollision(this.gridItems, { ...fakeItem, y: fakeItem.y - 1 })
    ) {
      fakeItem.y--;
    }

    this.placeholder.config = new GridItemConfig(
      fakeItem.x,
      fakeItem.y,
      fakeItem.w,
      fakeItem.h
    );

    this.updateGridItem(this.placeholder, false);
    this.compactGridItems();
  }

  private createPlaceholder(): void {
    if (!this.placeholderContainerRef) {
      return;
    }

    this.placeholderRef = this.placeholderContainerRef.createComponent(
      NgxGridItemComponent
    );
    this.placeholder = this.placeholderRef.instance;
    this.placeholder.el.className = 'grid-item-placeholder grid-item-placeholder-default';
    this.placeholder.id = 'PLACEHOLDER';
    this.placeholder.disableDragAndResize();
  }

  private destroyPlaceholder(): void {
    this.placeholderRef?.destroy();
    this.placeholderRef = undefined;
    this.placeholder = undefined;
  }

  // Collision detection and resolution
  private checkCollisions(fakeItem: FakeItem): void {
    const collisions = getAllCollisions(this.gridItems, fakeItem);

    for (const collision of collisions) {
      if (collision.id === fakeItem.id || collision.isDraggingOrResizing) {
        continue;
      }

      const movedItem = this.moveGridItem(
        collision,
        fakeItem.y + fakeItem.h
      );

      const movedFakeItem: FakeItem = {
        x: movedItem.config.x,
        y: movedItem.config.y,
        w: movedItem.config.w,
        h: movedItem.config.h,
        id: movedItem.id!,
      };

      this.checkCollisions(movedFakeItem);
    }
  }

  private moveGridItem(
    item: NgxGridItemComponent,
    targetY: number
  ): NgxGridItemComponent {
    if (!item.isDraggingOrResizing) {
      item.config.y = targetY;
      this.updateGridItem(item);
    }
    return item;
  }

  // Compaction algorithm
  public compactGridItems(): void {
    this.gridItems = sortGridItems(this.gridItems, 'vertical');

    for (const item of this.gridItems) {
      if (item.config.y <= 0 || item.config.h <= 0) {
        continue;
      }

      // Try to move item up as much as possible
      let targetY = item.config.y;

      while (targetY > 0) {
        const testItem: FakeItem = {
          x: item.config.x,
          y: targetY - 1,
          w: item.config.w,
          h: item.config.h,
          id: item.id!,
        };

        // Check for collisions
        if (getFirstCollision(this.gridItems, testItem)) {
          break;
        }

        // Check for placeholder collision
        if (
          item.isDraggingOrResizing ||
          (this.placeholder &&
            collides(item, {
              ...this.placeholder.config,
              y: this.placeholder.config.y + 1,
              id: this.placeholder.id!,
            }))
        ) {
          break;
        }

        targetY--;
      }

      if (targetY !== item.config.y) {
        item.config.y = targetY;
        this.updateGridItem(item);
      }
    }

    this.updateGridHeight();
  }

  // Layout calculation
  private calculateLayout(): void {
    if (!this.gridLayout) {
      return;
    }

    const layout: LayoutOutput[] = this.gridItems.map(item => ({
      id: item.id!,
      x: item.config.x,
      y: item.config.y,
      w: item.config.w,
      h: item.config.h,
    }));

    this.gridLayout.emitChangeLayout(layout);
  }
}