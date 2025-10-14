import { TestBed } from '@angular/core/testing';
import { IDropList } from '../interfaces/IDropList';
import { NgxDragRegisterService } from '../lib/services/ngx-drag-register.service';
import { MockDragItems, MockDropList } from './mock-sortable-list';

describe('NgxDragRegisterService', () => {
  let service: NgxDragRegisterService;
  let mockDropList: IDropList = MockDropList;
  let dragItems = MockDragItems;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NgxDragRegisterService],
    });

    service = TestBed.inject(NgxDragRegisterService);
  });

  it('should create service', () => {
    expect(service).toBeTruthy();
  });

  it('should return -1 for item without dropList', () => {
    delete dragItems[1].dropList;
    const index = service.getDragItemIndex(dragItems[1]);
    expect(index).toBe(-1);
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
    for (let item of dragItems) {
      service.registerDragItem(item);
      expect(mockDropList.registerDragItem).toHaveBeenCalledWith(item);
      expect(item.dropList).toBe(mockDropList);
    }
  });

  it('should remove drag item', () => {
    service.registerDropList(mockDropList);
    service.registerDragItem(dragItems[0]);
    service.removeDragItem(dragItems[0]);
    expect(mockDropList.removeDragItem).toHaveBeenCalledWith(dragItems[0]);
  });

  it('should get drag item index', () => {
    mockDropList.dragItems = [dragItems[0]];
    dragItems[0].dropList = mockDropList;
    const index = service.getDragItemIndex(dragItems[0]);
    expect(index).toBe(0);
  });

  // it('should update all drag items rect', () => {
  //   service.registerDropList(mockDropList);
  //   mockDropList.dragItems = dragItems;

  //   service.updateAllDragItemsRect();

  //   expect(mockDropList.updateDomRect).toHaveBeenCalled();
  //   expect(dragItems[0].updateDomRect).toHaveBeenCalled();
  // });

  it('should skip hidden elements when updating rects', () => {
    service.registerDropList(mockDropList);
    mockDropList.dragItems = dragItems;
    // Mock hidden element
    Object.defineProperty(mockDropList.el, 'offsetParent', { value: null, configurable: true });
    service.updateAllDragItemsRect();
    expect(mockDropList.updateDomRect).not.toHaveBeenCalled();
  });
});
