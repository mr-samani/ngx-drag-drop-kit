import { IDragItem } from '../interfaces/IDragItem';
import { IDropList } from '../interfaces/IDropList';

export const MockDropList: IDropList = {
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
  addPlaceholder: jasmine.createSpy('addPlaceholder').and.returnValue(document.createElement('div')),
};
export const MockDragItems: IDragItem[] = [];

for (let i = 0; i < 30; i++) {
  MockDragItems.push({
    el: document.createElement('div'),
    domRect: new DOMRect(0, i * 50, 100, 50),
    updateDomRect: jasmine.createSpy('updateDomRect'),
    adjustDomRect: jasmine.createSpy('adjustDomRect'),
  });
}
const container = document.createElement('div');
container.appendChild(MockDropList.el);

MockDropList.el.setAttribute('ngxDropList', '');
for (let item of MockDragItems) {
  MockDropList.el.appendChild(item.el);
}
