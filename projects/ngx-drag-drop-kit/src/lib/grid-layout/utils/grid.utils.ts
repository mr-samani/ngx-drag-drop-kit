/**
 * TODO: https://github.com/katoid/angular-grid-layout/blob/main/projects/angular-grid-layout/src/lib/utils/grid.utils.ts
 */

import { GridItemComponent } from '../grid-item/grid-item.component';
import { FakeItem } from '../options/gride-item-config';

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

export function getFirstCollision(gridItems: GridItemComponent[], item: FakeItem): GridItemComponent | null {
  for (let i = 0, len = gridItems.length; i < len; i++) {
    if (collides(gridItems[i], item)) {
      console.log('first collession', gridItems[i]);
      return gridItems[i];
    }
  }
  return null;
}
/**
 * Given two GridItemComponent, check if they collide.
 */
export function collides(l1: GridItemComponent, l2: FakeItem): boolean {
  if (l1.el === l2.el) {
    return false;
  } // same element
  if (l1._config.x + l1._config.w <= l2.x) {
    return false;
  } // l1 is left of l2
  if (l1._config.x >= l2.x + l2.w) {
    return false;
  } // l1 is right of l2
  if (l1._config.y + l1._config.h <= l2.y) {
    return false;
  } // l1 is above l2
  if (l1._config.y >= l2.y + l2.h) {
    return false;
  } // l1 is below l2
  return true; // boxes overlap
}
