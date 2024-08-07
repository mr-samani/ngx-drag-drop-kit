/**
 * TODO: https://github.com/katoid/angular-grid-layout/blob/main/projects/angular-grid-layout/src/lib/utils/grid.utils.ts
 */

import { GridItemComponent } from '../grid-item/grid-item.component';
import { FakeItem } from '../options/gride-item-config';
import { CompactType } from '../options/options';
import { log } from './log';

export function screenXToGridX(screenXPos: number, cols: number, gridWidth: number, gap: number): number {
  const widthMinusGaps = gridWidth - gap * (cols - 1);
  const itemWidth = widthMinusGaps / cols;
  const widthMinusOneItem = gridWidth - itemWidth;
  const colWidthWithGap = widthMinusOneItem / (cols - 1);
  return Math.round(screenXPos / colWidthWithGap);
}

export function screenYToGridY(screenYPos: number, rowHeight: number, gap: number): number {
  return Math.round(screenYPos / (rowHeight + gap));
}

export function gridXToScreenX(cellWidth: number, x: number, gap: number) {
  const gridX = cellWidth * x + gap * (x + 1);
  return gridX;
}

export function gridYToScreenY(cellHeight: number, y: number, gap: number) {
  const gridY = cellHeight * y + gap * (y + 1);
  return gridY;
}

/*---------------------------------------------------------*/

export function screenWidthToGridWidth(gridScreenWidth: number, cols: number, width: number, gap: number): number {
  const widthMinusGaps = width - gap * (cols - 1);
  const itemWidth = widthMinusGaps / cols;
  const gridScreenWidthMinusFirst = gridScreenWidth - itemWidth;
  return Math.round(gridScreenWidthMinusFirst / (itemWidth + gap)) + 1;
}

export function screenHeightToGridHeight(
  gridScreenHeight: number,
  rowHeight: number,
  height: number,
  gap: number
): number {
  const gridScreenHeightMinusFirst = gridScreenHeight - rowHeight;
  return Math.round(gridScreenHeightMinusFirst / (rowHeight + gap)) + 1;
}

export function gridWToScreenWidth(cellWidth: number, w: number, gap: number) {
  const width = cellWidth * w + gap * (w - 1);
  return width;
}

export function gridHToScreenHeight(cellHeight: number, h: number, gap: number) {
  const height = cellHeight * h + gap * (h - 1);
  return height;
}

/*------------------------------------------------------------------------------*/
export function getAllCollisions(gridItems: GridItemComponent[], item: FakeItem): Array<GridItemComponent> {
  return gridItems.filter((l) => collides(l, item));
}

/**
 * get collides from pprevious item
 * @param gridItems   sorted grid items
 * @param item
 * @returns
 */
export function getPreviusY(gridItems: GridItemComponent[], item: FakeItem): number {
  const m1 = item.x;
  const m2 = item.x + item.w;
  const verticalCollissions = gridItems.filter((x) => {
    const x1 = x.config.x;
    const x2 = x.config.x + x.config.w;
    return (
      // collides by left side
      (x1 <= m1 && x2 > m1) ||
      // collide by right side
      (x1 <= m1 && x2 > m2) ||
      // collide in inset
      (x1 >= m1 && x2 < m2) ||
      // is greather than item
      (x1 <= m1 && x2 > m2)
    );
  });

  const selfIndex = verticalCollissions.findIndex((x) => x.id == item.id);
  log('verticalCollissions', verticalCollissions.map((m) => m.id).join(' , '));

  if (selfIndex > 0) {
    const prv = verticalCollissions[selfIndex - 1];
    log('first collession:', item.id, ' with: ', prv.id, ' =>', prv.config.y + prv.config.h);
 
    return prv.config.y + prv.config.h;
  }
  return 0; //item.y;
}
/**
 * Given two GridItemComponent, check if they collide.
 */
export function collides(l1: GridItemComponent, l2: FakeItem): boolean {
  if (l1.id === l2.id) {
    return false;
  } // same element
  if (l1.config.x + l1.config.w <= l2.x) {
    return false;
  } // l1 is left of l2
  if (l1.config.x >= l2.x + l2.w) {
    return false;
  } // l1 is right of l2
  if (l1.config.y + l1.config.h <= l2.y) {
    return false;
  } // l1 is above l2
  if (l1.config.y >= l2.y + l2.h) {
    return false;
  } // l1 is below l2
  return true; // boxes overlap
}

/*---------------------------------------------------------------------------------------------------------*/

/**
 * Get grid items sorted from top left to right and down.
 *
 * @return {Array} Array of grid objects.
 * @return {Array}        grid, sorted static items first.
 */
export function sortGridItems(grid: GridItemComponent[], compactType: CompactType): GridItemComponent[] {
  if (compactType === 'horizontal') {
    return sortGridItemsByColRow(grid);
  } else {
    return sortGridItemsByRowCol(grid);
  }
}

export function sortGridItemsByRowCol(grid: GridItemComponent[]): GridItemComponent[] {
  return grid.sort((a, b) => {
    if (a.config.y > b.config.y || (a.config.y === b.config.y && a.config.x > b.config.x)) {
      return 1;
    } else if (a.config.y === b.config.y && a.config.x === b.config.x) {
      // Without this, we can get different sort results in IE vs. Chrome/FF
      return 0;
    }
    return -1;
  });
}

export function sortGridItemsByColRow(grid: GridItemComponent[]): GridItemComponent[] {
  return grid.sort((a, b) => {
    if (a.config.x > b.config.x || (a.config.x === b.config.x && a.config.y > b.config.y)) {
      return 1;
    }
    return -1;
  });
}
