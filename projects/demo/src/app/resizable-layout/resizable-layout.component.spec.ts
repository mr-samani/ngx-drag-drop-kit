import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResizableLayoutComponent } from './resizable-layout.component';

describe('ResizableLayoutComponent', () => {
  let component: ResizableLayoutComponent;
  let fixture: ComponentFixture<ResizableLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResizableLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResizableLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
