import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-badge',
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styles: ``,
})
export class BadgeComponent {
  @Input() color: string = 'blue';
}
