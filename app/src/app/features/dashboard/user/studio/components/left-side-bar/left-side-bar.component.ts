import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapModalComponent } from '../map-modal/map-modal.component';
import { MetadataComponent } from './components/metadata/metadata.component';
import { VariantsComponent } from './components/variants/variants.component';

@Component({
  selector: 'app-left-side-bar',
  standalone: true,
  imports: [
    CommonModule,
    MapModalComponent,
    MetadataComponent,
    VariantsComponent,
  ],
  templateUrl: './left-side-bar.component.html',
  styleUrls: ['./left-side-bar.component.css'],
})
export class LeftSideBarComponent {
  @Input() mapCoordinates: string = '';
  @Input() mapHeading: number | null = null;
  @Input() variants: any[] = [];
  @Input() metadata: any = {};
  @Input() currentImageUrl: string = ''; // To track which variant is currently displayed

  @Output() variantSelected = new EventEmitter<any>();

  selectedSidebarItem = 0;
  showMapModal = false;

  sidebarNavItems = [
    { label: 'Images' },
    { label: 'Traffic sign' },
    { label: 'Maps' },
    { label: 'Meta data' },
    { label: 'IA' },
  ];

  ngOnInit() {
    // Set the default selected variant to the original image
    const originalImage = this.variants.find(
      (variant) => variant.type === 'Original Image'
    );
    if (originalImage) {
      this.selectVariant(originalImage);
    }

    console.log('Metadata:', JSON.stringify(this.metadata, null, 2));
  }

  selectSidebarItem(item: any): void {
    if (item === 2) {
      this.showMapModal = true;
    } else {
      this.selectedSidebarItem = item;
    }
  }

  closeMapModal() {
    this.showMapModal = false;
  }

  selectVariant(variant: any) {
    this.currentImageUrl = variant.path;
    this.variantSelected.emit(variant);
  }
}
