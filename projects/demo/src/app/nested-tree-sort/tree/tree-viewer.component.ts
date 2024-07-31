import { Component, Input } from '@angular/core';
import { TreeModel } from '../nested-tree-sort.component';
import { transferArrayItem } from '../../../../../ngx-drag-drop-kit/src/drag-utils';
import { IDropEvent } from '../../../../../ngx-drag-drop-kit/src/lib/directives/ngx-drop-list.directive';
import { CommonModule } from '@angular/common';
import { NgxDragDropKitModule } from '../../../../../ngx-drag-drop-kit/src/public-api';

@Component({
  selector: 'tree',
  templateUrl: './tree-viewer.component.html',
  styleUrls: ['./tree-viewer.component.scss'],
  standalone: true,
  imports: [CommonModule, NgxDragDropKitModule],
  exportAs: 'TreeViewer',
})
export class TreeViewerComponent {
  @Input() items: TreeModel[] = [];
  drop(event: IDropEvent) {
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
  }
}
