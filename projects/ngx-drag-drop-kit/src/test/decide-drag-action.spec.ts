import { DragContext, DragDecision, checkShiftItem } from '../utils/check-shift-item';

describe('checkShiftItem=> Sort List - Move down', () => {
  function testCase(ctx: DragContext, expected: DragDecision) {
    it(`OnMove item to down i=${ctx.index} "${expected}" for ${JSON.stringify(ctx)}`, () => {
      expect(checkShiftItem(ctx)).toBe(expected);
    });
  }
  //overItemIndex = 0 : is self drag item
  // start drag
  testCase({ index: 0, isAfter: false, isSelfList: true, overItemIndex: 0, placeholderIndex: 0 }, 'none');
  testCase({ index: 1, isAfter: false, isSelfList: true, overItemIndex: 0, placeholderIndex: 0 }, 'none');
  testCase({ index: 2, isAfter: false, isSelfList: true, overItemIndex: 0, placeholderIndex: 0 }, 'none');
  testCase({ index: 3, isAfter: false, isSelfList: true, overItemIndex: 0, placeholderIndex: 0 }, 'none');
  testCase({ index: 4, isAfter: false, isSelfList: true, overItemIndex: 0, placeholderIndex: 0 }, 'none');
  testCase({ index: 5, isAfter: false, isSelfList: true, overItemIndex: 0, placeholderIndex: 0 }, 'none');

  // move first item to down - over item is next item
  testCase({ index: 0, isAfter: false, isSelfList: true, overItemIndex: 1, placeholderIndex: 0 }, 'none');
  testCase({ index: 1, isAfter: false, isSelfList: true, overItemIndex: 1, placeholderIndex: 0 }, 'behind');
  testCase({ index: 2, isAfter: false, isSelfList: true, overItemIndex: 1, placeholderIndex: 0 }, 'none');
  testCase({ index: 3, isAfter: false, isSelfList: true, overItemIndex: 1, placeholderIndex: 0 }, 'none');
  testCase({ index: 4, isAfter: false, isSelfList: true, overItemIndex: 1, placeholderIndex: 0 }, 'none');
  testCase({ index: 5, isAfter: false, isSelfList: true, overItemIndex: 1, placeholderIndex: 0 }, 'none');

  // move first item to down - over item is third item
  testCase({ index: 0, isAfter: false, isSelfList: true, overItemIndex: 2, placeholderIndex: 0 }, 'none');
  testCase({ index: 1, isAfter: false, isSelfList: true, overItemIndex: 2, placeholderIndex: 0 }, 'behind');
  testCase({ index: 2, isAfter: false, isSelfList: true, overItemIndex: 2, placeholderIndex: 0 }, 'behind');
  testCase({ index: 3, isAfter: false, isSelfList: true, overItemIndex: 2, placeholderIndex: 0 }, 'none');
  testCase({ index: 4, isAfter: false, isSelfList: true, overItemIndex: 2, placeholderIndex: 0 }, 'none');
  testCase({ index: 5, isAfter: false, isSelfList: true, overItemIndex: 2, placeholderIndex: 0 }, 'none');

  // move first item to down - over item is fourth  item
  testCase({ index: 0, isAfter: false, isSelfList: true, overItemIndex: 3, placeholderIndex: 0 }, 'none');
  testCase({ index: 1, isAfter: false, isSelfList: true, overItemIndex: 3, placeholderIndex: 0 }, 'behind');
  testCase({ index: 2, isAfter: false, isSelfList: true, overItemIndex: 3, placeholderIndex: 0 }, 'behind');
  testCase({ index: 3, isAfter: false, isSelfList: true, overItemIndex: 3, placeholderIndex: 0 }, 'behind');
  testCase({ index: 4, isAfter: false, isSelfList: true, overItemIndex: 3, placeholderIndex: 0 }, 'none');
  testCase({ index: 5, isAfter: false, isSelfList: true, overItemIndex: 3, placeholderIndex: 0 }, 'none');
});

