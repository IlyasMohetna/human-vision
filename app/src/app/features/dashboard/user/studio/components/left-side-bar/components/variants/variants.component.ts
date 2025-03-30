import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-variants',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './variants.component.html',
  styles: ``,
})
export class VariantsComponent {
  @Input() variants: any[] = [];
  @Input() currentImageUrl: string = '';
  @Output() variantSelected = new EventEmitter<any>();

  selectVariant(variant: any) {
    this.variantSelected.emit(variant);
  }
}
