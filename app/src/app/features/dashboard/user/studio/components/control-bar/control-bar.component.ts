import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-control-bar',
  standalone: true,
  imports: [FontAwesomeModule, CommonModule],
  templateUrl: './control-bar.component.html',
  styles: ``,
})
export class ControlBarComponent {
  @Input() zoomLevel = 1;
  @Input() isPanning = false; // Changed from panning to isPanning
  @Output() zoomIn = new EventEmitter<void>();
  @Output() zoomOut = new EventEmitter<void>();
  @Output() resetZoom = new EventEmitter<void>();
  @Output() toggleCrosshair = new EventEmitter<void>();
  @Input() isCrosshair = false;
  @Output() maxZoom = new EventEmitter<void>();
  @Output() togglePanning = new EventEmitter<void>();
}
