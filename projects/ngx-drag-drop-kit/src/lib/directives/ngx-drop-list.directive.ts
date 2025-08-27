import {
  AfterViewInit,
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
export class NgxDropListDirective<T = any> implements OnInit, AfterViewInit, OnDestroy {
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
  public domRect!: DOMRect;

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
    this.checkIsFlexibleAndWrap();
    this.isRtl = getComputedStyle(this.el).direction === 'rtl';
  }
  ngAfterViewInit(): void {
    this.updateDomRect();
  }

  updateDomRect() {
    this.domRect = this.el.getBoundingClientRect();
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

    // حالت custom template کاربر
    if (this.userPlaceholder) {
      const ctx = { width, height };
      this.placeholderView = this.userPlaceholder.tpl.createEmbeddedView(ctx);
      this.appRef.attachView(this.placeholderView);
      const el = this.placeholderView.rootNodes[0] as HTMLElement;
      this.renderer.setStyle(el, 'pointer-events', 'none');
      this.renderer.setStyle(el, 'position', 'relative');
      this.renderer.setStyle(el, 'z-index', '9999');
      return el;
    }

    // 🔹 حالت پیشفرض: ساخت div با directive واقعی
    const el = this.renderer.createElement('div');

    // استایل‌ها
    this.renderer.addClass(el, 'ngx-drag-placeholder');
    this.renderer.addClass(el, 'ngx-draggable');
    this.renderer.setStyle(el, 'pointer-events', 'none');
    this.renderer.setStyle(el, 'display', 'block');
    if (width) {
      this.renderer.setStyle(el, 'width', `${width}px`);
      this.renderer.setStyle(el, 'min-width', `${width}px`);
    }
    if (height) {
      this.renderer.setStyle(el, 'height', `${height}px`);
      this.renderer.setStyle(el, 'min-height', `${height}px`);
    }

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

  checkAllowedConnections(sourceDropList?: NgxDropListDirective): boolean {
    this.el.style.cursor = this.initCursor;
    if (sourceDropList && sourceDropList.connectedTo.length > 0 && sourceDropList.el !== this.el) {
      const found = sourceDropList.connectedTo.indexOf(this.el) > -1;
      if (!found) {
        this.el.style.cursor = 'no-drop';
      }
      return found;
    }
    return true;
  }
}
