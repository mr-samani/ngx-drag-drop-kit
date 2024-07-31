import { Component } from '@angular/core';
import { GridLayoutModule } from '../../../../ngx-drag-drop-kit/src/lib/grid-layout/grid-layout.module';
import {
  GridLayoutOptions,
  IGridLayoutOptions,
} from '../../../../ngx-drag-drop-kit/src/lib/grid-layout/options/options';
import { GridItemConfig } from '../../../../ngx-drag-drop-kit/src/lib/grid-layout/options/gride-item-config';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-grid-layout',
  standalone: true,
  imports: [CommonModule, GridLayoutModule],
  templateUrl: './grid-layout.component.html',
  styleUrl: './grid-layout.component.scss',
})
export class GridLayoutComponent {
  options: IGridLayoutOptions = {
    cols: 12,
    gap:10,
    gridBackgroundConfig:{
      borderWidth:1,
    }
  };

  layouts: DashboardItem[] = [
    { config: new GridItemConfig(0, 0, 1, 1) },
    { config: new GridItemConfig(3, 0, 2, 3) },
    { config: new GridItemConfig(5, 0, 2, 4) },
    { config: new GridItemConfig(0, 6, 2, 2) },
    { config: new GridItemConfig(9, 3, 2, 10) },
    { config: new GridItemConfig(0,12, 3, 3) },
  ];
}

export interface DashboardItem {
  config: GridItemConfig;
  title?: string;
}
