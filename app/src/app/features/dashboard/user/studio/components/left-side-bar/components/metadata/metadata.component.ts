import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metadata',
  imports: [CommonModule],
  templateUrl: './metadata.component.html',
})
export class MetadataComponent {
  @Input() metadata: any = {};
}
