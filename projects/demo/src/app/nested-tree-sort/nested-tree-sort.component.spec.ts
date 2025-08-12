import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NestedTreeSortComponent } from './nested-tree-sort.component';

describe('NestedTreeSortComponent', () => {
  let component: NestedTreeSortComponent;
  let fixture: ComponentFixture<NestedTreeSortComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NestedTreeSortComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NestedTreeSortComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
