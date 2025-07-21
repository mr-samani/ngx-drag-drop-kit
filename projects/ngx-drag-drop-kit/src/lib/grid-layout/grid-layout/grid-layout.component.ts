import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  QueryList,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
  viewChild,
} from '@angular/core';
import { IGridLayoutOptions } from '../options/options';
import { DEFAULT_GRID_LAYOUT_CONFIG, GridLayoutService } from '../services/grid-layout.service';
import { GridItemComponent } from '../grid-item/grid-item.component';
import { mergeDeep } from '../../../utils/deep-merge';
import { getFirstCollision } from '../utils/grid.utils';
import { GridItemConfig, LayoutOutput } from '../options/gride-item-config';

@Component({
  selector: 'grid-layout',
  templateUrl: './grid-layout.component.html',
  styleUrls: ['./grid-layout.component.scss'],
  host: {
    '[style.position]': '"relative !important"',
    '[style.boxSizing]': '"border-box"',
    '[style.height.px]': '_gridService.getGridHeight',
    '[style.user-select]': '"none"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class GridLayoutComponent implements OnInit, AfterViewInit {
  @Input() get options() {
    return this._gridService._options;
  }
  set options(val: IGridLayoutOptions) {
    if (val) {
      this._gridService._options = mergeDeep(DEFAULT_GRID_LAYOUT_CONFIG, val);
    }
  }

  @Output() layoutChange = new EventEmitter<LayoutOutput[]>();

  el: HTMLElement;
  @ContentChildren(GridItemComponent) set items(value: QueryList<GridItemComponent>) {
    if (value) {
      value.changes.subscribe((_) => {
        // log('Add new item to grid:', _);
      });
      this._gridService._gridItems = Array.from(value);
      this.initGridItems();
    }
  }

  @ViewChild('placeholder', { read: ViewContainerRef, static: false }) private set placeholderRef(
    val: ViewContainerRef
  ) {
    this._gridService._placeholderContainerRef = val;
  }
  constructor(
    public _gridService: GridLayoutService,
    private _elRef: ElementRef<HTMLElement>,
    private _changeDetection: ChangeDetectorRef
  ) {
    this.el = _elRef.nativeElement;
  }

  ngOnInit(): void {
    this.setBackgroundCssVariables();
    this._gridService.gridLayout = this;
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

  private initGridItems() {
    for (let i = 0; i < this._gridService._gridItems.length; i++) {
      let item = this._gridService._gridItems[i];
      if (!item.id) {
        item.id = 'GRID_ITEM_' + (i + 1);
      }
      //validate
      while (getFirstCollision(this._gridService._gridItems, { ...item.config, id: item.id })) {
        item.config.y++;
      }
      this._gridService.updateGridItem(item);
    }
    this.checkDuplicatedId();
    this._gridService.compactGridItems();
    this._gridService.calcLayout();
    setTimeout(() => {
      this._changeDetection.detectChanges();
    }, 0);

    // console.log(this._gridService._gridItems.map((x) => x.id));
  }

  @HostListener('window:resize')
  public updateGridLayout() {
    this.setBackgroundCssVariables();
    this.initGridItems();
  }

  // todo : clone changed grid items
  public emitChangeLayout(layout: LayoutOutput[]) {
    this.layoutChange.emit(layout);
  }

  private checkDuplicatedId() {
    let ids = this._gridService._gridItems.map((m) => m.id);
    let hasDuplicated = false;
    for (let i = 0; i < ids.length; i++) {
      if (this._gridService._gridItems.findIndex((x) => x.id == ids[i]) > -1 && ids.indexOf(ids[i]) !== i) {
        this._gridService._gridItems[i].id = this.generateRandomId();
        hasDuplicated = true;
      }
    }
    if (hasDuplicated) {
      console.warn('GridLayout:', 'Grid items must be have unique ids', ids);
    }
    return hasDuplicated;
  }

  // TODO:return random string strong
  private generateRandomId() {
    return 'RandomId' + Math.round(Math.random() * 9999);
  }
}
