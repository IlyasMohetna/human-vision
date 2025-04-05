import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { ControlBarItemComponent } from '../control-bar-item/control-bar-item.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-control-bar',
  standalone: true,
  imports: [
    FontAwesomeModule,
    CommonModule,
    ControlBarItemComponent,
    FormsModule,
  ],
  templateUrl: './control-bar.component.html',
  styles: ``,
})
export class ControlBarComponent {
  @Input() zoomLevel = 1;
  @Input() isPanning = false;
  @Output() zoomIn = new EventEmitter<void>();
  @Output() zoomOut = new EventEmitter<void>();
  @Output() resetZoom = new EventEmitter<void>();
  @Output() toggleCrosshair = new EventEmitter<void>();
  @Input() isCrosshair = false;
  @Output() maxZoom = new EventEmitter<void>();
  @Output() togglePanning = new EventEmitter<void>();
  @Output() allPolygonsVisibilityToggled = new EventEmitter<boolean>();
  @Output() compareModeToggled = new EventEmitter<void>();
  @Input() compareMode = false;
  public allPolygonsVisible: boolean = true;

  @Input() variants: any[] = [];
  @Input() selectedVariantA = '';
  @Input() selectedVariantB = '';
  @Output() selectedVariantAChange = new EventEmitter<string>();
  @Output() selectedVariantBChange = new EventEmitter<string>();

  toggleAllPolygonsVisibility() {
    this.allPolygonsVisible = !this.allPolygonsVisible;
    this.allPolygonsVisibilityToggled.emit(this.allPolygonsVisible);
  }

  onCompareModeClick() {
    this.compareModeToggled.emit();
  }

  onVariantAChanged(variantPath: string) {
    this.selectedVariantA = variantPath;
    this.selectedVariantAChange.emit(variantPath);
  }

  onVariantBChanged(variantPath: string) {
    this.selectedVariantB = variantPath;
    this.selectedVariantBChange.emit(variantPath);
  }
}
