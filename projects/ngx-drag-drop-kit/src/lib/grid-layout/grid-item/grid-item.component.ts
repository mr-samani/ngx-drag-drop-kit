import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
  runInInjectionContext,
} from '@angular/core';
import { GridItemConfig } from '../options/gride-item-config';
import { GridLayoutService } from '../services/grid-layout.service';
import { NgxDraggableDirective } from '../../directives/ngx-draggable.directive';
import { NgxResizableDirective } from '../../directives/ngx-resizable.directive';
import { Subscription } from 'rxjs/internal/Subscription';
import 'reflect-metadata';

@Component({
  selector: 'ngx-grid-item',
  templateUrl: './grid-item.component.html',
  styleUrl: './grid-item.component.scss',
  host: {
    '[style.position]': '"absolute !important"',
    '[style.display]': '"block"',
    '[style.overflow]': '"hidden"',
    '[style.boxSizing]': '"border-box"',
    '[style.transition]': '"left 500ms , top 500ms"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class NgxGridItemComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() config: GridItemConfig = new GridItemConfig();
  @Input() id?: string;

  width?: number;
  height?: number;
  left?: number;
  top?: number;
  el: HTMLElement;

  isDragging = false;
  isResizing = false;
  private draggable?: NgxDraggableDirective;
  private resizable?: NgxResizableDirective;
  hostDirectives = [];
  private subscriptions: Subscription[] = [];

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
    if (!this._gridService.editMode) return;
    this.draggable = this.attachDirectives(NgxDraggableDirective, this.injector);
    this.resizable = this.attachDirectives(NgxResizableDirective, this.injector);

    if (!this.draggable || !this.resizable) return;

    this.subscriptions = [
      this.draggable.dragStart.subscribe(ev => {
        this.isDragging = true;
        this.startDragOrResize();
      }),
      this.draggable.dragMove.subscribe(ev => this._gridService.onMoveOrResize(this)),
      this.draggable.dragEnd.subscribe(ev => {
        this.isDragging = false;
        this._gridService.onMoveOrResizeEnd(this);
      }),
      this.resizable.resizeStart.subscribe(ev => {
        this.isResizing = true;
        this.startDragOrResize();
      }),
      this.resizable.resize.subscribe(ev => this._gridService.onMoveOrResize(this)),
      this.resizable.resizeEnd.subscribe(ev => {
        this.isResizing = false;
        this._gridService.onMoveOrResizeEnd(this);
      }),
    ];
  }

  startDragOrResize() {
    this.renderer.setStyle(this.el, 'transition', 'left 500ms , top 500ms');
  }

  ngAfterViewInit(): void {
    this._changeDetection.detectChanges();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  updateView() {
    this.renderer.setStyle(this.el, 'transition', 'none');
    this.renderer.setStyle(this.el, 'transform', '');
    this.renderer.setStyle(this.el, 'width', this.width + 'px');
    this.renderer.setStyle(this.el, 'height', this.height + 'px');
    this.renderer.setStyle(this.el, 'top', this.top + 'px');
    this.renderer.setStyle(this.el, 'left', this.left + 'px');
    this._changeDetection.detectChanges();
  }

  public get isDraggingOrResizing() {
    return this.isDragging || this.isResizing;
  }

  attachDirectives(DirType: typeof NgxDraggableDirective | typeof NgxResizableDirective, dirInjector: Injector) {
    // خواندن metadata پارامترهای سازنده
    let paramTypes: any[] = [];
    try {
      paramTypes = Reflect.getMetadata('design:paramtypes', DirType) || [];
    } catch {
      paramTypes = [];
    }
    let dirInstance = runInInjectionContext(dirInjector, () => {
      if (paramTypes && paramTypes.length) {
        const deps = paramTypes.map((p: any) => {
          try {
            return dirInjector.get(p);
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
    if (typeof dirInstance.ngOnInit === 'function') {
      try {
        dirInstance.ngOnInit();
      } catch (err) {
        console.error('ngOnInit error:', err);
      }
    }

    // ✅ فراخوانی ngAfterViewInit بعد از اضافه شدن به DOM
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

  detachDirectives() {}
}
