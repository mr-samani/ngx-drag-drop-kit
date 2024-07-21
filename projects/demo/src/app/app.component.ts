import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxDragDropKitModule } from '../../../ngx-drag-drop-kit/src/lib/ngx-drag-drop-kit.module';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgxDragDropKitModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'demo';
}