//----------------------------------------------------
describe('checkShiftItem=> Sort List - Insert in middle and move down', () => {
  function testCase(ctx: DragContext, expected: DragDecision) {
    it(`Move from center to down "${expected}" for ${JSON.stringify(ctx)}`, () => {
      expect(checkShiftItem(ctx)).toBe(expected);
    });
  }
  // move fourth  item to down - over item is fourth  item
  testCase({ index: 0, isAfter: false, isSelfList: true, overItemIndex: 3, placeholderIndex: 3 }, 'none');
  testCase({ index: 1, isAfter: false, isSelfList: true, overItemIndex: 3, placeholderIndex: 3 }, 'none');
  testCase({ index: 2, isAfter: false, isSelfList: true, overItemIndex: 3, placeholderIndex: 3 }, 'none');
  testCase({ index: 3, isAfter: false, isSelfList: true, overItemIndex: 3, placeholderIndex: 3 }, 'none');
  testCase({ index: 4, isAfter: false, isSelfList: true, overItemIndex: 3, placeholderIndex: 3 }, 'none');
  testCase({ index: 5, isAfter: false, isSelfList: true, overItemIndex: 3, placeholderIndex: 3 }, 'none');

  // move fourth  item to down - over item is fifth item
  testCase({ index: 0, isAfter: false, isSelfList: true, overItemIndex: 4, placeholderIndex: 3 }, 'none');
  testCase({ index: 1, isAfter: false, isSelfList: true, overItemIndex: 4, placeholderIndex: 3 }, 'none');
  testCase({ index: 2, isAfter: false, isSelfList: true, overItemIndex: 4, placeholderIndex: 3 }, 'none');
  testCase({ index: 3, isAfter: false, isSelfList: true, overItemIndex: 4, placeholderIndex: 3 }, 'none');
  testCase({ index: 4, isAfter: false, isSelfList: true, overItemIndex: 4, placeholderIndex: 3 }, 'behind');
  testCase({ index: 5, isAfter: false, isSelfList: true, overItemIndex: 4, placeholderIndex: 3 }, 'none');

  // move fourth  item to down - over item is sixth item
  testCase({ index: 0, isAfter: false, isSelfList: true, overItemIndex: 5, placeholderIndex: 3 }, 'none');
  testCase({ index: 1, isAfter: false, isSelfList: true, overItemIndex: 5, placeholderIndex: 3 }, 'none');
  testCase({ index: 2, isAfter: false, isSelfList: true, overItemIndex: 5, placeholderIndex: 3 }, 'none');
  testCase({ index: 3, isAfter: false, isSelfList: true, overItemIndex: 5, placeholderIndex: 3 }, 'none');
  testCase({ index: 4, isAfter: false, isSelfList: true, overItemIndex: 5, placeholderIndex: 3 }, 'behind');
  testCase({ index: 5, isAfter: false, isSelfList: true, overItemIndex: 5, placeholderIndex: 3 }, 'behind');
});

//----------------------------------------------------
describe('checkShiftItem=> Sort List - Insert in middle and move up', () => {
  function testCase(ctx: DragContext, expected: DragDecision) {
    it(`Move from center to up "${expected}" for ${JSON.stringify(ctx)}`, () => {
      expect(checkShiftItem(ctx)).toBe(expected);
    });
  }
  // move fourth  item to up - over item is fourth  item
  testCase({ index: 0, isAfter: true, isSelfList: true, overItemIndex: 3, placeholderIndex: 3 }, 'none');
  testCase({ index: 1, isAfter: true, isSelfList: true, overItemIndex: 3, placeholderIndex: 3 }, 'none');
  testCase({ index: 2, isAfter: true, isSelfList: true, overItemIndex: 3, placeholderIndex: 3 }, 'none');
  testCase({ index: 3, isAfter: true, isSelfList: true, overItemIndex: 3, placeholderIndex: 3 }, 'none');
  testCase({ index: 4, isAfter: true, isSelfList: true, overItemIndex: 3, placeholderIndex: 3 }, 'none');
  testCase({ index: 5, isAfter: true, isSelfList: true, overItemIndex: 3, placeholderIndex: 3 }, 'none');

  // move fourth  item to down - over item is fifth item
  testCase({ index: 0, isAfter: true, isSelfList: true, overItemIndex: 2, placeholderIndex: 3 }, 'none');
  testCase({ index: 1, isAfter: true, isSelfList: true, overItemIndex: 2, placeholderIndex: 3 }, 'none');
  testCase({ index: 2, isAfter: true, isSelfList: true, overItemIndex: 2, placeholderIndex: 3 }, 'ahead');
  testCase({ index: 3, isAfter: true, isSelfList: true, overItemIndex: 2, placeholderIndex: 3 }, 'none');
  testCase({ index: 4, isAfter: true, isSelfList: true, overItemIndex: 2, placeholderIndex: 3 }, 'none');
  testCase({ index: 5, isAfter: true, isSelfList: true, overItemIndex: 2, placeholderIndex: 3 }, 'none');

  // move fourth  item to down - over item is sixth item
  testCase({ index: 0, isAfter: true, isSelfList: true, overItemIndex: 1, placeholderIndex: 3 }, 'none');
  testCase({ index: 1, isAfter: true, isSelfList: true, overItemIndex: 1, placeholderIndex: 3 }, 'ahead');
  testCase({ index: 2, isAfter: true, isSelfList: true, overItemIndex: 1, placeholderIndex: 3 }, 'ahead');
  testCase({ index: 3, isAfter: true, isSelfList: true, overItemIndex: 1, placeholderIndex: 3 }, 'none');
  testCase({ index: 4, isAfter: true, isSelfList: true, overItemIndex: 1, placeholderIndex: 3 }, 'none');
  testCase({ index: 5, isAfter: true, isSelfList: true, overItemIndex: 1, placeholderIndex: 3 }, 'none');

  // move fourth  item to down - over item is sixth item
  testCase({ index: 0, isAfter: true, isSelfList: true, overItemIndex: 0, placeholderIndex: 3 }, 'ahead');
  testCase({ index: 1, isAfter: true, isSelfList: true, overItemIndex: 0, placeholderIndex: 3 }, 'ahead');
  testCase({ index: 2, isAfter: true, isSelfList: true, overItemIndex: 0, placeholderIndex: 3 }, 'ahead');
  testCase({ index: 3, isAfter: true, isSelfList: true, overItemIndex: 0, placeholderIndex: 3 }, 'none');
  testCase({ index: 4, isAfter: true, isSelfList: true, overItemIndex: 0, placeholderIndex: 3 }, 'none');
  testCase({ index: 5, isAfter: true, isSelfList: true, overItemIndex: 0, placeholderIndex: 3 }, 'none');
});
// __________________________________________________________________________________________________________
// __________________________________________________________________________________________________________
// __________________________________________________________________________________________________________

