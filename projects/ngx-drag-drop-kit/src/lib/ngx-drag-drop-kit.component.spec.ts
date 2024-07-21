import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxDragDropKitComponent } from './ngx-drag-drop-kit.component';

describe('NgxDragDropKitComponent', () => {
  let component: NgxDragDropKitComponent;
  let fixture: ComponentFixture<NgxDragDropKitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxDragDropKitComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NgxDragDropKitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
