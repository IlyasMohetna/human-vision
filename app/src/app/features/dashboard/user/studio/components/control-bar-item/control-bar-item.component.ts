import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-control-bar-item',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './control-bar-item.component.html',
  styles: ``,
})
export class ControlBarItemComponent {
  @Input() icon = '';
  @Input() label = '';
  @Input() isActive = false;
  @Output() clicked = new EventEmitter<void>();

  @Input() showTooltip: boolean = false;
  @Input() tooltipText: string = '';
}
