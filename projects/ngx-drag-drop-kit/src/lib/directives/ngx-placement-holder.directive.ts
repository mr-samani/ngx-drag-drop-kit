import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[ngxPlaceHolder]',
  standalone: true,
})
export class NgxPlaceHolderDirective {
  constructor(public el: ElementRef) {}
}
