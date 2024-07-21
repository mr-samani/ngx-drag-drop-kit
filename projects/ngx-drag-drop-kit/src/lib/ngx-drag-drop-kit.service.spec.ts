import { TestBed } from '@angular/core/testing';

import { NgxDragDropKitService } from './ngx-drag-drop-kit.service';

describe('NgxDragDropKitService', () => {
  let service: NgxDragDropKitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxDragDropKitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
