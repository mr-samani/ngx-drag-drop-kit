export type DragDecision = 'none' | 'behind' | 'ahead';

export interface DragContext {
  index: number;
  isAfter: boolean;
  isSelfList: boolean;
  overItemIndex: number;
  placeholderIndex: number;
}

export function checkShiftItem(ctx: DragContext): DragDecision {
  const { index, isAfter, isSelfList, overItemIndex, placeholderIndex } = ctx;

  // Same list logic (sorting within the same list)
  if (isSelfList) {
    if (!isAfter) {
      // Moving down: items AFTER placeholder up to and including overItem should move behind
      if (index > placeholderIndex && index <= overItemIndex) {
        return 'behind';
      }
      return 'none';
    } else {
      // Moving up: items FROM overItem up to (but not including) placeholder should move ahead
      if (index >= overItemIndex && index < placeholderIndex) {
        return 'ahead';
      }
      return 'none';
    }
  } 
  // Different list logic (Kanban - moving to another list)
  else {
    if (!isAfter) {
      // Moving down in target list:
      // Items FROM placeholder (INCLUSIVE) to overItem (INCLUSIVE) should move behind
      // BUT only if overItem is actually AFTER placeholder (we've moved down)
      if (overItemIndex > placeholderIndex && index >= placeholderIndex && index <= overItemIndex) {
        return 'behind';
      }
      return 'none';
    } else {
      // Moving up in target list:
      // Items FROM overItem (inclusive) to placeholder (exclusive) should move ahead
      if (index >= overItemIndex && index < placeholderIndex) {
        return 'ahead';
      }
      return 'none';
    }
  }
}