describe('checkShiftItem=> Kanban view - Insert on first and move down', () => {
  function testCase(ctx: DragContext, expected: DragDecision) {
    it(`Move to other list - insert on first item "${expected}" for ${JSON.stringify(ctx)}`, () => {
      expect(checkShiftItem(ctx)).toBe(expected);
    });
  }

  // enter in other list
  testCase({ index: 0, isAfter: false, isSelfList: false, overItemIndex: 0, placeholderIndex: 0 }, 'none');
  testCase({ index: 1, isAfter: false, isSelfList: false, overItemIndex: 0, placeholderIndex: 0 }, 'none');
  testCase({ index: 2, isAfter: false, isSelfList: false, overItemIndex: 0, placeholderIndex: 0 }, 'none');
  testCase({ index: 3, isAfter: false, isSelfList: false, overItemIndex: 0, placeholderIndex: 0 }, 'none');
  testCase({ index: 4, isAfter: false, isSelfList: false, overItemIndex: 0, placeholderIndex: 0 }, 'none');
  testCase({ index: 5, isAfter: false, isSelfList: false, overItemIndex: 0, placeholderIndex: 0 }, 'none');

  // move first item to up
  testCase({ index: 0, isAfter: false, isSelfList: false, overItemIndex: 1, placeholderIndex: 0 }, 'behind');
  testCase({ index: 1, isAfter: false, isSelfList: false, overItemIndex: 1, placeholderIndex: 0 }, 'behind');
  testCase({ index: 2, isAfter: false, isSelfList: false, overItemIndex: 1, placeholderIndex: 0 }, 'none');
  testCase({ index: 3, isAfter: false, isSelfList: false, overItemIndex: 1, placeholderIndex: 0 }, 'none');
  testCase({ index: 4, isAfter: false, isSelfList: false, overItemIndex: 1, placeholderIndex: 0 }, 'none');
  testCase({ index: 5, isAfter: false, isSelfList: false, overItemIndex: 1, placeholderIndex: 0 }, 'none');
  // move first ,second item to up
  testCase({ index: 0, isAfter: false, isSelfList: false, overItemIndex: 2, placeholderIndex: 0 }, 'behind');
  testCase({ index: 1, isAfter: false, isSelfList: false, overItemIndex: 2, placeholderIndex: 0 }, 'behind');
  testCase({ index: 2, isAfter: false, isSelfList: false, overItemIndex: 2, placeholderIndex: 0 }, 'behind');
  testCase({ index: 3, isAfter: false, isSelfList: false, overItemIndex: 2, placeholderIndex: 0 }, 'none');
  testCase({ index: 4, isAfter: false, isSelfList: false, overItemIndex: 2, placeholderIndex: 0 }, 'none');
  testCase({ index: 5, isAfter: false, isSelfList: false, overItemIndex: 2, placeholderIndex: 0 }, 'none');
  // move first ,second, third item to up
  testCase({ index: 0, isAfter: false, isSelfList: false, overItemIndex: 3, placeholderIndex: 0 }, 'behind');
  testCase({ index: 1, isAfter: false, isSelfList: false, overItemIndex: 3, placeholderIndex: 0 }, 'behind');
  testCase({ index: 2, isAfter: false, isSelfList: false, overItemIndex: 3, placeholderIndex: 0 }, 'behind');
  testCase({ index: 3, isAfter: false, isSelfList: false, overItemIndex: 3, placeholderIndex: 0 }, 'behind');
  testCase({ index: 4, isAfter: false, isSelfList: false, overItemIndex: 3, placeholderIndex: 0 }, 'none');
  testCase({ index: 5, isAfter: false, isSelfList: false, overItemIndex: 3, placeholderIndex: 0 }, 'none');
  // move first ,second,thirtd, fourth to up
  testCase({ index: 0, isAfter: false, isSelfList: false, overItemIndex: 4, placeholderIndex: 0 }, 'behind');
  testCase({ index: 1, isAfter: false, isSelfList: false, overItemIndex: 4, placeholderIndex: 0 }, 'behind');
  testCase({ index: 2, isAfter: false, isSelfList: false, overItemIndex: 4, placeholderIndex: 0 }, 'behind');
  testCase({ index: 3, isAfter: false, isSelfList: false, overItemIndex: 4, placeholderIndex: 0 }, 'behind');
  testCase({ index: 4, isAfter: false, isSelfList: false, overItemIndex: 4, placeholderIndex: 0 }, 'behind');
  testCase({ index: 5, isAfter: false, isSelfList: false, overItemIndex: 4, placeholderIndex: 0 }, 'none');
});

