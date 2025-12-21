import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxGridLayoutComponent } from './grid-layout/grid-layout.component';
import { NgxGridItemComponent } from './grid-item/grid-item.component';
import { GridLayoutService } from './services/grid-layout.service';

@NgModule({
  declarations: [NgxGridLayoutComponent, NgxGridItemComponent],
  imports: [CommonModule],
  exports: [NgxGridLayoutComponent, NgxGridItemComponent],
  providers: [GridLayoutService],
})
export class NgxGridLayoutModule {}

