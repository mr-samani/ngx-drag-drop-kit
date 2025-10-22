export function detectLayoutDirection(el: HTMLElement): 'horizontal' | 'vertical' {
  const parent = el.parentElement;
  if (!parent) return 'vertical';

  const style = window.getComputedStyle(parent);

  // flex container
  if (style.display.includes('flex')) {
    return style.flexDirection.startsWith('row') ? 'horizontal' : 'vertical';
  }

  // grid container
  if (style.display.includes('grid')) {
    // فرض ساده: grid معمولاً عمودیه
    return 'vertical';
  }

  // fallback: position-based detection
  const children = Array.from(parent.children) as HTMLElement[];
  if (children.length < 2) return 'vertical';

  let horizontalCount = 0;
  let verticalCount = 0;

  for (let i = 1; i < children.length; i++) {
    const prev = children[i - 1].getBoundingClientRect();
    const current = children[i].getBoundingClientRect();

    const yDiff = Math.abs(current.top - prev.top);
    const xDiff = Math.abs(current.left - prev.left);

    if (xDiff > yDiff) horizontalCount++;
    else verticalCount++;
  }

  return horizontalCount > verticalCount ? 'horizontal' : 'vertical';
}