// // --------------------------------------------------------------
describe('checkShiftItem=> Kanban view - Insert on middle and move down', () => {
  function testCase(ctx: DragContext, expected: DragDecision) {
    it(`Move to other list - insert on second item on move to down "${expected}" for ${JSON.stringify(ctx)}`, () => {
      expect(checkShiftItem(ctx)).toBe(expected);
    });
  }
  // insert after second item
  testCase({ index: 0, isAfter: false, isSelfList: false, overItemIndex: 1, placeholderIndex: 1 }, 'none');
  testCase({ index: 1, isAfter: false, isSelfList: false, overItemIndex: 1, placeholderIndex: 1 }, 'none');
  testCase({ index: 2, isAfter: false, isSelfList: false, overItemIndex: 1, placeholderIndex: 1 }, 'none');
  testCase({ index: 3, isAfter: false, isSelfList: false, overItemIndex: 1, placeholderIndex: 1 }, 'none');
  testCase({ index: 4, isAfter: false, isSelfList: false, overItemIndex: 1, placeholderIndex: 1 }, 'none');
  testCase({ index: 5, isAfter: false, isSelfList: false, overItemIndex: 1, placeholderIndex: 1 }, 'none');
  // move first ,second item to up
  testCase({ index: 0, isAfter: false, isSelfList: false, overItemIndex: 2, placeholderIndex: 1 }, 'none');
  testCase({ index: 1, isAfter: false, isSelfList: false, overItemIndex: 2, placeholderIndex: 1 }, 'behind');
  testCase({ index: 2, isAfter: false, isSelfList: false, overItemIndex: 2, placeholderIndex: 1 }, 'behind');
  testCase({ index: 3, isAfter: false, isSelfList: false, overItemIndex: 2, placeholderIndex: 1 }, 'none');
  testCase({ index: 4, isAfter: false, isSelfList: false, overItemIndex: 2, placeholderIndex: 1 }, 'none');
  testCase({ index: 5, isAfter: false, isSelfList: false, overItemIndex: 2, placeholderIndex: 1 }, 'none');
  // move first ,second, third item to up
  testCase({ index: 0, isAfter: false, isSelfList: false, overItemIndex: 3, placeholderIndex: 1 }, 'none');
  testCase({ index: 1, isAfter: false, isSelfList: false, overItemIndex: 3, placeholderIndex: 1 }, 'behind');
  testCase({ index: 2, isAfter: false, isSelfList: false, overItemIndex: 3, placeholderIndex: 1 }, 'behind');
  testCase({ index: 3, isAfter: false, isSelfList: false, overItemIndex: 3, placeholderIndex: 1 }, 'behind');
  testCase({ index: 4, isAfter: false, isSelfList: false, overItemIndex: 3, placeholderIndex: 1 }, 'none');
  testCase({ index: 5, isAfter: false, isSelfList: false, overItemIndex: 3, placeholderIndex: 1 }, 'none');
  // move first ,second,thirtd, fourth to up
  testCase({ index: 0, isAfter: false, isSelfList: false, overItemIndex: 4, placeholderIndex: 1 }, 'none');
  testCase({ index: 1, isAfter: false, isSelfList: false, overItemIndex: 4, placeholderIndex: 1 }, 'behind');
  testCase({ index: 2, isAfter: false, isSelfList: false, overItemIndex: 4, placeholderIndex: 1 }, 'behind');
  testCase({ index: 3, isAfter: false, isSelfList: false, overItemIndex: 4, placeholderIndex: 1 }, 'behind');
  testCase({ index: 4, isAfter: false, isSelfList: false, overItemIndex: 4, placeholderIndex: 1 }, 'behind');
  testCase({ index: 5, isAfter: false, isSelfList: false, overItemIndex: 4, placeholderIndex: 1 }, 'none');
});

