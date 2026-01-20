import { Component, OnInit } from '@angular/core';
import { Corner, NgxDragDropKitModule } from '@ngx-drag-drop-kit';

@Component({
  selector: 'app-table-column-resize',
  templateUrl: './table-column-resize.component.html',
  styleUrls: ['./table-column-resize.component.scss'],
  imports: [NgxDragDropKitModule],
})
export class TableColumnResizeComponent implements OnInit {
  resizeCorner: Corner[] = [];
  minWidth = 100;
  items: { title: string; description: string; type: 'Mobile' | 'Tablet' | 'TV'; status: boolean }[] = [
    {
      title: 'Huawei',
      description: 'Y7 Prime DUB-LX-1',
      type: 'Mobile',
      status: true,
    },
    {
      title: 'Samsung',
      description: 'Galexy A51',
      type: 'Mobile',
      status: true,
    },
    {
      title: 'Apple',
      description: 'Iphone 18',
      type: 'Mobile',
      status: true,
    },
    {
      title: 'XVision',
      description: 'Smart tv android 21',
      type: 'TV',
      status: true,
    },
  ];
  constructor() {}

  ngOnInit() {
    const isRtl = getComputedStyle(document.body).direction === 'rtl';
    if (isRtl) {
      this.resizeCorner = ['left'];
    } else {
      this.resizeCorner = ['right'];
    }
  }
}
