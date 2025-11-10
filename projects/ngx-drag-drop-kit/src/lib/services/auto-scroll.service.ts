
import { Inject, Injectable, NgZone, DOCUMENT } from '@angular/core';
import { Subject, animationFrames, takeUntil } from 'rxjs';
import { getPointerPosition, getPointerPositionOnViewPort } from '../../utils/get-position';
import { findScrollableElementFromPointer } from '../../utils/findScrollableElement';

export enum AutoScrollDirection {
	NONE = 0,
	UP = 1,
	DOWN = 2,
	LEFT = 3,
	RIGHT = 4,
}

interface AutoScrollConfig {
	/** سرعت پایه اسکرول (در پیکسل بر فریم) */
	baseSpeed: number;
	/** فاصله‌ای از لبه که auto-scroll فعال می‌شود */
	threshold: number;
	/** حداکثر ضریب افزایش سرعت */
	speedBoostFactor: number;
}

interface ScrollState {
	distanceFromEdge: { top: number; bottom: number; left: number; right: number };
	node: HTMLElement | null;
	verticalDirection: AutoScrollDirection;
	horizontalDirection: AutoScrollDirection;
	offsetX: number;
	offsetY: number;
}

@Injectable({ providedIn: 'root' })
export class AutoScrollService {
	private config: AutoScrollConfig = {
		baseSpeed: 5,
		threshold: 100,
		speedBoostFactor: 2,
	};

	private stopSignal$ = new Subject<void>();
	private scrollingActive = false;

	private state: ScrollState = {
		distanceFromEdge: { top: 0, bottom: 0, left: 0, right: 0 },
		node: null,
		verticalDirection: AutoScrollDirection.NONE,
		horizontalDirection: AutoScrollDirection.NONE,
		offsetX: 0,
		offsetY: 0,
	};

	constructor(
		@Inject(DOCUMENT) private document: Document,
		private ngZone: NgZone
	) {}

	/**
	 * باید در هر move یا touchmove فراخوانی شود.
	 * تشخیص می‌دهد آیا نیاز به اسکرول خودکار هست یا نه.
	 */
	handleAutoScroll(event: MouseEvent | TouchEvent, scrollableElements?: HTMLElement[]): void {
		const { x, y } = getPointerPositionOnViewPort(event);

		// اگر هنوز در حال اسکرول قبلی هستیم، از همان container استفاده می‌کنیم
		const currentNode = this.state.node ?? findScrollableElementFromPointer(this.document, x, y);

		if (!currentNode) {
			this.stop();
			return;
		}

		// اگر scroll container عوض شد → قبلی رو متوقف کن
		if (this.state.node && this.state.node !== currentNode) {
			this.stop();
			this.state.node = currentNode;
		} else {
			this.state.node = currentNode;
		}

		// به‌روزرسانی جهت و فاصله
		this.updateScrollDirections(x, y);

		if (this.shouldScroll()) {
			this.ngZone.runOutsideAngular(() => this.startScrolling());
		} else {
			this.stop();
		}
	}

	/** توقف فوری حلقه اسکرول */
	stop(): void {
		if (this.scrollingActive) {
			this.stopSignal$.next();
			this.stopSignal$.complete();
			this.stopSignal$ = new Subject<void>();
			this.scrollingActive = false;
		}
		this.resetState();
	}

	// --------------------------------------------------------------------
	// Private methods
	// --------------------------------------------------------------------

