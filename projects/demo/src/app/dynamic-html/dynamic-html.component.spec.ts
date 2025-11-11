/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { DynamicHtmlComponent } from './dynamic-html.component';

describe('DynamicHtmlComponent', () => {
  let component: DynamicHtmlComponent;
  let fixture: ComponentFixture<DynamicHtmlComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DynamicHtmlComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DynamicHtmlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
