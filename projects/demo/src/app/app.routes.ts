import { Routes } from '@angular/router';
import { DragResizeComponent } from './drag-resize/drag-resize.component';
import { DragDropComponent } from './drag-drop/drag-drop.component';
import { SortListComponent } from './sort-list/sort-list.component';
import { HorizontalListComponent } from './horizontal-list/horizontal-list.component';
import { CopyToZoneComponent } from './copy-to-zone/copy-to-zone.component';
import { NestedTreeSortComponent } from './nested-tree-sort/nested-tree-sort.component';
import { GridLayoutComponent } from './grid-layout/grid-layout.component';
import { TestComponent } from './test/test.component';
import { ResizableLayoutComponent } from './resizable-layout/resizable-layout.component';
import { DynamicHtmlComponent } from './dynamic-html/dynamic-html.component';

export const routes: Routes = [
	{ path: 'test', component: TestComponent },
	{ path: '', redirectTo: 'dynamic-html', pathMatch: 'full' },
	//{ path: '', redirectTo: 'drag-drop', pathMatch: 'full' },
	{ path: 'drag-resize', component: DragResizeComponent },
	{ path: 'sort-list', component: SortListComponent },
	{ path: 'drag-drop', component: DragDropComponent },
	{ path: 'horizontal-list', component: HorizontalListComponent },
	{ path: 'copy-to-zone', component: CopyToZoneComponent },
	{ path: 'nested-tree-sort', component: NestedTreeSortComponent },

	{ path: 'grid-layout', component: GridLayoutComponent },
	{ path: 'resizable-layout', component: ResizableLayoutComponent },

	{ path: 'dynamic-html', component: DynamicHtmlComponent },
];
