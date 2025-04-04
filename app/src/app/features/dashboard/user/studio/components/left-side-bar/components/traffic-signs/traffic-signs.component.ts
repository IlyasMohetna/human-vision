import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../../../../environments/environment';
import { TrafficSignResponse, TrafficSignResult } from './traffic-signs.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-traffic-signs',
  imports: [CommonModule],
  templateUrl: './traffic-signs.component.html',
})
export class TrafficSignsComponent implements OnInit {
  @Input() datasetId: number | null = null;
  @Output() hoverSign = new EventEmitter<string | null>();

  trafficSignData: TrafficSignResponse | null = null;
  public trafficSigns: TrafficSignResult[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    if (this.datasetId !== null) {
      this.fetchTrafficSigns(this.datasetId);
    }
  }

  private fetchTrafficSigns(datasetId: number): void {
    const url = `${environment.apiUrl}/dataset/${datasetId}/traffic-signs`;
    this.http.get<TrafficSignResponse>(url).subscribe({
      next: (response) => {
        console.log('Traffic sign data:', response);
        this.trafficSignData = response;
        this.trafficSigns = response.data.results;
        console.log(this.trafficSignData.data);
      },
      error: (error) => {
        console.error('Error fetching traffic sign data:', error);
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
