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
  selector: 'app-map',
  imports: [CommonModule, FormsModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() coordinates = '';
  @Input() heading = 0;
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
    if (
      changes['coordinates'] &&
      changes['coordinates'].currentValue !==
        changes['coordinates'].previousValue
    ) {
      this.coordinatesInput = this.coordinates;
    }

    if (
      changes['heading'] &&
      changes['heading'].currentValue !== changes['heading'].previousValue
    ) {
      this.headingInput = this.heading;
    }

    if (changes['coordinates'] || changes['heading']) {
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
    this.mapUrl = this.createSafeUrl(this.coordinates, this.heading);
  }

  private createSafeUrl(coordinates: string, heading: number): SafeResourceUrl {
    coordinates = coordinates.trim().replace(/\s+/g, '');

    heading = this.normalizeHeading(heading);

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
      heading +
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
