import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { IDragItem } from '../interfaces/IDragItem';
import { IDropList } from '../interfaces/IDropList';
import { NgxDragRegisterService } from '../lib/services/ngx-drag-register.service';
import { NgxDragPlaceholderService } from '../lib/services/ngx-placeholder.service';

describe('NgxDragPlaceholderService', () => {
  let service: NgxDragPlaceholderService;
  let registerService: NgxDragRegisterService;
  let mockDocument: any;
  let mockDropList: IDropList;
  let mockDragItem: IDragItem;
  let mockDragOverItem: IDragItem;

  beforeEach(() => {
    mockDocument = {
      createElement: jasmine.createSpy('createElement').and.callFake(() => {
        const el = document.createElement('div');
        Object.defineProperty(el, 'getBoundingClientRect', {
          value: () => ({ x: 0, y: 0, width: 100, height: 50, top: 0, left: 0, right: 100, bottom: 50 }),
        });
        return el;
      }),
      querySelectorAll: jasmine.createSpy('querySelectorAll').and.returnValue([]),
    };

    TestBed.configureTestingModule({
      providers: [NgxDragPlaceholderService, NgxDragRegisterService, { provide: DOCUMENT, useValue: mockDocument }],
    });

    service = TestBed.inject(NgxDragPlaceholderService);
    registerService = TestBed.inject(NgxDragRegisterService);

    mockDropList = {
      el: document.createElement('div'),
      domRect: new DOMRect(),
      dragItems: [],
      direction: 'vertical',
      isRtl: false,
      isFlexWrap: false,
      disableSort: false,
      connectedTo: [],
      updateDomRect: () => {},
      registerDragItem: () => {},
      removeDragItem: () => {},
      checkAllowedConnections: () => true,
      disposePlaceholder: jasmine.createSpy('disposePlaceholder'),
      onDrop: jasmine.createSpy('onDrop'),
    };

    mockDragItem = {
      el: document.createElement('div'),
      domRect: new DOMRect(0, 0, 100, 50),
      dropList: mockDropList,
      updateDomRect: () => {},
    };

    mockDragOverItem = {
      el: document.createElement('div'),
      domRect: new DOMRect(0, 100, 100, 50),
      dropList: mockDropList,
      updateDomRect: () => {},
    };
  });

  it('should create service', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default state', () => {
    expect(service.currentIndex).toBe(0);
    expect(service.isShown).toBe(false);
  });

  describe('Show Placeholder', () => {
    // it('should show placeholder in same list', (done) => {
    //   spyOn(registerService, 'getDragItemIndex').and.returnValue(2);

    //   service.updatePlaceholder$.next({
    //     state: 'show',
    //     dragItem: mockDragItem,
    //     destinationDropList: mockDropList,
    //     dragOverItem: mockDragOverItem,
    //     isAfter: false,
    //   });

    //   setTimeout(() => {
    //     expect(service.isShown).toBe(true);
    //     done();
    //   }, 10);
    // });

    it('should not show when disableSort is true', (done) => {
      mockDropList.disableSort = true;

      service.updatePlaceholder$.next({
        state: 'show',
        dragItem: mockDragItem,
        destinationDropList: mockDropList,
        dragOverItem: mockDragOverItem,
        isAfter: false,
      });

      setTimeout(() => {
        expect(service.isShown).toBe(false);
        done();
      }, 10);
    });

    it('should not show when connection not allowed', (done) => {
      mockDropList.checkAllowedConnections = () => false;

      service.updatePlaceholder$.next({
        state: 'show',
        dragItem: mockDragItem,
        destinationDropList: mockDropList,
        dragOverItem: mockDragOverItem,
        isAfter: false,
      });

      setTimeout(() => {
        expect(service.isShown).toBe(false);
        done();
      }, 10);
    });
  });

  describe('Hide Placeholder', () => {
    it('should hide placeholder and reset state', (done) => {
      service.updatePlaceholder$.next({
        state: 'show',
        dragItem: mockDragItem,
        destinationDropList: mockDropList,
        dragOverItem: mockDragOverItem,
        isAfter: false,
      });

      setTimeout(() => {
        service.updatePlaceholder$.next({
          state: 'hidden',
          dragItem: mockDragItem,
          destinationDropList: mockDropList,
          dragOverItem: mockDragOverItem,
          isAfter: false,
        });

        setTimeout(() => {
          expect(service.isShown).toBe(false);
          expect(service.currentIndex).toBe(0);
          expect(mockDropList.disposePlaceholder).toHaveBeenCalled();
          done();
        }, 10);
      }, 10);
    });
  });

  // describe('Calculate Final Index', () => {
  //     beforeEach((done) => {
  //       spyOn(registerService, 'getDragItemIndex').and.returnValue(0);
  //       debugger
  //       service.updatePlaceholder$.next({
  //         state: 'show',
  //         dragItem: mockDragItem,
  //         destinationDropList: mockDropList,
  //         dragOverItem: mockDragOverItem,
  //         isAfter: false,
  //       });
  //       setTimeout(() => {
  //         expect(service.currentIndex).toBe(0);
  //         done();
  //       }, 10);
  //     });
  //  });
});
