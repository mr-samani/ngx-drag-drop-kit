import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { FakeItem, GridItemConfig } from '../options/gride-item-config';
import { GridLayoutService } from '../services/grid-layout.service';
import { NgxDraggableDirective } from '../../directives/ngx-draggable.directive';
import { NgxResizableDirective } from '../../directives/ngx-resizable.directive';
import { getPreviusY } from '../utils/grid.utils';

@Component({
  selector: 'grid-item',
  templateUrl: './grid-item.component.html',
  styleUrl: './grid-item.component.css',
  host: {
    '[id]': 'id',
    '[style.position]': '"absolute !important"',
    '[style.display]': '"block"',
    '[style.overflow]': '"hidden"',
    '[style.width.px]': 'width',
    '[style.height.px]': 'height',
    '[style.top.px]': 'top',
    '[style.left.px]': 'left',
    '[style.boxSizing]': '"border-box"',
    '[style.transition]': '"left 500ms , top 500ms"',
     
    ////// '[style.transition]': '"all 100ms"',
  },
  hostDirectives: [NgxDraggableDirective, NgxResizableDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridItemComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() config: GridItemConfig = new GridItemConfig();

  width?: number;
  height?: number;
  left?: number;
  top?: number;
  el: HTMLElement;
  id!: string;
  private draggable = inject(NgxDraggableDirective);
  private resizable = inject(NgxResizableDirective);
  constructor(
    elRef: ElementRef<HTMLElement>,
    private _gridService: GridLayoutService,
    public _changeDetection: ChangeDetectorRef
  ) {
    this.el = elRef.nativeElement;
  }

  @HostBinding('click')
  onClick(){
      let fakeItem: FakeItem = {
        x: this.config.x,
        y: this.config.y,
        w: this.config.w,
        h: this.config.h,
        id: this.id,
      };
      const firstCollission = getPreviusY(this._gridService._gridItems, fakeItem);
  }

  ngOnInit(): void {
    //this.draggable.boundary = this._gridService._mainEl;
    this.draggable.dragMove.subscribe((ev) => this._gridService.onMoveOrResize(this));
    this.draggable.dragEnd.subscribe((ev) => this._gridService.onMoveOrResizeEnd(this));
    this.resizable.boundary = this._gridService._mainEl;
    this.resizable.resize.subscribe((ev) => this._gridService.onMoveOrResize(this));
    this.resizable.resizeEnd.subscribe((ev) => this._gridService.onMoveOrResizeEnd(this));
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {}
}
