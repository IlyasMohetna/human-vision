import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { MapComponent } from './components/map/map.component';
import { MetadataComponent } from './components/metadata/metadata.component';
import { VariantsComponent } from './components/variants/variants.component';
import { VehicleComponent } from './components/vehicle/vehicle.component';
import { WeatherComponent } from './components/weather/weather.component';
import { TrafficSignsComponent } from './components/traffic-signs/traffic-signs.component';

@Component({
  selector: 'app-left-side-bar',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    MapComponent,
    MetadataComponent,
    VariantsComponent,
    VehicleComponent,
    WeatherComponent,
    TrafficSignsComponent,
  ],
  templateUrl: './left-side-bar.component.html',
  styleUrls: ['./left-side-bar.component.css'],
})
export class LeftSideBarComponent implements OnInit, OnChanges {
  @Input() variants: any[] = [];
  @Input() metadata: any = {};
  @Input() vehicle: any = {};
  @Input() currentImageUrl: string = '';
  @Input() datasetId: number = 1;

  @Output() variantSelected = new EventEmitter<any>();
  @Output() signHovered = new EventEmitter<string | null>();

  @ViewChild('geminiIframe') geminiIframe!: ElementRef<HTMLIFrameElement>;

  public mapCoordinates: string = '';
  public mapHeading: number | null = null;

  selectedSidebarItem = 0;
  showMapModal = false;

  sidebarNavItems = [
    { label: 'Variants' },
    { label: 'Vehicle' },
    { label: 'Weather' },
    { label: 'Maps' },
    { label: 'Traffic sign' },
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

  onIframeLoad() {
    // By the time we reach here, the iframe is fully loaded.
    console.log('iframe load event triggered.');

    // Double check that we have the reference
    if (this.geminiIframe?.nativeElement?.contentWindow) {
      // Example of sending a postMessage
      this.geminiIframe.nativeElement.contentWindow.postMessage(
        'Hello from parent after load event!',
        '*'
      );
    } else {
      console.warn('geminiIframe or contentWindow is not available.');
    }
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
    if (item === 3) {
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
