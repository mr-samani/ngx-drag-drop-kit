import {
  AfterViewInit,
  booleanAttribute,
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
} from '@angular/core';
import { IGridLayoutOptions } from '../options/options';
import { DEFAULT_GRID_LAYOUT_CONFIG, GridLayoutService } from '../services/grid-layout.service';
import { NgxGridItemComponent } from '../grid-item/grid-item.component';
import { mergeDeep } from '../../../utils/deep-merge';
import { getFirstCollision } from '../utils/grid.utils';
import { LayoutOutput } from '../options/layout-output';

@Component({
  selector: 'ngx-grid-layout',
  template: `
    <ng-content #childItem></ng-content>
    <ng-template #placeholder></ng-template>
  `,
  styleUrls: ['./grid-layout.component.scss'],
  host: {
    '[style.position]': '"relative !important"',
    '[style.boxSizing]': '"border-box"',
    '[style.height.px]': '_gridService.getGridHeight',
    '[style.user-select]': '_gridService.editMode ? "none" : "auto"',
    '[class.edit-mode]': '_gridService.editMode',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class NgxGridLayoutComponent implements OnInit, AfterViewInit {
  @Input({ alias: 'editMode', transform: booleanAttribute })
  set setEditMode(val: boolean) {
    this._gridService.editMode = val;
    this._changeDetection.markForCheck();
  }

  get editMode(): boolean {
    return this._gridService.editMode;
  }

  @Input()
  get options(): IGridLayoutOptions {
    return this._gridService._options;
  }
  set options(val: IGridLayoutOptions) {
    if (val) {
      this._gridService._options = mergeDeep(DEFAULT_GRID_LAYOUT_CONFIG, val);
      this.setBackgroundCssVariables();
    }
  }

  @Output() layoutChange = new EventEmitter<LayoutOutput[]>();

  el: HTMLElement;

  @ContentChildren(NgxGridItemComponent)
  set items(value: QueryList<NgxGridItemComponent>) {
    if (value) {
      value.changes.subscribe(() => {
        this._gridService._gridItems = Array.from(value);
        this.initGridItems();
      });
      this._gridService._gridItems = Array.from(value);
      this.initGridItems();
    }
  }

  @ViewChild('placeholder', { read: ViewContainerRef, static: false })
  private set placeholderRef(val: ViewContainerRef) {
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

  ngAfterViewInit(): void {
    // Trigger initial layout calculation
    setTimeout(() => {
      this._changeDetection.detectChanges();
    }, 0);
  }

  public update(val: IGridLayoutOptions) {
    this.options = val;
    this.initGridItems();
  }

  /**
   * Set CSS variables for grid background
   */
  private setBackgroundCssVariables(): void {
    const style = this.el.style;
    const backgroundConfig = this._gridService._options.gridBackgroundConfig;
    const rowHeight = this._gridService._options.rowHeight;
    const cols = this._gridService._options.cols;
    const gap = this._gridService._options.gap;

    if (backgroundConfig) {
      // Structure
      style.setProperty('--gap', gap + 'px');
      style.setProperty('--row-height', rowHeight + 'px');
      style.setProperty('--columns', `${cols}`);
      style.setProperty('--border-width', backgroundConfig.borderWidth + 'px');

      // Colors
      style.setProperty('--border-color', backgroundConfig.borderColor);
      style.setProperty('--gap-color', backgroundConfig.gapColor);
      style.setProperty('--row-color', backgroundConfig.rowColor);
      style.setProperty('--column-color', backgroundConfig.columnColor);
    } else {
      // Remove properties if no background config
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

  /**
   * Initialize grid items - validate positions and resolve collisions
   */
  private initGridItems(): void {
    if (!this._gridService._gridItems.length) {
      return;
    }

    // Assign IDs to items without one
    for (let i = 0; i < this._gridService._gridItems.length; i++) {
      const item = this._gridService._gridItems[i];
      if (!item.id) {
        item.id = 'GRID_ITEM_' + (i + 1);
      }

      // Validate and resolve collisions
      while (getFirstCollision(this._gridService._gridItems, { ...item.config, id: item.id })) {
        item.config.y++;
      }

      this._gridService.updateGridItem(item);
    }

    // Check for duplicate IDs
    this.checkDuplicatedIds();

    // Compact items to remove gaps
    this._gridService.compactGridItems();

    // Trigger change detection
    this._changeDetection.detectChanges();
  }

  /**
   * Handle window resize - recalculate grid layout
   */
  @HostListener('window:resize')
  public updateGridLayout(): void {
    this.setBackgroundCssVariables();
    this.initGridItems();
  }

  /**
   * Emit layout changes to parent component
   */
  public emitChangeLayout(layout: LayoutOutput[]): void {
    this.layoutChange.emit(layout);
  }

  /**
   * Check for duplicate IDs and generate new ones if needed
   */
  private checkDuplicatedIds(): boolean {
    const ids = this._gridService._gridItems.map(m => m.id);
    let hasDuplicated = false;

    for (let i = 0; i < ids.length; i++) {
      const currentId = ids[i];
      const firstIndex = ids.indexOf(currentId);

      if (firstIndex !== i) {
        // Duplicate found - generate new ID
        this._gridService._gridItems[i].id = this.generateUniqueId();
        hasDuplicated = true;
      }
    }

    if (hasDuplicated) {
      console.warn('GridLayout: Grid items must have unique IDs. Auto-generated IDs for duplicates.', ids);
    }

    return hasDuplicated;
  }

  /**
   * Generate a unique UUID v4
   */
  private generateUniqueId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
