export interface IGridLayoutOptions {
  cols: number;
  rowHeight?: 'fit' | number;
  gap?: number;
  gridBackgroundConfig?: IGridBackgroundCfg;

  //TODO : add responsive layout
  // breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
  // cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}

  /* If true, grid can be placed one over the other.
   * If set, implies `preventCollision`.
   */
  // allowOverlap: ?boolean = false,
}
export class GridLayoutOptions implements IGridLayoutOptions {
  cols = 12;
  rowHeight: 'fit' | number = 50;
  gap: number = 5;
  gridBackgroundConfig: Required<IGridBackgroundCfg> = {
    show: 'always',
    borderColor: 'rgba(255, 128, 0, 0.25)',
    gapColor: 'transparent',
    borderWidth: 1,
    rowColor: 'rgba(128, 128, 128, 0.10)',
    columnColor: 'rgba(128, 128, 128, 0.10)',
  };
}

export interface IGridBackgroundCfg {
  show?: 'never' | 'always' | 'whenDragging';
  borderColor?: string;
  gapColor?: string;
  rowColor?: string;
  columnColor?: string;
  borderWidth?: number;
}
