import { Component, ElementRef, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { GridItemConfig } from '../options/gride-item-config';
import { GridLayoutService } from '../services/grid-layout.service';
import { IPosition, NgxDraggableDirective } from '../../directives/ngx-draggable.directive';
import { NgxResizableDirective } from '../../directives/ngx-resizable.directive';
import { gridHToScreenHeight, gridWToScreenWidth, gridXToScreenX, gridYToScreenY } from '../utils/grid.utils';

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
  el: HTMLElement;

  private draggable = inject(NgxDraggableDirective);
  private resizable = inject(NgxResizableDirective);
  constructor(elRef: ElementRef<HTMLElement>, private _gridService: GridLayoutService) {
    this.el = elRef.nativeElement;
  }

  ngOnInit(): void {
    this._gridService.registerGridItem(this);
    this.draggable.boundary = this._gridService._mainEl;
    this.draggable.dragMove.subscribe((ev) => this._gridService.onMoveOrResize(this));
    this.draggable.dragEnd.subscribe((ev) => this._gridService.onMoveOrResizeEnd(this));
    this.resizable.boundary = this._gridService._mainEl;
    this.resizable.resize.subscribe((ev) => this._gridService.onMoveOrResize(this));
    this.resizable.resizeEnd.subscribe((ev) => this._gridService.onMoveOrResizeEnd(this));
  }

  ngOnDestroy(): void {
    this._gridService.removeGridItem(this);
  }
  init() {
    this.x = gridXToScreenX(this._gridService.cellWidth, this._config.x, this._gridService._options.gap);
    this.y = gridYToScreenY(this._gridService.cellHeight, this._config.y, this._gridService._options.gap);
    this.width = gridWToScreenWidth(this._gridService.cellWidth, this._config.w, this._gridService._options.gap);
    this.height = gridHToScreenHeight(this._gridService.cellHeight, this._config.h, this._gridService._options.gap);

    // console.log(this, this._gridService);
  }
}
