import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { ControlBarItemComponent } from '../control-bar-item/control-bar-item.component';

@Component({
  selector: 'app-control-bar',
  standalone: true,
  imports: [FontAwesomeModule, CommonModule, ControlBarItemComponent],
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
  public allPolygonsVisible: boolean = true;

  toggleAllPolygonsVisibility() {
    this.allPolygonsVisible = !this.allPolygonsVisible;
    this.allPolygonsVisibilityToggled.emit(this.allPolygonsVisible);
  }
}
