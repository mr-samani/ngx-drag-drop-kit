import { Routes } from '@angular/router';
import { DragResizeComponent } from './drag-resize/drag-resize.component';
import { DragDropComponent } from './drag-drop/drag-drop.component';

export const routes: Routes = [
  { path: '', redirectTo: 'drag-drop', pathMatch: 'full' },
  { path: 'drag-resize', component: DragResizeComponent },
  { path: 'drag-drop', component: DragDropComponent },
];
