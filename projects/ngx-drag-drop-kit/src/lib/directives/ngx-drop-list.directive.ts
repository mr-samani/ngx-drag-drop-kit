import {
  ApplicationRef,
  ContentChild,
  Directive,
  ElementRef,
  EmbeddedViewRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { NgxDragDropService } from '../services/ngx-drag-drop.service';
import { fromEvent, Subscription } from 'rxjs';
import { IDropEvent } from '../../interfaces/IDropEvent';
import { NgxPlaceholderDirective } from './ngx-place-holder.directive';
import { NgxDragRegisterService } from '../services/ngx-drag-register.service';
import { NgxDraggableDirective } from './ngx-draggable.directive';
@Directive({
  selector: '[ngxDropList]',
  host: {
    '[style.position]': '"relative"',
    '[style.scroll-snap-type]': 'isDragging ? "none": "" ',
    '[style.user-select]': 'isDragging ? "none" : ""',
  },
  standalone: true,
  exportAs: 'NgxDropList',
})
export class NgxDropListDirective<T = any> implements OnInit, OnDestroy {
  @Input() data?: T;
  @Input() disableSort: boolean = false;
  @Input() direction: 'horizontal' | 'vertical' = 'vertical';
  @ContentChild(NgxPlaceholderDirective, { static: false }) userPlaceholder?: NgxPlaceholderDirective;
  private placeholderView?: EmbeddedViewRef<any>;
  connectedTo: HTMLElement[] = [];
  @Input('connectedTo') set connections(list: HTMLElement[]) {
    if (Array.isArray(list)) {
      this.connectedTo = list;
    } else {
      console.warn('NgxDropList', '"connectedTo" must be array!');
      this.connectedTo = [];
    }
  }

  @Output() drop = new EventEmitter<IDropEvent>();
  el: HTMLElement;
  isDragging = false;
  isFlexWrap = false;
  initCursor = '';
  isRtl = false;
  private subscriptions: Subscription[] = [];

  /**
   * NOTE: index of drag items is not valid
   */
  dragItems: NgxDraggableDirective[] = [];

  constructor(
    private dragService: NgxDragDropService,
    private dragRegister: NgxDragRegisterService,
    elRef: ElementRef<HTMLElement>,
    private appRef: ApplicationRef,

    private renderer: Renderer2
  ) {
    this.el = elRef.nativeElement;
    this.initCursor = this.el.style.cursor;
  }

  ngOnInit(): void {
    this.dragRegister.registerDropList(this);
    this.checkIsFlexibleAndWrap();
    this.isRtl = getComputedStyle(this.el).direction === 'rtl';
    this.subscriptions.push(
      fromEvent<TouchEvent>(this.el, 'mouseenter').subscribe((ev) => {
        //console.log('enter drop lis', this.el);
        this.dragService.enterDropList(this);
      }),
      fromEvent<TouchEvent>(this.el, 'mouseleave').subscribe((ev) => {
        //console.log('leave drop lis', this.el);
        this.dragService.leaveDropList(this);
      })
    );
  }

  ngOnDestroy() {
    this.dragRegister.removeDropList(this);
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.disposePlaceholder();
  }

  registerDragItem(drag: NgxDraggableDirective) {
    this.dragItems.push(drag);
  }
  removeDragItem(drag: NgxDraggableDirective) {
    let indx = this.dragItems.findIndex((x) => x == drag);
    if (indx > -1) {
      this.dragItems.splice(indx, 1);
    }
  }
  onDrop(event: IDropEvent) {
    this.drop.emit(event);
    this.subscriptions = [];
  }

  addPlaceholder(dragRect: DOMRect): HTMLElement {
    const { width, height } = dragRect;
    if (this.userPlaceholder) {
      const ctx = { width, height };
      this.placeholderView = this.userPlaceholder.tpl.createEmbeddedView(ctx);
      this.appRef.attachView(this.placeholderView);

      // اولین ریشهٔ واقعی درخت view عنصر placeholder است
      const el = this.placeholderView.rootNodes[0] as HTMLElement;
      return el;
    }
    // 2) در غیر این صورت placeholder پیش‌فرض
    const el = this.renderer.createElement('div');
    this.renderer.addClass(el, 'ngx-drag-placeholder');
    this.renderer.setStyle(el, 'pointer-events', 'none');
    this.renderer.setStyle(el, 'display', 'inline-block');
    if (width) this.renderer.setStyle(el, 'width', `${width}px`);
    if (height) this.renderer.setStyle(el, 'height', `${height}px`);
    return el;
  }

  /** سرویس موقع hide صدا می‌زند تا view جدا شود */
  disposePlaceholder() {
    if (this.placeholderView) {
      this.appRef.detachView(this.placeholderView);
      this.placeholderView.destroy();
      this.placeholderView = undefined!;
    }
  }

  private checkIsFlexibleAndWrap() {
    const styles = window.getComputedStyle(this.el);
    this.isFlexWrap = styles.display == 'flex' && styles.flexWrap == 'wrap';
  }
}
