import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { IGridLayoutOptions } from '../options/options';
import { GridLayoutService } from '../services/grid-layout.service';
import { deepMerge } from '../../../utils/deep-merge';

@Component({
  selector: 'grid-layout',
  templateUrl: './grid-layout.component.html',
  styleUrls: ['./grid-layout.component.scss'],
  host: {
    '[style.boxSizing]': '"border-box"',
    '[style.height.px]': '_gridService.getGridHeight',
  },
})
export class GridLayoutComponent implements OnInit, AfterViewInit {
  @Input() set options(val: IGridLayoutOptions) {
    if (val) {
      this._gridService._options = deepMerge(this._gridService._options, val);
    }
  }

  el: HTMLElement;
  constructor(public _gridService: GridLayoutService, private _elRef: ElementRef<HTMLElement>) {
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
}
