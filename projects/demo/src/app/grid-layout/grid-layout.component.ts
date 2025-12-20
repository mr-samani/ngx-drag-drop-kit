import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GridItemConfig, IGridLayoutOptions, NgxGridLayoutModule } from '@ngx-drag-drop-kit';

@Component({
  selector: 'app-grid-layout',
  imports: [CommonModule, FormsModule, NgxGridLayoutModule],
  templateUrl: './grid-layout.component.html',
  styleUrl: './grid-layout.component.scss',
})
export class NgxGridLayoutComponent {
  editMode = true;
  options: IGridLayoutOptions = {
    cols: 12,
    gap: 10,
    gridBackgroundConfig: {
      borderWidth: 1,
    },
  };

  layouts: DashboardItem[] = [];
  // [
  //   { config: new GridItemConfig(3, 0, 2, 3) },
  //   { config: new GridItemConfig(5, 3, 2, 4) },
  //   { config: new GridItemConfig(0, 6, 2, 2) },
  //   { config: new GridItemConfig(0, 7, 1, 1) },
  //   { config: new GridItemConfig(9, 3, 2, 10) },
  //   { config: new GridItemConfig(0,12, 3, 3) },
  // ];

  add() {
    let x = this.getRandomH(),
      y = this.getRandomV(),
      w = Math.max(1, Math.min(12 - x, this.getRandomH())),
      h = Math.max(1, Math.min(10 - y, this.getRandomV()));
    let config = new GridItemConfig(x, y, w, h);

    this.layouts.push({ config, id: 'GritItem_' + (this.layouts.length + 1) });
  }

  private getRandomH() {
    return Math.min(this.options.cols - 1, Math.round(Math.random() * this.options.cols));
  }
  private getRandomV() {
    return Math.round(Math.random() * 10);
  }

  add10() {
    for (let i = 0; i < 10; i++) {
      this.add();
    }
  }

  clear() {
    this.layouts = [];
  }

  addInFirst() {
    let config = new GridItemConfig(0, 0, 2, 3);
    this.layouts.push({ config, id: 'addedToFirst' });
  }

  onLayoutChange(ev: GridItemConfig[]) {
    console.log('layouts', ev);
  }
}

export interface DashboardItem {
  config: GridItemConfig;
  id?: string;
}
