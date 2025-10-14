export function findScrollableToParents(document: Document, elements: HTMLElement[]): HTMLElement[] {
  const scrollables: HTMLElement[] = [];
  const scrollable = findScrollableElement(document, elements);
  if (scrollable && !scrollables.find((el) => el === scrollable)) {
    scrollables.push(scrollable);
  }

  return scrollables;
}

export function findScrollableElementFromPointer(document: Document, clientX: number, clientY: number) {
  // عناصر زیر pointer را بگیر
  const elements = document.elementsFromPoint(clientX, clientY) as HTMLElement[];
  return findScrollableElement(document, elements);
}

export function findScrollableElement(document: Document, elements: HTMLElement[]): HTMLElement | null {
  // Helper: چک می‌کند آیا یک عنصر (یا والدینش) قابلیت اسکرول دارد
  const findScrollableAncestor = (start: Element | null): HTMLElement | null => {
    let node: Element | null = start;
    while (node && node instanceof HTMLElement) {
      if (isScrollable(node)) {
        return node;
      }
      // بالا برو تا والد بعدی
      node = node.parentElement;
      // اگر رسیدیم به documentElement یا بساط DOM تموم شد، حلقه قطع می‌شود
    }
    return null;
  };

  // اول تلاش کن در میان عناصر دقیقاً زیر pointer درونی‌ترین اسکرول‌کننده را پیدا کنی
  for (const el of elements) {
    const scrollable = findScrollableAncestor(el);
    if (scrollable) {
      return scrollable;
    }
  }

  // اگر هیچ کدام نیافت، به عنوان fallback بررسی کن که خودِ document.scrollingElement قابل اسکرول است یا نه
  const scrollingEl = (document.scrollingElement || document.documentElement || document.body) as HTMLElement | null;

  if (scrollingEl && isScrollable(scrollingEl)) {
    return scrollingEl;
  }

  return null;
}

/** بهبود یافته: هم overflow را می‌سنجد و هم اینکه آیا اصلاً محتوای overflow وجود دارد */
export function isScrollable(element: HTMLElement | null): boolean {
  if (!element) return false;

  const style = window.getComputedStyle(element);
  const overflow = `${style.overflow} ${style.overflowY} ${style.overflowX}`;
  const overflowPossible = /auto|scroll|overlay/.test(overflow);

  // محتوای قابل اسکرول (مستقیماً با اندازه‌ها) — این بخش باعث می‌شود body/documentElement شناسایی شود
  const canScrollVertically = element.scrollHeight > element.clientHeight;
  const canScrollHorizontally = element.scrollWidth > element.clientWidth;

  return overflowPossible || canScrollVertically || canScrollHorizontally;
}
