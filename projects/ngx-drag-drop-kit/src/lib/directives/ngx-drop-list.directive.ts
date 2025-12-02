import {
  AfterViewInit,
  ApplicationRef,
  ContentChild,
  Directive,
  effect,
  ElementRef,
  EmbeddedViewRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  RendererStyleFlags2,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { IDropEvent } from '../../interfaces/IDropEvent';
import { NgxPlaceholderDirective } from './ngx-place-holder.directive';
import { NgxDragRegisterService } from '../services/ngx-drag-register.service';
import { IDropList } from '../../interfaces/IDropList';
import { DragItemRef } from './DragItemRef';
import { NgxDragDropService } from '../services/ngx-drag-drop.service';
@Directive({
  selector: '[ngxDropList]',
  host: {
    '[style.position]': '"relative"',
  },
  standalone: true,
  exportAs: 'NgxDropList',
})
export class NgxDropListDirective<T = any> implements IDropList, OnInit, AfterViewInit, OnDestroy {
  @Input() data?: T;
  @Input() disableSort: boolean = false;
  @ContentChild(NgxPlaceholderDirective, { static: false }) customPlaceholder?: NgxPlaceholderDirective;
  private placeholderViewRef?: EmbeddedViewRef<any>;
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
  @Output() enter = new EventEmitter<boolean>();

  el: HTMLElement;

  isFlexWrap = false;
  initCursor = '';
  private subscriptions: Subscription[] = [];

  /**
   * NOTE: index of drag items is not valid
   */
  dragItems: DragItemRef[] = [];
  public domRect!: DOMRect;

  private readonly dragRegister = inject(NgxDragRegisterService);
  private readonly elRef = inject(ElementRef);
  private readonly appRef = inject(ApplicationRef);
  private readonly renderer = inject(Renderer2);
  private readonly dragDropService = inject(NgxDragDropService);
  constructor() {
    this.el = this.elRef.nativeElement;
    this.initCursor = this.el.style.cursor;
    this.el.classList.add('ngx-drop-list');

    effect(() => {
      let isDragging = this.dragDropService.isDragging();
      if (isDragging) {
        this.renderer.setStyle(this.el, 'scroll-snap-type', 'none', RendererStyleFlags2.Important);
        this.renderer.setStyle(this.el, 'user-select', 'none');
        this.renderer.addClass(this.el, 'dragging');
      } else {
        this.renderer.removeStyle(this.el, 'scroll-snap-type');
        this.renderer.removeStyle(this.el, 'user-select');
        this.renderer.removeClass(this.el, 'dragging');
      }
    });
  }

  ngOnInit(): void {
    this.dragRegister.registerDropList(this);
    this.checkIsFlexibleAndWrap();
  }
  ngAfterViewInit(): void {
    this.updateDomRect();
  }

  get isRtl() {
    return getComputedStyle(this.el).direction === 'rtl';
  }

  @HostListener('pointerleave')
  onPointerLeave() {
    if (this.el.style.cursor === 'no-drop') {
      this.el.style.cursor = this.initCursor;
    }
  }

  updateDomRect() {
    this.domRect = this.el.getBoundingClientRect();
  }
  ngOnDestroy() {
    this.dragRegister.removeDropList(this);
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.disposePlaceholder();
  }

  registerDragItem(drag: DragItemRef) {
    const finded = this.dragItems.findIndex(x => x == drag);
    if (finded === -1) {
      this.dragItems.push(drag);
    }
  }
  removeDragItem(drag: DragItemRef) {
    let indx = this.dragItems.findIndex(x => x == drag);
    if (indx > -1) {
      this.dragItems.splice(indx, 1);
    }
  }
  onDrop(event: IDropEvent) {
    this.drop.emit(event);
    this.subscriptions = [];
  }

  addPlaceholder(drag: DragItemRef): HTMLElement {
    const { width, height } = drag.domRect;
    let el: HTMLElement;
    // حالت custom template کاربر
    if (this.customPlaceholder) {
      const ctx = { width, height };
      this.placeholderViewRef = this.customPlaceholder.tpl.createEmbeddedView(ctx);
      this.placeholderViewRef.detectChanges();
      this.appRef.attachView(this.placeholderViewRef);
      el = this.placeholderViewRef.rootNodes[0] as HTMLElement;
    } else {
      el = this.renderer.createElement('div');
      this.renderer.addClass(el, 'ngx-drag-placeholder');
      // this.renderer.setStyle(el, 'min-height', `${height}px`);
    }

    this.renderer.addClass(el, 'ngx-draggable');
    this.renderer.setStyle(el, 'display', 'inline-block');
    // width = 0 important for RTL
    this.renderer.setStyle(el, 'width', `${0}px`);
    this.renderer.setStyle(el, 'z-index', '9999', RendererStyleFlags2.Important);
    this.renderer.setStyle(el, 'pointer-events', 'none', RendererStyleFlags2.Important);
    if (this.isFlexWrap) {
      this.renderer.setStyle(el, 'position', 'relative', RendererStyleFlags2.Important);
    } else {
      this.renderer.setStyle(el, 'position', 'absolute', RendererStyleFlags2.Important);
    }
    return el;
  }

  /** سرویس موقع hide صدا می‌زند تا view جدا شود */
  disposePlaceholder() {
    if (this.placeholderViewRef) {
      this.appRef.detachView(this.placeholderViewRef);
      this.placeholderViewRef.destroy();
      this.placeholderViewRef = undefined!;
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

  setInter(val: boolean) {
    if (val) {
      this.renderer.setStyle(this.el, 'outline', '2px solid #00afff');
    } else {
      this.renderer.setStyle(this.el, 'outline', '');
    }
    this.enter.emit(val);
  }
}
