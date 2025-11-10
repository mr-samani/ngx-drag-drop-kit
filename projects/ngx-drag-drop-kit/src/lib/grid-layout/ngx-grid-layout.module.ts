import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridLayoutComponent } from './grid-layout/grid-layout.component';
import { GridItemComponent } from './grid-item/grid-item.component';
import { GridLayoutService } from './services/grid-layout.service';

@NgModule({
	declarations: [GridLayoutComponent, GridItemComponent],
	imports: [CommonModule],
	exports: [GridLayoutComponent, GridItemComponent],
	providers: [GridLayoutService],
})
export class NgxGridLayoutModule {}
