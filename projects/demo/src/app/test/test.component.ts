import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './test.component.html',
  styleUrl: './test.component.scss',
})
export class TestComponent {
  list: any[] = [];

  LoadDta() {
    console.time('test');
    for (let i = 0; i < 100000; i++) {
      this.list.push({
        Id: i,
        Title: 'Item ' + i,
      });
    }
    console.timeEnd('test');
  }
}
