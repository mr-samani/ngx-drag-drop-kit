import { Component, Input } from '@angular/core';
import { NgxDragDropKitModule } from '../../../../../ngx-drag-drop-kit/src/lib/ngx-drag-drop-kit.module';
import { TreeModel } from '../nested-tree-sort.component';
import { transferArrayItem } from '../../../../../ngx-drag-drop-kit/src/drag-utils';
import { IDropEvent } from '../../../../../ngx-drag-drop-kit/src/lib/directives/ngx-drop-list.directive';
import { CommonModule } from '@angular/common';

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
    console.log(event);
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    console.log('new =>', event.container.data);
  }
}
