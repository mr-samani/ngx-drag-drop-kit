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
  OnDestroy,
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
import { Subject, takeUntil, debounceTime } from 'rxjs';

@Component({
  selector: 'ngx-grid-layout',
  templateUrl: './grid-layout.component.html',
  styleUrls: ['./grid-layout.component.scss'],
  host: {
    '[style.position]': '"relative"',
    '[style.boxSizing]': '"border-box"',
    '[style.height.px]': 'gridHeight',
    '[style.user-select]': 'editMode ? "none" : "auto"',
    '[class.edit-mode]': 'editMode',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class NgxGridLayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private resizeObserver?: ResizeObserver;
  private cachedGridHeight = 0;

  @Input({ alias: 'editMode', transform: booleanAttribute }) 
  set setEditMode(val: boolean) {
    this._gridService.editMode = val;
    this.updateEditMode(val);
  }

  @Input() 
  get options(): IGridLayoutOptions {
    return this._gridService.options;
  }
  set options(val: IGridLayoutOptions) {
    if (val) {
      this._gridService.options = mergeDeep(DEFAULT_GRID_LAYOUT_CONFIG, val);
      this.setBackgroundCssVariables();
      // Schedule re-layout after options change
      this.scheduleLayout();
    }
  }

  @Output() layoutChange = new EventEmitter<LayoutOutput[]>();

  get editMode(): boolean {
    return this._gridService.editMode;
  }

  get gridHeight(): number {
    return this.cachedGridHeight;
  }

  @ContentChildren(NgxGridItemComponent) 
  set items(value: QueryList<NgxGridItemComponent>) {
    if (value) {
      value.changes
        .pipe(takeUntil(this.destroy$), debounceTime(50))
        .subscribe(() => {
          this._gridService.setGridItems(Array.from(value));
          this.initGridItems();
        });
      
      this._gridService.setGridItems(Array.from(value));
      this.initGridItems();
    }
  }

  @ViewChild('placeholder', { read: ViewContainerRef, static: false }) 
  private set placeholderRef(val: ViewContainerRef) {
    if (val) {
      this._gridService.setPlaceholderContainer(val);
    }
  }

  constructor(
    public _gridService: GridLayoutService,
    private elRef: ElementRef<HTMLElement>,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setBackgroundCssVariables();
    this._gridService.setGridLayout(this);
    this.setupResizeObserver();
    
    // Subscribe to grid height changes
    this._gridService.gridHeight$
      .pipe(takeUntil(this.destroy$))
      .subscribe(height => {
        this.cachedGridHeight = height;
        this.cdr.markForCheck();
      });
  }

  ngAfterViewInit(): void {
    // Initial layout calculation
    this.scheduleLayout();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.resizeObserver?.disconnect();
    this._gridService.cleanup();
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver(
      debounce(() => {
        this.updateGridLayout();
      }, 150)
    );

    this.resizeObserver.observe(this.elRef.nativeElement);
  }

  private setBackgroundCssVariables(): void {
    const style = this.elRef.nativeElement.style;
    const config = this._gridService.options;
    const bgConfig = config.gridBackgroundConfig;

    if (bgConfig) {
      style.setProperty('--gap', `${config.gap}px`);
      style.setProperty('--row-height', `${config.rowHeight}px`);
      style.setProperty('--columns', `${config.cols}`);
      style.setProperty('--border-width', `${bgConfig.borderWidth}px`);
      style.setProperty('--border-color', bgConfig.borderColor);
      style.setProperty('--gap-color', bgConfig.gapColor);
      style.setProperty('--row-color', bgConfig.rowColor);
      style.setProperty('--column-color', bgConfig.columnColor);
    } else {
      // Clear all custom properties
      [
        '--gap', '--row-height', '--columns', '--border-width',
        '--border-color', '--gap-color', '--row-color', '--column-color'
      ].forEach(prop => style.removeProperty(prop));
    }
  }

  private initGridItems(): void {
    const items = this._gridService.getGridItems();
    
    // Assign IDs and validate positions
    items.forEach((item, index) => {
      if (!item.id) {
        item.id = this.generateItemId(index);
      }

      // Fix collisions
      while (getFirstCollision(items, { ...item.config, id: item.id })) {
        item.config.y++;
      }

      this._gridService.updateGridItem(item);
    });

    // Check for duplicate IDs and fix them
    this.validateAndFixDuplicateIds();
    
    // Compact and calculate layout
    this._gridService.compactGridItems();
    
    this.cdr.markForCheck();
  }

  private validateAndFixDuplicateIds(): void {
    const items = this._gridService.getGridItems();
    const ids = new Set<string>();
    const duplicates: NgxGridItemComponent[] = [];

    items.forEach(item => {
      if (ids.has(item.id!)) {
        duplicates.push(item);
      } else {
        ids.add(item.id!);
      }
    });

    if (duplicates.length > 0) {
      console.warn(
        '[GridLayout] Duplicate IDs detected and fixed:', 
        duplicates.map(d => d.id)
      );
      
      duplicates.forEach((item, index) => {
        item.id = this.generateUniqueId(ids);
        ids.add(item.id);
      });
    }
  }

  private generateItemId(index: number): string {
    return `grid-item-${index + 1}`;
  }

  private generateUniqueId(existingIds: Set<string>): string {
    let id: string;
    do {
      id = `grid-item-${this.generateRandomString()}`;
    } while (existingIds.has(id));
    return id;
  }

  private generateRandomString(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  @HostListener('window:resize')
  public updateGridLayout(): void {
    this.setBackgroundCssVariables();
    this.scheduleLayout();
  }

  private scheduleLayout(): void {
    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      this.initGridItems();
    });
  }

  private updateEditMode(editMode: boolean): void {
    const items = this._gridService.getGridItems();
    items.forEach(item => {
      if (editMode) {
        item.enableDragAndResize();
      } else {
        item.disableDragAndResize();
      }
    });
  }

  public emitChangeLayout(layout: LayoutOutput[]): void {
    // Clone to prevent external mutations
    const clonedLayout = layout.map(item => ({ ...item }));
    this.layoutChange.emit(clonedLayout);
  }

  public getElement(): HTMLElement {
    return this.elRef.nativeElement;
  }
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: any;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}