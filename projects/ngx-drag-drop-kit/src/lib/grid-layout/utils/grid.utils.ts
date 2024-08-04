/**
 * TODO: https://github.com/katoid/angular-grid-layout/blob/main/projects/angular-grid-layout/src/lib/utils/grid.utils.ts
 */

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
