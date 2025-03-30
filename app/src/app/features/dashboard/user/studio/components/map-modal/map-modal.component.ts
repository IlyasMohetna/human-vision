import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-map-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="isOpen" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Google Maps Street View</h3>
          <div class="header-actions">
            <div class="coordinates-input">
              <input
                type="text"
                [(ngModel)]="coordinatesInput"
                placeholder="lat,lng (e.g. 48.856614,2.3522219)"
              />
              <input
                type="number"
                [(ngModel)]="headingInput"
                placeholder="Heading (0-360)"
                min="0"
                max="360"
                class="heading-input"
              />
              <button
                class="action-button"
                (click)="updateMapWithUserCoordinates()"
              >
                Go
              </button>
            </div>
            <button class="action-button" (click)="openInNewTab()">
              Open in new tab
            </button>
            <button class="close-button" (click)="closeModal()">×</button>
          </div>
        </div>
        <div class="map-info" *ngIf="mapUrl">
          <div class="info-item">
            <span class="info-label">Heading:</span>
            <span class="info-value">{{ heading }}°</span>
          </div>
          <div class="info-item">
            <span class="info-label">Position:</span>
            <span class="info-value">{{ coordinates }}</span>
          </div>
        </div>
        <div class="modal-content" *ngIf="mapUrl">
          <iframe
            #mapIframe
            [src]="mapUrl"
            width="100%"
            height="450"
            style="border:0;"
            allowfullscreen=""
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          >
          </iframe>
        </div>
        <div class="loading" *ngIf="!mapUrl">Loading map...</div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .modal-container {
        background-color: #282828;
        border-radius: 8px;
        width: 80%;
        max-width: 900px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        overflow: hidden;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #262c2f;
        padding: 10px 20px;
        color: white;
      }

      .close-button {
        background: none;
        border: none;
        font-size: 24px;
        color: white;
        cursor: pointer;
      }

      .modal-content {
        padding: 0;
        height: 450px;
      }

      .header-actions {
        display: flex;
        align-items: center;
      }

      .action-button {
        background-color: #4285f4;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        margin-right: 10px;
        cursor: pointer;
        font-size: 14px;
      }

      .action-button:hover {
        background-color: #3367d6;
      }

      .coordinates-input {
        display: flex;
        margin-right: 10px;
      }

      .coordinates-input input {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 6px 10px;
        border-radius: 4px 0 0 4px;
        min-width: 200px;
      }

      .coordinates-input .action-button {
        border-radius: 0 4px 4px 0;
        margin-right: 0;
      }

      .loading {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 450px;
        color: white;
        font-size: 18px;
      }

      .heading-input {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 6px 10px;
        border-radius: 0;
        width: 80px;
      }

      .map-info {
        display: flex;
        padding: 5px 15px;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        font-size: 12px;
        justify-content: space-between;
      }

      .info-item {
        display: flex;
        margin-right: 20px;
      }

      .info-label {
        font-weight: bold;
        margin-right: 5px;
      }

      .info-value {
        font-family: monospace;
      }
    `,
  ],
})
export class MapModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() coordinates = '';
  @Input() heading = 0; // New input for GPS heading
  @Output() closeModalEvent = new EventEmitter<void>();
  @ViewChild('mapIframe') mapIframe!: ElementRef<HTMLIFrameElement>;

  mapUrl: SafeResourceUrl | null = null;
  coordinatesInput = '';
  headingInput = 0;

  private directMapUrl = '';

  constructor(private sanitizer: DomSanitizer) {
    this.updateMapUrl();
  }

  ngOnInit() {
    this.coordinatesInput = this.coordinates;
    this.headingInput = this.heading;
    this.updateMapUrl();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Handle coordinate changes
    if (
      changes['coordinates'] &&
      changes['coordinates'].currentValue !==
        changes['coordinates'].previousValue
    ) {
      this.coordinatesInput = this.coordinates;
    }

    // Handle heading changes
    if (
      changes['heading'] &&
      changes['heading'].currentValue !== changes['heading'].previousValue
    ) {
      this.headingInput = this.heading;
    }

    // Update map if coordinates or heading changed
    if (changes['coordinates'] || changes['heading']) {
      this.updateMapUrl();
    }

    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      this.updateMapUrl();
    }
  }

  updateMapWithUserCoordinates() {
    if (this.validateCoordinates(this.coordinatesInput)) {
      this.coordinates = this.coordinatesInput;
      this.heading = this.normalizeHeading(this.headingInput);
      this.updateMapUrl();
    } else {
      alert('Please enter valid coordinates in the format: latitude,longitude');
    }
  }

  // Normalize heading to be between 0 and 360
  private normalizeHeading(heading: number): number {
    heading = Number(heading) || 0;
    heading = heading % 360;
    return heading < 0 ? heading + 360 : heading;
  }

  private validateCoordinates(coords: string): boolean {
    const regex = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;
    return regex.test(coords);
  }

  updateMapUrl() {
    this.mapUrl = null;

    setTimeout(() => {
      this.mapUrl = this.createSafeUrl(this.coordinates, this.heading);
    }, 100);
  }

  private createSafeUrl(coordinates: string, heading: number): SafeResourceUrl {
    coordinates = coordinates.trim().replace(/\s+/g, '');

    // Normalize heading
    heading = this.normalizeHeading(heading);

    // Direct URL now includes heading
    this.directMapUrl = `https://www.google.com/maps?layer=c&cbll=${coordinates}&cbp=12,${heading},,0,0`;

    const [lat, lng] = coordinates.split(',');

    const timestamp = Date.now();
    const zoom = 5000;
    const language = 'en';

    const streetViewUrl =
      'https://www.google.com/maps/embed?pb=' +
      '!4v' +
      timestamp +
      '000' +
      '!6m8' +
      '!1m7' +
      '!1sCAAAAAAAAAAAAA' +
      '!2m2' +
      '!1d' +
      lat +
      '!2d' +
      lng +
      '!3f' +
      heading + // Use the heading parameter here
      '!4f0' +
      '!5f1.1' +
      '!5m2' +
      '!1s' +
      language +
      '!2s' +
      language;

    return this.sanitizer.bypassSecurityTrustResourceUrl(streetViewUrl);
  }

  closeModal() {
    this.closeModalEvent.emit();
  }

  openInNewTab() {
    window.open(this.directMapUrl, '_blank');
  }
}
