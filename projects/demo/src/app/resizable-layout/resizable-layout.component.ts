import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IResizableOutput, NgxDragDropKitModule } from '../../../../ngx-drag-drop-kit/src/public-api';

@Component({
    selector: 'app-resizable-layout',
    imports: [CommonModule, NgxDragDropKitModule],
    templateUrl: './resizable-layout.component.html',
    styleUrl: './resizable-layout.component.scss'
})
export class ResizableLayoutComponent {
	width: number;

	isRtl: boolean;
	constructor() {
		this.width = localStorage.getItem('ngxSidebarWidth') ? parseInt(localStorage.getItem('ngxSidebarWidth')!) : 200;
		this.isRtl = getComputedStyle(document.body).direction === 'rtl';
	}
	onResizeEnd(event: IResizableOutput) {
		localStorage.setItem('ngxSidebarWidth', event.width.toString());
		this.width = event.width;
	}
}
