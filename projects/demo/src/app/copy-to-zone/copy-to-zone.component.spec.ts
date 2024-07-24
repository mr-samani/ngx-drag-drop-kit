import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CopyToZoneComponent } from './copy-to-zone.component';

describe('CopyToZoneComponent', () => {
  let component: CopyToZoneComponent;
  let fixture: ComponentFixture<CopyToZoneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CopyToZoneComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CopyToZoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
