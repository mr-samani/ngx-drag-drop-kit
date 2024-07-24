import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SortListComponent } from './sort-list.component';

describe('SortListComponent', () => {
  let component: SortListComponent;
  let fixture: ComponentFixture<SortListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SortListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SortListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
