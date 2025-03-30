import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
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
export class LeftSideBarComponent implements OnInit, OnChanges {
  @Input() variants: any[] = [];
  @Input() metadata: any = {};
  @Input() vehicle: any = {};
  @Input() currentImageUrl: string = '';

  @Output() variantSelected = new EventEmitter<any>();

  public mapCoordinates: string = '';
  public mapHeading: number | null = null;

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
    const originalImage = this.variants.find(
      (variant) => variant.type === 'Original Image'
    );
    if (originalImage) {
      this.selectVariant(originalImage);
    }

    this.updateMapData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['vehicle']) {
      this.updateMapData();
    }
  }

  private updateMapData() {
    if (this.vehicle && typeof this.vehicle === 'object') {
      if (this.vehicle.gpsLatitude && this.vehicle.gpsLongitude) {
        this.mapCoordinates = `${this.vehicle.gpsLatitude},${this.vehicle.gpsLongitude}`;
        this.mapHeading = this.vehicle.gpsHeading || 0;
      } else {
        console.warn(
          'Vehicle object exists but is missing GPS coordinates:',
          this.vehicle
        );
      }
    }
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
