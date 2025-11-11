import { Directive, TemplateRef } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[ngxPlaceholder]',
  exportAs: 'ngxPlaceholder',
})
export class NgxPlaceholderDirective {
  constructor(public tpl: TemplateRef<any>) {}
}
