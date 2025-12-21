import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { GridItemConfig } from '../options/gride-item-config';
import { GridLayoutService } from '../services/grid-layout.service';
import { NgxDraggableDirective } from '../../directives/ngx-draggable.directive';
import { NgxResizableDirective } from '../../directives/ngx-resizable.directive';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'ngx-grid-item',
  templateUrl: './grid-item.component.html',
  styleUrl: './grid-item.component.scss',
  host: {
    '[style.position]': '"absolute"',
    '[style.display]': '"block"',
    '[style.overflow]': '"hidden"',
    '[style.boxSizing]': '"border-box"',
    '[style.transition]': 'transitionStyle',
    '[style.width.px]': 'width',
    '[style.height.px]': 'height',
    '[style.left.px]': 'left',
    '[style.top.px]': 'top',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  hostDirectives: [
    {
      directive: NgxDraggableDirective,
      inputs: ['draggableDisabled'],
    },
    {
      directive: NgxResizableDirective,
      inputs: ['resizableDisabled'],
    },
  ],
})
export class NgxGridItemComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private static readonly TRANSITION_DURATION = 'left 300ms ease, top 300ms ease, width 300ms ease, height 300ms ease';
  
  @Input() config: GridItemConfig = new GridItemConfig();
  @Input() id?: string;

  width = 0;
  height = 0;
  left = 0;
  top = 0;
  transitionStyle: string = NgxGridItemComponent.TRANSITION_DURATION;

  private isDragging = false;
  private isResizing = false;
  private dragStartTime = 0;

  @ViewChild(NgxDraggableDirective, { static: true })
  private draggable?: NgxDraggableDirective;

  @ViewChild(NgxResizableDirective, { static: true })
  private resizable?: NgxResizableDirective;

  constructor(
    private elRef: ElementRef<HTMLElement>,
    private gridService: GridLayoutService,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.setupDragAndResize();
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupDragAndResize(): void {
    if (!this.gridService.editMode) {
      this.disableDragAndResize();
      return;
    }

    if (this.draggable) {
      this.draggable.dragStart
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.onDragStart());

      this.draggable.dragMove
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.onDragMove());

      this.draggable.dragEnd
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.onDragEnd());
    }

    if (this.resizable) {
      this.resizable.resizeStart
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.onResizeStart());

      this.resizable.resize
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.onResize());

      this.resizable.resizeEnd
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.onResizeEnd());
    }
  }

  private onDragStart(): void {
    this.isDragging = true;
    this.dragStartTime = Date.now();
    this.disableTransition();
    this.gridService.onDragOrResizeStart(this);
  }

  private onDragMove(): void {
    if (this.isDragging) {
      this.gridService.onMoveOrResize(this);
    }
  }

  private onDragEnd(): void {
    this.isDragging = false;
    this.enableTransition();
    this.gridService.onMoveOrResizeEnd(this);
  }

  private onResizeStart(): void {
    this.isResizing = true;
    this.disableTransition();
    this.gridService.onDragOrResizeStart(this);
  }

  private onResize(): void {
    if (this.isResizing) {
      this.gridService.onMoveOrResize(this);
    }
  }

  private onResizeEnd(): void {
    this.isResizing = false;
    this.enableTransition();
    this.gridService.onMoveOrResizeEnd(this);
  }

  private disableTransition(): void {
    this.transitionStyle = 'none';
    this.cdr.markForCheck();
  }

  private enableTransition(): void {
    // Small delay to ensure the transition doesn't apply to the final position
    requestAnimationFrame(() => {
      this.transitionStyle = NgxGridItemComponent.TRANSITION_DURATION;
      this.cdr.markForCheck();
    });
  }

  public updatePosition(
    left: number,
    top: number,
    width: number,
    height: number,
    animate: boolean = true
  ): void {
    if (!animate) {
      this.disableTransition();
    }

    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;

    this.cdr.markForCheck();

    if (!animate) {
      // Re-enable transition after the next frame
      requestAnimationFrame(() => this.enableTransition());
    }
  }

  public get isDraggingOrResizing(): boolean {
    return this.isDragging || this.isResizing;
  }

  public get el(): HTMLElement {
    return this.elRef.nativeElement;
  }

  public enableDragAndResize(): void {
    if (this.draggable) {
      this.draggable.disable = false;
    }
    if (this.resizable) {
      this.resizable.disable = false;
    }
  }

  public disableDragAndResize(): void {
    if (this.draggable) {
      this.draggable.disable = true;
    }
    if (this.resizable) {
      this.resizable.disable = true;
    }
  }

  public setConfig(config: GridItemConfig): void {
    this.config = { ...config };
  }

  public getConfig(): GridItemConfig {
    return { ...this.config };
  }
}