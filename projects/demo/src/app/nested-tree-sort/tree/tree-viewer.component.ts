import { Component, Input } from '@angular/core';
import { TreeModel } from '../nested-tree-sort.component';
import { transferArrayItem } from '../../../../../ngx-drag-drop-kit/src/drag-utils';
import { IDropEvent } from '../../../../../ngx-drag-drop-kit/src/models/IDropEvent';
import { CommonModule } from '@angular/common';
import { IPosition, NgxDragDropKitModule } from '../../../../../ngx-drag-drop-kit/src/public-api';

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

  enter(item: TreeModel, ev: IPosition) {
    // console.log('Entered:', item.name, 'at', ev);
    item.entered = true;
  }
  exited(item: TreeModel, ev: IPosition) {
    //console.log('Exited:', item.name, 'at', ev);
    item.entered = false;
  }
}