	/** تشخیص جهت اسکرول بر اساس موقعیت pointer در container */
	private updateScrollDirections(clientX: number, clientY: number): void {
		const node = this.state.node;
		if (!node) return;

		const rect = node.getBoundingClientRect();
		const capabilities = this.getScrollCapabilities(node);

		this.state.verticalDirection = AutoScrollDirection.NONE;
		this.state.horizontalDirection = AutoScrollDirection.NONE;

		// محاسبه offset واقعی داخل محتوای قابل اسکرول
		this.state.offsetX = clientX - rect.left + node.scrollLeft;
		this.state.offsetY = clientY - rect.top + node.scrollTop;

		// محاسبه مرزهای قابل مشاهده (visible bounds) با در نظر گرفتن viewport
		const visibleRect = {
			top: Math.max(rect.top, 0),
			bottom: Math.min(rect.bottom, window.innerHeight),
			left: Math.max(rect.left, 0),
			right: Math.min(rect.right, window.innerWidth),
		};

		// بررسی اینکه آیا موس در ناحیه قابل مشاهده node است
		const isInVisibleArea =
			clientX >= visibleRect.left &&
			clientX <= visibleRect.right &&
			clientY >= visibleRect.top &&
			clientY <= visibleRect.bottom;

		if (!isInVisibleArea) return;

		// محاسبه فاصله از لبه‌های قابل مشاهده - این مقادیر برای محاسبه سرعت
		const distanceTop = clientY - visibleRect.top;
		const distanceBottom = visibleRect.bottom - clientY;
		const distanceLeft = clientX - visibleRect.left;
		const distanceRight = visibleRect.right - clientX;

		// ذخیره فواصل برای استفاده در performScroll
		this.state.distanceFromEdge = {
			top: distanceTop,
			bottom: distanceBottom,
			left: distanceLeft,
			right: distanceRight,
		};

		// تشخیص جهت عمودی
		if (distanceTop < this.config.threshold && distanceTop >= 0 && capabilities.canScrollUp) {
			this.state.verticalDirection = AutoScrollDirection.UP;
		} else if (distanceBottom < this.config.threshold && distanceBottom >= 0 && capabilities.canScrollDown) {
			this.state.verticalDirection = AutoScrollDirection.DOWN;
		}

		// تشخیص جهت افقی
		if (distanceLeft < this.config.threshold && distanceLeft >= 0 && capabilities.canScrollLeft) {
			this.state.horizontalDirection = AutoScrollDirection.LEFT;
		} else if (distanceRight < this.config.threshold && distanceRight >= 0 && capabilities.canScrollRight) {
			this.state.horizontalDirection = AutoScrollDirection.RIGHT;
		}
	}
	/** بررسی اینکه container قابل اسکرول در هر جهت هست یا نه */
	/** بررسی اینکه container قابل اسکرول در هر جهت هست یا نه */
	private getScrollCapabilities(node: HTMLElement) {
		let scrollTop = node.scrollTop;
		let scrollHeight = node.scrollHeight;
		let clientHeight = node.clientHeight;
		let scrollLeft = node.scrollLeft;
		let scrollWidth = node.scrollWidth;
		let clientWidth = node.clientWidth;

		// اگر node در واقع document یا body است، باید از documentElement هم بررسی کنیم
		if (node === document.body || node === document.documentElement) {
			const doc = document.documentElement;
			scrollTop = window.scrollY || doc.scrollTop;
			scrollLeft = window.scrollX || doc.scrollLeft;
			scrollHeight = doc.scrollHeight;
			clientHeight = window.innerHeight;
			scrollWidth = doc.scrollWidth;
			clientWidth = window.innerWidth;
		}

		const maxScrollTop = Math.max(0, scrollHeight - clientHeight);
		const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);

		return {
			canScrollUp: scrollTop > 0,
			canScrollDown: scrollTop < maxScrollTop,
			canScrollLeft: scrollLeft > 0,
			canScrollRight: scrollLeft < maxScrollLeft,
		};
	}

	/** آیا باید اسکرول انجام شود یا خیر */
	private shouldScroll(): boolean {
		return (
			this.state.verticalDirection !== AutoScrollDirection.NONE ||
			this.state.horizontalDirection !== AutoScrollDirection.NONE
		);
	}

	/** آغاز حلقه animation frame (فقط اگر قبلاً فعال نشده) */
	private startScrolling(): void {
		if (this.scrollingActive) return;
		this.scrollingActive = true;

		this.ngZone.runOutsideAngular(() => {
			animationFrames()
				.pipe(takeUntil(this.stopSignal$))
				.subscribe({
					next: () => this.performScroll(),
					complete: () => (this.scrollingActive = false),
				});
		});
	}

	/** محاسبه سرعت پویا بر اساس فاصله از لبه */
	private computeSpeed(offset: number, threshold: number): number {
		const distanceRatio = 1 - Math.min(offset / threshold, 1);
		return this.config.baseSpeed * (1 + distanceRatio * (this.config.speedBoostFactor - 1));
	}

	/** اعمال حرکت اسکرول در هر frame */
	/** اعمال حرکت اسکرول در هر frame */
	private performScroll(): void {
		const node = this.state.node;
		if (!node) return;

		const { verticalDirection, horizontalDirection, distanceFromEdge } = this.state;
		if (!distanceFromEdge) return;

		let deltaX = 0;
		let deltaY = 0;

		// محاسبه سرعت پویا بر اساس فاصله واقعی از لبه قابل مشاهده
		if (verticalDirection === AutoScrollDirection.UP) {
			deltaY = -this.computeSpeed(distanceFromEdge.top, this.config.threshold);
		} else if (verticalDirection === AutoScrollDirection.DOWN) {
			deltaY = this.computeSpeed(distanceFromEdge.bottom, this.config.threshold);
		}

		if (horizontalDirection === AutoScrollDirection.LEFT) {
			deltaX = -this.computeSpeed(distanceFromEdge.left, this.config.threshold);
		} else if (horizontalDirection === AutoScrollDirection.RIGHT) {
			deltaX = this.computeSpeed(distanceFromEdge.right, this.config.threshold);
		}

		// 👇 تفاوت اصلی همینجاست 👇
		if (node === document.body || node === document.documentElement) {
			window.scrollBy({ left: deltaX, top: deltaY, behavior: 'auto' });
		} else {
			node.scrollBy({ left: deltaX, top: deltaY });
		}
	}

	/** بازنشانی وضعیت فعلی */
	private resetState(): void {
		this.state = {
			distanceFromEdge: { top: 0, bottom: 0, left: 0, right: 0 },
			node: null,
			verticalDirection: AutoScrollDirection.NONE,
			horizontalDirection: AutoScrollDirection.NONE,
			offsetX: 0,
			offsetY: 0,
		};
	}
}
