import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../../../../environments/environment';
import { TrafficSignResponse, TrafficSignResult } from './traffic-signs.model';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-traffic-signs',
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './traffic-signs.component.html',
})
export class TrafficSignsComponent implements OnChanges {
  @Input() datasetId: number | null = null;
  @Output() hoverSign = new EventEmitter<string | null>();

  trafficSignData: TrafficSignResponse | null = null;
  public trafficSigns: TrafficSignResult[] = [];
  public isLoading = false;

  constructor(private http: HttpClient) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['datasetId'] && this.datasetId !== null) {
      this.fetchTrafficSigns(this.datasetId);
    }
  }

  private fetchTrafficSigns(datasetId: number): void {
    this.isLoading = true;
    const url = `${environment.apiUrl}/dataset/${datasetId}/traffic-signs`;
    this.http.get<TrafficSignResponse>(url).subscribe({
      next: (response) => {
        this.trafficSignData = response;
        this.trafficSigns = response.data.results;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching traffic sign data:', error);
        this.isLoading = false;
      },
    });
  }

  formatTrafficSignUrl(label: string): string {
    const sanitizedLabel = label.replace(/\//g, '');
    return `/assets/img/traffic-signs/${sanitizedLabel}.png`;
  }

  onMouseEnterSign(sign: TrafficSignResult) {
    this.hoverSign.emit(sign.objectId);
  }

  onMouseLeaveSign() {
    this.hoverSign.emit(null);
  }
}
