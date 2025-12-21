import { Component, OnInit, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GridItemConfig, IGridLayoutOptions, NgxGridLayoutComponent, NgxGridLayoutModule } from '@ngx-drag-drop-kit';

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
    compactType: 'vertical',
    pushOnDrag: true,
    gridBackgroundConfig: {
      borderWidth: 1,
      borderColor: '#e0e0e0',
      gapColor: '#f5f5f5',
      rowColor: 'rgba(0,0,0,0.02)',
      columnColor: 'rgba(0,0,0,0.02)',
    },
  };

  items = [
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
    this.loadLayout();
  }

  onLayoutChange(layout: any[]): void {
    console.log('📐 Layout changed:', layout);

    // ذخیره‌سازی خودکار
    this.saveLayout(layout);
  }

  /**
   * ذخیره Layout
   */
  private saveLayout(layout: any[]): void {
    try {
      localStorage.setItem(
        'advanced-grid-layout',
        JSON.stringify({
          layout,
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

        // اعمال layout به items
        data.layout.forEach((layoutItem: any) => {
          const item = this.items.find(i => i.id === layoutItem.id);
          if (item) {
            item.config = new GridItemConfig(layoutItem.x, layoutItem.y, layoutItem.w, layoutItem.h);
          }
        });
      }
    } catch (e) {
      console.error('Error on Load:', e);
    }
  }

  update() {
    this.ngxGridLayout()?.update(this.gridOptions);
  }
}
