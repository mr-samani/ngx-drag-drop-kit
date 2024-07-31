import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { GridItemConfig } from '../options/gride-item-config';
import { GridLayoutService } from '../services/grid-layout.service';
import { NgxDraggableDirective } from '../../directives/ngx-draggable.directive';
import { NgxResizableDirective } from '../../directives/ngx-resizable.directive';

@Component({
  selector: 'grid-item',
  templateUrl: './grid-item.component.html',
  styleUrl: './grid-item.component.css',
  host: {
    '[style.position]': '"absolute !important"',
    '[style.display]': '"block"',
    '[style.overflow]': '"hidden"',
    '[style.width.px]': 'width',
    '[style.height.px]': 'height',
    '[style.top.px]': 'y',
    '[style.left.px]': 'x',
    '[style.boxSizing]': '"border-box"',
  },
  hostDirectives: [NgxDraggableDirective, NgxResizableDirective],
})
export class GridItemComponent implements OnInit, OnDestroy {
  public _config: GridItemConfig = new GridItemConfig();
  @Input() set config(val: GridItemConfig) {
    if (val) {
      this._config = { ...this._config, ...val };
    }
    this.init();
  }

  width!: number;
  height!: number;
  x!: number;
  y!: number;

  private draggable = inject(NgxDraggableDirective);
  private resizable = inject(NgxResizableDirective);
  constructor(private _gridService: GridLayoutService) {}

  ngOnInit(): void {
    this._gridService.registerGridItem(this);
    this.draggable.boundary = this._gridService._mainEl;
    this.resizable.boundary = this._gridService._mainEl;
  }

  ngOnDestroy(): void {
    this._gridService.removeGridItem(this);
  }
  init() {
    this.x = this._gridService.cellWidth * this._config.x + this._gridService._options.gap * (this._config.x + 1);
    this.y = this._gridService.cellHeight * this._config.y + this._gridService._options.gap * (this._config.y + 1);
    this.width = this._gridService.cellWidth * this._config.w + this._gridService._options.gap * (this._config.w - 1);
    this.height = this._gridService.cellHeight * this._config.h + this._gridService._options.gap * (this._config.h - 1);

    // console.log(this, this._gridService);
  }
}
