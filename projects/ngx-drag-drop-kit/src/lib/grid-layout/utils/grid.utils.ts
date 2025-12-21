import { NgxGridItemComponent } from '../grid-item/grid-item.component';
import { FakeItem } from '../options/gride-item-config';
import { CompactType } from '../options/options';

/**
 * Convert screen X position to grid X coordinate
 */
export function screenXToGridX(screenXPos: number, cols: number, gridWidth: number, gap: number): number {
  const widthMinusGaps = gridWidth - gap * (cols - 1);
  const itemWidth = widthMinusGaps / cols;
  const widthMinusOneItem = gridWidth - itemWidth;
  const colWidthWithGap = widthMinusOneItem / (cols - 1);
  return Math.round(screenXPos / colWidthWithGap);
}

/**
 * Convert screen Y position to grid Y coordinate
 */
export function screenYToGridY(screenYPos: number, rowHeight: number, gap: number): number {
  return Math.round(screenYPos / (rowHeight + gap));
}

/**
 * Convert grid X coordinate to screen X position
 */
export function gridXToScreenX(cellWidth: number, x: number, gap: number): number {
  return cellWidth * x + gap * (x + 1);
}

/**
 * Convert grid Y coordinate to screen Y position
 */
export function gridYToScreenY(cellHeight: number, y: number, gap: number): number {
  return cellHeight * y + gap * (y + 1);
}

/**
 * Convert screen width to grid width
 */
export function screenWidthToGridWidth(gridScreenWidth: number, cols: number, width: number, gap: number): number {
  const widthMinusGaps = width - gap * (cols - 1);
  const itemWidth = widthMinusGaps / cols;
  const gridScreenWidthMinusFirst = gridScreenWidth - itemWidth;
  return Math.round(gridScreenWidthMinusFirst / (itemWidth + gap)) + 1;
}

/**
 * Convert screen height to grid height
 */
export function screenHeightToGridHeight(
  gridScreenHeight: number,
  rowHeight: number,
  height: number,
  gap: number
): number {
  const gridScreenHeightMinusFirst = gridScreenHeight - rowHeight;
  return Math.round(gridScreenHeightMinusFirst / (rowHeight + gap)) + 1;
}

/**
 * Convert grid width to screen width
 */
export function gridWToScreenWidth(cellWidth: number, w: number, gap: number): number {
  return Math.max(0, cellWidth * w + gap * (w - 1));
}

/**
 * Convert grid height to screen height
 */
export function gridHToScreenHeight(cellHeight: number, h: number, gap: number): number {
  return Math.max(0, cellHeight * h + gap * (h - 1));
}

/**
 * Get all grid items that collide with the given item
 */
export function getAllCollisions(gridItems: NgxGridItemComponent[], item: FakeItem): NgxGridItemComponent[] {
  return gridItems.filter(l => collides(l, item));
}

/**
 * Get the first grid item that collides with the given item
 * Only returns items that are not currently being dragged/resized
 */
export function getFirstCollision(gridItems: NgxGridItemComponent[], item: FakeItem): NgxGridItemComponent | null {
  for (let i = 0; i < gridItems.length; i++) {
    const gridItem = gridItems[i];
    
    if (collides(gridItem, item) && !gridItem.isDraggingOrResizing) {
      return gridItem;
    }
  }
  return null;
}

/**
 * Check if two grid items collide
 */
export function collides(l1: NgxGridItemComponent, l2: FakeItem): boolean {
  // Same element
  if (l1.id === l2.id) {
    return false;
  }
  
  // l1 is left of l2
  if (l1.config.x + l1.config.w <= l2.x) {
    return false;
  }
  
  // l1 is right of l2
  if (l1.config.x >= l2.x + l2.w) {
    return false;
  }
  
  // l1 is above l2
  if (l1.config.y + l1.config.h <= l2.y) {
    return false;
  }
  
  // l1 is below l2
  if (l1.config.y >= l2.y + l2.h) {
    return false;
  }
  
  // Boxes overlap
  return true;
}

/**
 * Sort grid items based on compact type
 */
export function sortGridItems(grid: NgxGridItemComponent[], compactType: CompactType): NgxGridItemComponent[] {
  if (compactType === 'horizontal') {
    return sortGridItemsByColRow(grid);
  } else {
    return sortGridItemsByRowCol(grid);
  }
}

/**
 * Sort grid items by row then column (top to bottom, left to right)
 */
export function sortGridItemsByRowCol(grid: NgxGridItemComponent[]): NgxGridItemComponent[] {
  return [...grid].sort((a, b) => {
    if (a.config.y > b.config.y || (a.config.y === b.config.y && a.config.x > b.config.x)) {
      return 1;
    } else if (a.config.y === b.config.y && a.config.x === b.config.x) {
      return 0;
    }
    return -1;
  });
}

/**
 * Sort grid items by column then row (left to right, top to bottom)
 */
export function sortGridItemsByColRow(grid: NgxGridItemComponent[]): NgxGridItemComponent[] {
  return [...grid].sort((a, b) => {
    if (a.config.x > b.config.x || (a.config.x === b.config.x && a.config.y > b.config.y)) {
      return 1;
    }
    return -1;
  });
}