// // --------------------------------------------------------------
describe('checkShiftItem=> Kanban view - Insert on middle and move up', () => {
  function testCase(ctx: DragContext, expected: DragDecision) {
    it(`Move to other list - insert on third item and move to up"${expected}" for ${JSON.stringify(ctx)}`, () => {
      expect(checkShiftItem(ctx)).toBe(expected);
    });
  }
  // insert after third item
  testCase({ index: 0, isAfter: false, isSelfList: false, overItemIndex: 2, placeholderIndex: 2 }, 'none');
  testCase({ index: 1, isAfter: false, isSelfList: false, overItemIndex: 2, placeholderIndex: 2 }, 'none');
  testCase({ index: 2, isAfter: false, isSelfList: false, overItemIndex: 2, placeholderIndex: 2 }, 'none');
  testCase({ index: 3, isAfter: false, isSelfList: false, overItemIndex: 2, placeholderIndex: 2 }, 'none');
  testCase({ index: 4, isAfter: false, isSelfList: false, overItemIndex: 2, placeholderIndex: 2 }, 'none');
  testCase({ index: 5, isAfter: false, isSelfList: false, overItemIndex: 2, placeholderIndex: 2 }, 'none');

  testCase({ index: 0, isAfter: true, isSelfList: false, overItemIndex: 2, placeholderIndex: 2 }, 'none');
  testCase({ index: 1, isAfter: true, isSelfList: false, overItemIndex: 2, placeholderIndex: 2 }, 'none');
  testCase({ index: 2, isAfter: true, isSelfList: false, overItemIndex: 2, placeholderIndex: 2 }, 'none');
  testCase({ index: 3, isAfter: true, isSelfList: false, overItemIndex: 2, placeholderIndex: 2 }, 'none');
  testCase({ index: 4, isAfter: true, isSelfList: false, overItemIndex: 2, placeholderIndex: 2 }, 'none');
  testCase({ index: 5, isAfter: true, isSelfList: false, overItemIndex: 2, placeholderIndex: 2 }, 'none');

  // move second item to down
  testCase({ index: 0, isAfter: true, isSelfList: false, overItemIndex: 1, placeholderIndex: 2 }, 'none');
  testCase({ index: 1, isAfter: true, isSelfList: false, overItemIndex: 1, placeholderIndex: 2 }, 'ahead');
  testCase({ index: 2, isAfter: true, isSelfList: false, overItemIndex: 1, placeholderIndex: 2 }, 'none');
  testCase({ index: 3, isAfter: true, isSelfList: false, overItemIndex: 1, placeholderIndex: 2 }, 'none');
  testCase({ index: 4, isAfter: true, isSelfList: false, overItemIndex: 1, placeholderIndex: 2 }, 'none');
  testCase({ index: 5, isAfter: true, isSelfList: false, overItemIndex: 1, placeholderIndex: 2 }, 'none');
  // move first ,second item to down
  testCase({ index: 0, isAfter: true, isSelfList: false, overItemIndex: 0, placeholderIndex: 2 }, 'ahead');
  testCase({ index: 1, isAfter: true, isSelfList: false, overItemIndex: 0, placeholderIndex: 2 }, 'ahead');
  testCase({ index: 2, isAfter: true, isSelfList: false, overItemIndex: 0, placeholderIndex: 2 }, 'none');
  testCase({ index: 3, isAfter: true, isSelfList: false, overItemIndex: 0, placeholderIndex: 2 }, 'none');
  testCase({ index: 4, isAfter: true, isSelfList: false, overItemIndex: 0, placeholderIndex: 2 }, 'none');
  testCase({ index: 5, isAfter: true, isSelfList: false, overItemIndex: 0, placeholderIndex: 2 }, 'none');

});
