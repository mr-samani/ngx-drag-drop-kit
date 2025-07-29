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
import { Subscription } from 'rxjs';
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

  initCursor = '';
  private subscriptions: Subscription[] = [];

  dragItems = new WeakMap<Element, NgxDraggableDirective>();

  constructor(
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
  }

  ngOnDestroy() {
    this.dragRegister.removeDropList(this);
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.disposePlaceholder();
  }

  registerDragItem(drag: NgxDraggableDirective) {
    this.dragItems.set(drag.el, drag);
  }
  removeDragItem(drag: NgxDraggableDirective) {
    this.dragItems.delete(drag.el);
  }
  onDrop(event: IDropEvent) {
    this.drop.emit(event);
    this.subscriptions = [];
  }

  addPlaceholder(width?: number, height?: number): HTMLElement {
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
}
