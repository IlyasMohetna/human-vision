import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metadata',
  imports: [CommonModule],
  templateUrl: './metadata.component.html',
  styles: ``, // Remove custom styles - we'll use Tailwind directly
})
export class MetadataComponent {
  @Input() metadata: any = {};
}
