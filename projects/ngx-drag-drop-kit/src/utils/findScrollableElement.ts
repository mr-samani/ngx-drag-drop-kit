export function findScrollableToParents(document: Document, elements: HTMLElement[]): HTMLElement[] {
	const unique = new Set<HTMLElement>();
	const result: HTMLElement[] = [];

	const addIfUnique = (el: HTMLElement | null) => {
		if (!el) return;
		if (!unique.has(el)) {
			unique.add(el);
			result.push(el);
		}
	};

	for (const startEl of elements) {
		// ابتدا خودِ عنصر را بررسی کن (ممکنه خودِ dropList هم scrollable باشد)
		let node: Element | null = startEl;
		while (node && node instanceof HTMLElement) {
			// اگر قابل اسکرول است، اضافه کن
			if (isScrollable(node)) {
				addIfUnique(node);
			}
			node = node.parentElement;
		}
	}

	// در آخر، اگر scrollingElement هست و هنوز اضافه نشده، آن را هم اضافه کن.
	const scrollingEl = (document.scrollingElement || document.documentElement || document.body) as HTMLElement | null;
	if (scrollingEl) {
		// اگر scrollingEl است و قابل اسکرول است، اضافه کن (یا حتی اگر isScrollable برایش false برگرداند،
		// ممکن است بخواهی آن را همیشه اضافه کنی؛ این تصمیم با توست — در اینجا فقط در صورت isScrollable اضافه می‌کنیم)
		if (isScrollable(scrollingEl)) {
			addIfUnique(scrollingEl);
		}
	}

	return result;
}

/**
 * TODO: dont use elementsFromPoint
 * use cached scrollables element
 */
export function findScrollableElementFromPointer(document: Document, clientX: number, clientY: number) {
	// عناصر زیر pointer را بگیر
	const elements = document.elementsFromPoint(clientX, clientY) as HTMLElement[];
	return findScrollableElement(document, elements);
}

export function findScrollableElement(document: Document, elements: HTMLElement[]): HTMLElement | null {
	const findScrollableAncestor = (start: Element | null): HTMLElement | null => {
		let node: Element | null = start;
		while (node && node instanceof HTMLElement) {
			if (isScrollable(node)) return node;
			node = node.parentElement;
		}
		return null;
	};

	// بررسی عناصر زیر pointer
	for (const el of elements) {
		const scrollable = findScrollableAncestor(el);
		if (scrollable) return scrollable;
	}

	// همیشه fallback داشته باش (نه مشروط)
	return (document.scrollingElement || document.documentElement || document.body) as HTMLElement;
}

/** بهبود یافته: هم overflow را می‌سنجد و هم اینکه آیا اصلاً محتوای overflow وجود دارد */
export function isScrollable(element: HTMLElement | null): boolean {
	if (!element) return false;

	// اگر element خودِ scrollingElement است → همیشه اسکرول‌پذیر فرض شود
	if (element === document.scrollingElement) return true;

	const style = window.getComputedStyle(element);
	const overflow = `${style.overflow} ${style.overflowY} ${style.overflowX}`;
	const overflowPossible = /auto|scroll|overlay/.test(overflow);

	const canScrollVertically = element.scrollHeight > element.clientHeight;
	const canScrollHorizontally = element.scrollWidth > element.clientWidth;

	// حالت خاص body/html: در برخی مرورگرها overflow=visible اما در عمل اسکرول فعال است
	const isBodyOrHtml = element.tagName === 'BODY' || element.tagName === 'HTML';

	if (isBodyOrHtml) {
		const docEl = document.documentElement;
		const body = document.body;

		const scrollableHeight =
			Math.max(docEl.scrollHeight, body.scrollHeight) > Math.min(docEl.clientHeight, body.clientHeight);

		const scrollableWidth =
			Math.max(docEl.scrollWidth, body.scrollWidth) > Math.min(docEl.clientWidth, body.clientWidth);

		return scrollableHeight || scrollableWidth;
	}

	return overflowPossible && (canScrollVertically || canScrollHorizontally);
}
