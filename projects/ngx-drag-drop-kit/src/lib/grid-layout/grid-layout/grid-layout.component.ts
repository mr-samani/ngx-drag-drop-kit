import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  Input,
  OnInit,
  QueryList,
} from '@angular/core';
import { IGridLayoutOptions } from '../options/options';
import { DEFAULT_GRID_LAYOUT_CONFIG, GridLayoutService } from '../services/grid-layout.service';
import { GridItemComponent } from '../grid-item/grid-item.component';
import { log, logEndTime, logStartTime } from '../utils/log';
import { mergeDeep } from '../../../utils/deep-merge';

@Component({
  selector: 'grid-layout',
  templateUrl: './grid-layout.component.html',
  styleUrls: ['./grid-layout.component.scss'],
  host: {
    '[style.boxSizing]': '"border-box"',
    '[style.height.px]': '_gridService.getGridHeight',
  },
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridLayoutComponent implements OnInit, AfterViewInit {
  @Input() set options(val: IGridLayoutOptions) {
    if (val) {
      this._gridService._options = mergeDeep(DEFAULT_GRID_LAYOUT_CONFIG, val);
    }
  }

  el: HTMLElement;
  @ContentChildren(GridItemComponent) set items(value: QueryList<GridItemComponent>) {
    log('Change grid items in main layout.');
    if (value) {
      logStartTime('StartInit');
      this._gridService._gridItems = Array.from(value);
      this.initGridItems();
    }
  }

  loading = true;

  constructor(
    public _gridService: GridLayoutService,
    private _elRef: ElementRef<HTMLElement>,
    private _changeDetection: ChangeDetectorRef
  ) {
    this.el = _elRef.nativeElement;
  }

  ngOnInit(): void {
    this.setBackgroundCssVariables();
    this._gridService._mainEl = this.el;
  }

  ngAfterViewInit(): void {}

  private setBackgroundCssVariables() {
    const style = this.el.style;
    const backgroundConfig = this._gridService._options.gridBackgroundConfig;
    const rowHeight = this._gridService._options.rowHeight;
    const cols = this._gridService._options.cols;
    const gap = this._gridService._options.gap;
    if (backgroundConfig) {
      // structure
      style.setProperty('--gap', gap + 'px');
      style.setProperty('--row-height', rowHeight + 'px');
      style.setProperty('--columns', `${cols}`);
      style.setProperty('--border-width', backgroundConfig.borderWidth + 'px');

      // colors
      style.setProperty('--border-color', backgroundConfig.borderColor);
      style.setProperty('--gap-color', backgroundConfig.gapColor);
      style.setProperty('--row-color', backgroundConfig.rowColor);
      style.setProperty('--column-color', backgroundConfig.columnColor);
    } else {
      style.removeProperty('--gap');
      style.removeProperty('--row-height');
      style.removeProperty('--columns');
      style.removeProperty('--border-width');
      style.removeProperty('--border-color');
      style.removeProperty('--gap-color');
      style.removeProperty('--row-color');
      style.removeProperty('--column-color');
    }
  }

  initGridItems() {
    for (let i = 0; i < this._gridService._gridItems.length; i++) {
      this._gridService._gridItems[i].id = 'GRID_ITEM_' + (i + 1);
      this._gridService.updateGridItem(this._gridService._gridItems[i]);
    }
    log('Initialize gridItems done.', this._gridService._gridItems.length);
   // setTimeout(() => {
      this._gridService.compactGridItems();
      this.loading = false;
      logEndTime('StartInit');
      this._changeDetection.detectChanges();
    //}, 100);
  }
}
