import { Routes } from '@angular/router';
import { DragResizeComponent } from './drag-resize/drag-resize.component';
import { DragDropComponent } from './drag-drop/drag-drop.component';
import { SortListComponent } from './sort-list/sort-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'drag-drop', pathMatch: 'full' },
  { path: 'drag-resize', component: DragResizeComponent },
  { path: 'sort-list', component: SortListComponent },
  { path: 'drag-drop', component: DragDropComponent },
];
