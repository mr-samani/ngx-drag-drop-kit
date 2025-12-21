import { Component, OnInit, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  GridItemConfig,
  IGridLayoutOptions,
  LayoutOutput,
  NgxGridLayoutComponent,
  NgxGridLayoutModule,
} from '@ngx-drag-drop-kit';
export interface SampleLayout {
  id: string;
  type: string;
  icon?: string;
  title: string;
  description: string;
  config: GridItemConfig;
}
@Component({
  selector: 'app-grid-layout',
  imports: [CommonModule, FormsModule, NgxGridLayoutModule],
  templateUrl: './grid-layout.component.html',
  styleUrl: './grid-layout.component.scss',
})
export class DemoNgxGridLayoutComponent implements OnInit {
  ngxGridLayout = viewChild<NgxGridLayoutComponent>('ngxGridLayout');
  gridSettings = {
    editMode: true,
    pushOnDrag: true,
  };

  gridOptions: IGridLayoutOptions = {
    cols: 12,
    rowHeight: 80,
    gap: 10,
    gridBackgroundConfig: {
      borderWidth: 1,
      borderColor: '#e0e0e0',
      gapColor: '#f5f5f5',
      rowColor: 'rgba(0,0,0,0.02)',
      columnColor: 'rgba(0,0,0,0.02)',
    },
  };

  items: SampleLayout[] = [];

  DEFAULT_ITEMS: SampleLayout[] = [
    {
      id: 'chart-1',
      type: 'chart',
      icon: '📊',
      title: 'Sales chart',
      description: 'Monthly sales statistics',
      config: new GridItemConfig(0, 0, 6, 3),
    },
    {
      id: 'stats-1',
      type: 'stats',
      icon: '📈',
      title: 'Total statistics',
      description: 'Information',
      config: new GridItemConfig(6, 0, 3, 2),
    },
    {
      id: 'info-1',
      type: 'info',
      icon: 'ℹ️',
      title: 'Info statistics',
      description: 'Details',
      config: new GridItemConfig(9, 0, 3, 2),
    },
    {
      id: 'content-1',
      type: 'content',
      icon: '📝',
      title: 'Content statistics',
      description: 'Content and information',
      config: new GridItemConfig(0, 3, 4, 2),
    },
    {
      id: 'chart-2',
      type: 'chart',
      icon: '📉',
      title: 'Cost chart',
      description: 'Cost analysis',
      config: new GridItemConfig(4, 3, 4, 2),
    },
    {
      id: 'stats-2',
      type: 'stats',
      icon: '💰',
      title: 'Income',
      description: 'Total income',
      config: new GridItemConfig(8, 3, 4, 2),
    },
  ];

  ngOnInit(): void {
    this.items = JSON.parse(JSON.stringify(this.DEFAULT_ITEMS));
    this.loadLayout();
  }

  onLayoutChange(layout: LayoutOutput[]): void {
    console.log('📐 Layout changed:', layout);
    // اعمال layout به items
    layout.forEach(layoutItem => {
      const item = this.items.find(i => i.id === layoutItem.id);
      if (item) {
        item.config = new GridItemConfig(layoutItem.x, layoutItem.y, layoutItem.w, layoutItem.h);
      }
    });
    // ذخیره‌سازی خودکار
    this.saveLayout();
  }

  /**
   * ذخیره Layout
   */
  private saveLayout(): void {
    try {
      localStorage.setItem(
        'advanced-grid-layout',
        JSON.stringify({
          items: this.items,
          options: this.gridOptions,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.error('Error on save:', e);
    }
  }

  /**
   * بارگذاری Layout
   */
  loadLayout(): void {
    try {
      const saved = localStorage.getItem('advanced-grid-layout');
      if (saved) {
        const data = JSON.parse(saved);
        this.gridOptions = data.options;
        this.items = data.items;
      }
    } catch (e) {
      console.error('Error on Load:', e);
    }
  }

  update() {
    this.ngxGridLayout()?.update(this.gridOptions);
  }

  addRandomItem(): void {
    const newNumber = this.items.length + 1;
    const randomW = Math.floor(Math.random() * 3) + 2; // 2-4
    const randomH = Math.floor(Math.random() * 2) + 2; // 2-3

    const newItem: SampleLayout = {
      id: `test-${Date.now()}`,
      icon: newNumber.toString(),
      title: `آیتم ${newNumber}`,
      description: '',
      type: '',
      config: new GridItemConfig(0, 0, randomW, randomH),
    };

    this.items.push(newItem);
  }

  removeItem(id: string): void {
    const index = this.items.findIndex(item => item.id === id);
    if (index > -1) {
      this.items.splice(index, 1);
    }
  }

  resetToDefault(): void {
    this.items = JSON.parse(JSON.stringify(this.DEFAULT_ITEMS));
    this.saveLayout();
    setTimeout(() => {
      this.update();
    });
  }
}
