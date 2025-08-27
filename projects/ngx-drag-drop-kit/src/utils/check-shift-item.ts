export type DragDecision = 'none' | 'behind' | 'ahead';

export interface DragContext {
  index: number;
  placeholderIndex: number;
  overItemIndex: number;
  isAfter: boolean;
  isSelfList: boolean;
}

// testCase({ index: 0, isAfter: false, isSelfList: false, overItemIndex: 4, placeholderIndex: 1 }, 'none');
export function checkShiftItem(ctx: DragContext): DragDecision {
  const { index, placeholderIndex, overItemIndex, isAfter, isSelfList } = ctx;

  if (overItemIndex === placeholderIndex) {
    return 'none';
  }

  const target = isAfter ? overItemIndex : overItemIndex + 1;

  if (target === placeholderIndex) {
    return 'none';
  }

  if (target > placeholderIndex) {
    const start = isSelfList ? placeholderIndex + 1 : placeholderIndex;
    if (start <= index && index < target) {
      return 'behind';
    }
  } else if (target < placeholderIndex) {
    if (target <= index && index < placeholderIndex) {
      return 'ahead';
    }
  }

  return 'none';
}
