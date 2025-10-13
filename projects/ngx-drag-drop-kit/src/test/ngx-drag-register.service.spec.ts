import { TestBed } from '@angular/core/testing';
import { IDragItem } from '../interfaces/IDragItem';
import { IDropList } from '../interfaces/IDropList';
import { NgxDragRegisterService } from '../lib/services/ngx-drag-register.service';

describe('NgxDragRegisterService', () => {
  let service: NgxDragRegisterService;
  let mockDropList: IDropList;
  let mockDragItem: IDragItem;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NgxDragRegisterService],
    });

    service = TestBed.inject(NgxDragRegisterService);

    mockDropList = {
      el: document.createElement('div'),
      domRect: new DOMRect(0, 0, 100, 500),
      dragItems: [],
      direction: 'vertical',
      isRtl: false,
      isFlexWrap: false,
      disableSort: false,
      connectedTo: [],
      updateDomRect: jasmine.createSpy('updateDomRect'),
      registerDragItem: jasmine.createSpy('registerDragItem'),
      removeDragItem: jasmine.createSpy('removeDragItem'),
      checkAllowedConnections: jasmine.createSpy('checkAllowedConnections').and.returnValue(true),
      disposePlaceholder: jasmine.createSpy('disposePlaceholder'),
      onDrop: jasmine.createSpy('onDrop'),
    };

    mockDragItem = {
      el: document.createElement('div'),
      domRect: new DOMRect(0, 0, 100, 50),
      updateDomRect: jasmine.createSpy('updateDomRect'),
    };

    mockDropList.el.setAttribute('ngxDropList', '');
    mockDropList.el.appendChild(mockDragItem.el);
  });

  it('should create service', () => {
    expect(service).toBeTruthy();
  });

  it('should register drop list', () => {
    service.registerDropList(mockDropList);
    expect(service.dropListItems).toContain(mockDropList);
  });

  it('should remove drop list', () => {
    service.registerDropList(mockDropList);
    service.removeDropList(mockDropList);
    expect(service.dropListItems).not.toContain(mockDropList);
  });

  it('should register drag item', () => {
    service.registerDropList(mockDropList);
    service.registerDragItem(mockDragItem);
    expect(mockDropList.registerDragItem).toHaveBeenCalledWith(mockDragItem);
    expect(mockDragItem.dropList).toBe(mockDropList);
  });

  it('should remove drag item', () => {
    service.registerDropList(mockDropList);
    service.registerDragItem(mockDragItem);
    service.removeDragItem(mockDragItem);
    expect(mockDropList.removeDragItem).toHaveBeenCalledWith(mockDragItem);
  });

  it('should get drag item index', () => {
    mockDropList.dragItems = [mockDragItem];
    mockDragItem.dropList = mockDropList;
    const index = service.getDragItemIndex(mockDragItem);
    expect(index).toBe(0);
  });

  it('should return -1 for item without dropList', () => {
    const index = service.getDragItemIndex(mockDragItem);
    expect(index).toBe(-1);
  });

  // it('should update all drag items rect', () => {
  //   service.registerDropList(mockDropList);
  //   mockDropList.dragItems = [mockDragItem];

  //   service.updateAllDragItemsRect();

  //   // expect(mockDropList.updateDomRect).toHaveBeenCalled();
  //   // expect(mockDragItem.updateDomRect).toHaveBeenCalled();
  // });

  it('should skip hidden elements when updating rects', () => {
    service.registerDropList(mockDropList);
    mockDropList.dragItems = [mockDragItem];

    // Mock hidden element
    Object.defineProperty(mockDropList.el, 'offsetParent', { value: null, configurable: true });

    service.updateAllDragItemsRect();

    expect(mockDropList.updateDomRect).not.toHaveBeenCalled();
  });
});
