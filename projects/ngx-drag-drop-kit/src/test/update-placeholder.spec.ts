import { Renderer2 } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxDragPlaceholderService } from '../lib/services/ngx-placeholder.service';
import { IUpdatePlaceholder } from '../interfaces/update-placeholder';
import { NgxDraggableDirective } from '../lib/directives/ngx-draggable.directive';

describe('NgxDragPlaceholderService', () => {
  let renderer: Renderer2;
  let dropList: any;
  let placeholder: HTMLElement;
  let dragItem1: HTMLElement, dragItem2: HTMLElement, dragItem3: HTMLElement;

  let service: NgxDragPlaceholderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NgxDragPlaceholderService],
    });

    renderer = TestBed.inject(Renderer2);
    service = TestBed.inject(NgxDragPlaceholderService);
    (service as any)._renderer = { setStyle: jasmine.createSpy('setStyle') }; // mock renderer
    (service as any).placeholder = document.createElement('div'); // fake placeholder
    dragItem1 = document.createElement('div');
    dragItem2 = document.createElement('div');
    dragItem3 = document.createElement('div');
    dropList = {
      el: document.createElement('div'),
      disableSort: false,
      direction: 'vertical',
      isFlexWrap: false,
      isRtl: false,
      checkAllowedConnections: () => true,
    };

    dropList.el.append(dragItem1, dragItem2, dragItem3);
  });

  it('should move placeholder upwards (self-drop)', () => {
    const input: IUpdatePlaceholder = {
      currentDrag: { el: dragItem3, dropList } as NgxDraggableDirective,
      dragOverItem: { el: dragItem1, dropList } as NgxDraggableDirective,
      dropList,
      isAfter: false,
      currentDragRec: { width: 50, height: 20 } as DOMRect,
      overItemRec: { width: 50, height: 20 } as DOMRect,
      state: 'update',
    };

    service.updatePlaceholder$.next(input as any);

    expect((service as any)._renderer.setStyle).toHaveBeenCalled();
    expect(service.index).toBe(0);
  });

  function buildInput({ currentDrag, dragOverItem, isAfter = false }: any): IUpdatePlaceholder {
    return {
      currentDrag: { el: currentDrag, dropList } as NgxDraggableDirective,
      dragOverItem: dragOverItem ? ({ el: dragOverItem, dropList } as NgxDraggableDirective) : undefined,
      dropList,
      isAfter,
      overItemRec: { width: 50, height: 20 } as DOMRect,
      currentDragRec: { width: 50, height: 20 } as DOMRect,
      state: 'update',
    };
  }

  it('Case 1: self-drop upwards', () => {
    const input = buildInput({ currentDrag: dragItem3, dragOverItem: dragItem1, isAfter: false });
    service.updatePlaceholder$.next(input);

    expect(renderer.setStyle).toHaveBeenCalled(); // فقط مطمئن میشیم صدا زده شد
    expect(service.index).toBe(0);
  });

  it('Case 2: self-drop downwards', () => {
    const input = buildInput({ currentDrag: dragItem1, dragOverItem: dragItem3, isAfter: true });
    service.updatePlaceholder$.next(input);

    expect(service.index).toBe(2);
  });

  it('Case 3: self-drop on itself', () => {
    const input = buildInput({ currentDrag: dragItem2, dragOverItem: dragItem2, isAfter: false });
    service.updatePlaceholder$.next(input);

    expect(service.index).toBe(1);
  });

  it('Case 4: cross-list drop at beginning', () => {
    const dropListB = { ...dropList, el: document.createElement('div') };
    const input: IUpdatePlaceholder = {
      currentDrag: { el: dragItem1, dropList },
      dragOverItem: { el: dragItem2, dropList: dropListB },
      dropList: dropListB,
      isAfter: false,
      overItemRec: { width: 50, height: 20 },
    };
    service.updatePlaceholder$.next(input);

    expect(service.index).toBe(0);
  });

  it('Case 7: vertical direction placeholder moves', () => {
    dropList.direction = 'vertical';
    const input = buildInput({ currentDrag: dragItem1, dragOverItem: dragItem2, isAfter: false });
    service.updatePlaceholder$.next(input);

    expect(renderer.setStyle).toHaveBeenCalled();
  });

  it('Case 8: horizontal LTR', () => {
    dropList.direction = 'horizontal';
    dropList.isRtl = false;
    const input = buildInput({ currentDrag: dragItem1, dragOverItem: dragItem2, isAfter: true });
    service.updatePlaceholder$.next(input);

    expect(service.index).toBe(2);
  });

  it('Case 9: horizontal RTL', () => {
    dropList.direction = 'horizontal';
    dropList.isRtl = true;
    const input = buildInput({ currentDrag: dragItem1, dragOverItem: dragItem2, isAfter: true });
    service.updatePlaceholder$.next(input);

    expect(service.index).toBe(2);
  });
});
