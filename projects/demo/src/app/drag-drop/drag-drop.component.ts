import { Component } from '@angular/core';
import { NgxDragDropKitModule } from '../../../../ngx-drag-drop-kit/src/lib/ngx-drag-drop-kit.module';

@Component({
  selector: 'app-drag-drop',
  standalone: true,
  imports: [NgxDragDropKitModule],
  templateUrl: './drag-drop.component.html',
  styleUrl: './drag-drop.component.scss'
})
export class DragDropComponent {
  movies = [
    'Episode I - The Phantom Menace',
    'Episode II - Attack of the Clones',
    'Episode III - Revenge of the Sith',
    'Episode IV - A New Hope',
    'Episode V - The Empire Strikes Back',
    'Episode VI - Return of the Jedi',
    'Episode VII - The Force Awakens',
    'Episode VIII - The Last Jedi',
    'Episode IX - The Rise of Skywalker',
  ];

  // drop(event: CdkDragDrop<string[]>) {
  //  // moveItemInArray(this.movies, event.previousIndex, event.currentIndex);
  // }
}
