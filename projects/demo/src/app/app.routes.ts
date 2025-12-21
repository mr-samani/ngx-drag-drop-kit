import { Routes } from '@angular/router';
import { DragResizeComponent } from './drag-resize/drag-resize.component';
import { DemoKanbanComponent } from './kanban/kanban.component';
import { SortListComponent } from './sort-list/sort-list.component';
import { HorizontalListComponent } from './horizontal-list/horizontal-list.component';
import { CopyToZoneComponent } from './copy-to-zone/copy-to-zone.component';
import { NestedTreeSortComponent } from './nested-tree-sort/nested-tree-sort.component';
import { DemoNgxGridLayoutComponent } from './grid-layout/grid-layout.component';
import { ResizableLayoutComponent } from './resizable-layout/resizable-layout.component';
import { DynamicHtmlComponent } from './dynamic-html/dynamic-html.component';
import { ResizableDemoComponent } from './resize/resize.component';

export const routes: Routes = [
  { path: '', redirectTo: 'kanban', pathMatch: 'full' },
  // { path: 'test', component: TestComponent },
  { path: '', redirectTo: 'dynamic-html', pathMatch: 'full' },
  { path: 'drag-resize', component: DragResizeComponent },
  { path: 'resize', component: ResizableDemoComponent },
  { path: 'sort-list', component: SortListComponent },
  { path: 'kanban', component: DemoKanbanComponent },
  { path: 'horizontal-list', component: HorizontalListComponent },
  { path: 'copy-to-zone', component: CopyToZoneComponent },
  { path: 'nested-tree-sort', component: NestedTreeSortComponent },

  { path: 'grid-layout', component: DemoNgxGridLayoutComponent },
  { path: 'resizable-layout', component: ResizableLayoutComponent },

  { path: 'dynamic-html', component: DynamicHtmlComponent },
];
