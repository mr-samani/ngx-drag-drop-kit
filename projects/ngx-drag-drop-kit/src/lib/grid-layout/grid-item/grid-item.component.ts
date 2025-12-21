import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
  runInInjectionContext,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { GridItemConfig } from '../options/gride-item-config';
import { GridLayoutService } from '../services/grid-layout.service';
import { NgxDraggableDirective } from '../../directives/ngx-draggable.directive';
import { NgxResizableDirective } from '../../directives/ngx-resizable.directive';
import { Subscription } from 'rxjs/internal/Subscription';
import 'reflect-metadata';

@Component({
  selector: 'ngx-grid-item',
  template: `
    <ng-content></ng-content>
  `,
  host: {
    '[style.position]': '"absolute !important"',
    '[style.display]': '"block"',
    '[style.boxSizing]': '"border-box"',
    '[style.transition]': 'transitionStyle',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class NgxGridItemComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() config: GridItemConfig = new GridItemConfig();
  @Input() id?: string;

  width?: number;
  height?: number;
  left?: number;
  top?: number;
  el: HTMLElement;
  transitionStyle = 'left 500ms ease, top 500ms ease, width 500ms ease, height 500ms ease';

  isDragging = false;
  isResizing = false;
  private draggable?: NgxDraggableDirective;
  private resizable?: NgxResizableDirective;
  private subscriptions: Subscription[] = [];
  private directivesAttached = false;

  constructor(
    private elRef: ElementRef<HTMLElement>,
    private _gridService: GridLayoutService,
    private _changeDetection: ChangeDetectorRef,
    private renderer: Renderer2,
    private injector: Injector
  ) {
    this.el = elRef.nativeElement;
  }

  ngOnInit(): void {
    // Initialize directives based on edit mode
    if (this._gridService.editMode) {
      this.attachDirectivesIfNeeded();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // React to config changes
    if (changes['config'] && !changes['config'].firstChange) {
      this._gridService.updateGridItem(this);
    }
  }

  ngAfterViewInit(): void {
    this._changeDetection.detectChanges();
  }

  ngOnDestroy(): void {
    this.detachDirectives();
  }

  /**
   * Attach directives for drag and resize functionality
   */
  private attachDirectivesIfNeeded(): void {
    if (this.directivesAttached) return;

    this.draggable = this.attachDirective(NgxDraggableDirective) as NgxDraggableDirective;
    this.resizable = this.attachDirective(NgxResizableDirective) as NgxResizableDirective;

    if (!this.draggable || !this.resizable) {
      console.error('Failed to attach directives');
      return;
    }

    // Subscribe to drag events
    this.subscriptions.push(
      this.draggable.dragStart.subscribe(() => {
        this.isDragging = true;
        this.startDragOrResize();
      }),
      this.draggable.dragMove.subscribe(() => this._gridService.onMoveOrResize(this)),
      this.draggable.dragEnd.subscribe(() => {
        this.isDragging = false;
        this._gridService.onMoveOrResizeEnd(this);
      })
    );

    // Subscribe to resize events
    this.subscriptions.push(
      this.resizable.resizeStart.subscribe(() => {
        this.isResizing = true;
        this.startDragOrResize();
      }),
      this.resizable.resize.subscribe(() => this._gridService.onMoveOrResize(this)),
      this.resizable.resizeEnd.subscribe(() => {
        this.isResizing = false;
        this._gridService.onMoveOrResizeEnd(this);
      })
    );

    this.directivesAttached = true;
  }

  /**
   * Detach directives and clean up subscriptions
   */
  public detachDirectives(): void {
    // Unsubscribe from all events
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    // Call ngOnDestroy on directives if they exist
    if (this.draggable && typeof this.draggable.ngOnDestroy === 'function') {
      try {
        this.draggable.ngOnDestroy();
      } catch (err) {
        console.error('Error destroying draggable directive:', err);
      }
    }

    if (this.resizable && typeof this.resizable.ngOnDestroy === 'function') {
      try {
        this.resizable.ngOnDestroy();
      } catch (err) {
        console.error('Error destroying resizable directive:', err);
      }
    }

    this.draggable = undefined;
    this.resizable = undefined;
    this.directivesAttached = false;
  }

  /**
   * Toggle edit mode - attach or detach directives
   */
  public setEditMode(enabled: boolean): void {
    if (enabled && !this.directivesAttached) {
      this.attachDirectivesIfNeeded();
    } else if (!enabled && this.directivesAttached) {
      this.detachDirectives();
    }
  }

  startDragOrResize(): void {
    this.transitionStyle = 'none';
    this._changeDetection.detectChanges();
  }

  updateView(): void {
    this.transitionStyle = 'left 500ms ease, top 500ms ease, width 500ms ease, height 500ms ease';
    this.renderer.setStyle(this.el, 'transform', '');
    this.renderer.setStyle(this.el, 'width', this.width + 'px');
    this.renderer.setStyle(this.el, 'height', this.height + 'px');
    this.renderer.setStyle(this.el, 'top', this.top + 'px');
    this.renderer.setStyle(this.el, 'left', this.left + 'px');
    this._changeDetection.detectChanges();
  }

  public get isDraggingOrResizing(): boolean {
    return this.isDragging || this.isResizing;
  }

  /**
   * Attach a single directive dynamically
   */
  private attachDirective(
    DirType: typeof NgxDraggableDirective | typeof NgxResizableDirective
  ): NgxDraggableDirective | NgxResizableDirective | undefined {
    let paramTypes: any[] = [];
    try {
      paramTypes = Reflect.getMetadata('design:paramtypes', DirType) || [];
    } catch {
      paramTypes = [];
    }

    let dirInstance = runInInjectionContext(this.injector, () => {
      if (paramTypes && paramTypes.length) {
        const deps = paramTypes.map((p: any) => {
          try {
            return this.injector.get(p);
          } catch (err) {
            console.warn('Could not resolve dependency:', p, err);
            return undefined;
          }
        });
        return new (DirType as any)(...deps);
      } else {
        return new (DirType as any)(this.elRef);
      }
    });

    // Call lifecycle hooks
    if (typeof dirInstance.ngOnInit === 'function') {
      try {
        dirInstance.ngOnInit();
      } catch (err) {
        console.error('ngOnInit error:', err);
      }
    }

    setTimeout(() => {
      if (typeof dirInstance.ngAfterViewInit === 'function') {
        try {
          dirInstance.ngAfterViewInit();
        } catch (err) {
          console.error('ngAfterViewInit error:', err);
        }
      }
    }, 0);

    return dirInstance;
  }
}
