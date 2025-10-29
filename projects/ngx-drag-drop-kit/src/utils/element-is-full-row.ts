/**
 * بررسی می‌کند که آیا یک عنصر در context فعلی خودش یک سطر کامل را اشغال کرده یا نه.
 * در نظر می‌گیرد: display خودش و والد، flex/grid layout، float، width و غیره.
 */
export function isFullRowElement(el: HTMLElement): boolean {
  if (!el || !el.parentElement) return false;

  const style = getComputedStyle(el);
  const parentStyle = getComputedStyle(el.parentElement);

  const display = style.display;
  const parentDisplay = parentStyle.display;
  const position = style.position;
  const floatVal = style.float;

  // 🔹 حالت‌های خاص position
  if (position === 'absolute' || position === 'fixed') return false;

  // 🔹 اگر خودش display:block یا table یا list-item باشد → در حالت عادی یک سطر کامل می‌گیرد
  if (/^(block|table|list-item)$/.test(display) && parentDisplay !== 'flex' && parentDisplay !== 'grid') {
    return true;
  }

  // 🔹 اگر display:inline یا inline-block است، به عرض نگاه می‌کنیم
  if (/^(inline|inline-block|inline-flex|inline-grid)$/.test(display)) {
    const parentWidth = el.parentElement.clientWidth;
    const elWidth = el.getBoundingClientRect().width;
    if (Math.abs(elWidth - parentWidth) < 1) return true; // تقریباً پر کرده
    return false;
  }

  // 🔹 اگر float دارد، معمولاً یک سطر کامل نیست
  if (floatVal && floatVal !== 'none') return false;

  // 🔹 اگر والدش flex است
  if (parentDisplay === 'flex') {
    const flexDirection = parentStyle.flexDirection;
    const flexWrap = parentStyle.flexWrap;

    // در حالت column، هر flex item در یک "ستون" جداست و می‌تونه کل سطر فرض بشه
    if (flexDirection.startsWith('column')) {
      return true;
    }

    // در حالت row:
    // اگر width:100% یا flex-basis:100% یا grow بزرگ، یعنی سطر کامل گرفته
    const flexBasis = style.flexBasis;
    const flexGrow = parseFloat(style.flexGrow || '0');
    const width = parseFloat(style.width);
    const parentWidth = el.parentElement.clientWidth;

    if (flexBasis.endsWith('%') && parseFloat(flexBasis) >= 100) return true;
    if (flexGrow > 0 && width >= parentWidth * 0.9) return true;
    if (width >= parentWidth * 0.99) return true;
    return false;
  }

  // 🔹 اگر والدش grid است
  if (parentDisplay === 'grid') {
    // grid-area یا column span را بررسی کن
    const gridColumnStart = style.gridColumnStart;
    const gridColumnEnd = style.gridColumnEnd;
    if (gridColumnStart === '1' && (gridColumnEnd === 'span 1' || gridColumnEnd === 'auto')) {
      const parentCols = parentStyle.gridTemplateColumns.split(' ').length;
      if (parentCols === 1) return true;
    }
    // اگر span بزرگ است (مثلاً span N جایی که N = تعداد کل ستون‌ها)
    if (/span\s+(\d+)/.test(gridColumnEnd)) {
      const span = parseInt(RegExp.$1, 10);
      const cols = parentStyle.gridTemplateColumns.split(' ').length;
      if (span >= cols) return true;
    }
  }

  // 🔹 اگر width = 100% باشد (صرف‌نظر از display)
  if (style.width === '100%' || style.maxWidth === '100%') return true;

  // 🔹 نهایی: با اختلاف خیلی کوچک در width نسبت به parent
  const parentWidth =
    el.parentElement.clientWidth - parseInt(parentStyle.paddingLeft) - parseInt(parentStyle.paddingRight);
  const elWidth = el.getBoundingClientRect().width;
  if (parentWidth && elWidth / parentWidth > 0.98) return true;

  return false;
}
