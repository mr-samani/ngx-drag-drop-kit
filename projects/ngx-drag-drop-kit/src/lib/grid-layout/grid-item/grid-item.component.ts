import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	inject,
	Input,
	OnDestroy,
	OnInit,
	Renderer2,
} from '@angular/core';
import { GridItemConfig } from '../options/gride-item-config';
import { GridLayoutService } from '../services/grid-layout.service';
import { NgxDraggableDirective } from '../../directives/ngx-draggable.directive';
import { NgxResizableDirective } from '../../directives/ngx-resizable.directive';

@Component({
	selector: 'grid-item',
	templateUrl: './grid-item.component.html',
	styleUrl: './grid-item.component.scss',
	host: {
		'[style.position]': '"absolute !important"',
		'[style.display]': '"block"',
		'[style.overflow]': '"hidden"',
		'[style.boxSizing]': '"border-box"',
		'[style.transition]': '"left 500ms , top 500ms"',
	},
	hostDirectives: [NgxDraggableDirective, NgxResizableDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridItemComponent implements OnInit, AfterViewInit, OnDestroy {
	@Input() config: GridItemConfig = new GridItemConfig();
	@Input() id?: string;

	width?: number;
	height?: number;
	left?: number;
	top?: number;
	el: HTMLElement;

	isDragging = false;
	isResizing = false;
	private draggable = inject(NgxDraggableDirective);

	constructor(
		elRef: ElementRef<HTMLElement>,
		private _gridService: GridLayoutService,
		private _changeDetection: ChangeDetectorRef,
		private resizable: NgxResizableDirective,
		private renderer: Renderer2
	) {
		this.el = elRef.nativeElement;
	}

	ngOnInit(): void {
		this.draggable.dragStart.subscribe(ev => (this.isDragging = true));
		this.draggable.dragMove.subscribe(ev => this._gridService.onMoveOrResize(this));
		this.draggable.dragEnd.subscribe(ev => {
			this.isDragging = false;
			this._gridService.onMoveOrResizeEnd(this);
		});
		this.resizable.resizeStart.subscribe(ev => (this.isResizing = true));
		this.resizable.resize.subscribe(ev => this._gridService.onMoveOrResize(this));
		this.resizable.resizeEnd.subscribe(ev => {
			this.isResizing = false;
			this._gridService.onMoveOrResizeEnd(this);
		});
	}

	ngAfterViewInit(): void {
		this._changeDetection.detectChanges();
	}

	ngOnDestroy(): void {}

	updateView() {
		this.renderer.setStyle(this.el, 'width', this.width + 'px');
		this.renderer.setStyle(this.el, 'height', this.height + 'px');
		this.renderer.setStyle(this.el, 'top', this.top + 'px');
		this.renderer.setStyle(this.el, 'left', this.left + 'px');
		this._changeDetection.detectChanges();
	}

	public get isDraggingOrResizing() {
		return this.isDragging || this.isResizing;
	}
}
