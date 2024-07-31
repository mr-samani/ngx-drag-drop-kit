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
