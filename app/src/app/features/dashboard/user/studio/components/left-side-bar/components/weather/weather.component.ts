import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { WMO_WEATHER_GROUPS } from './weather-groups.constant';

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather.component.html',
  styleUrls: [],
})
export class WeatherComponent implements OnInit {
  @Input() datasetId: number = 1;
  @Input() outsideTemperature: number | null = null;

  weatherData: any = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadWeather();
  }

  loadWeather() {
    const url = `http://localhost:9400/api/dataset/${this.datasetId}/weather`;
    this.http.get(url).subscribe((response: any) => {
      console.log('Weather API response:', response);

      if (response && response.data) {
        this.weatherData = response.data;
        console.log('Extracted weatherData:', this.weatherData);
      } else {
        console.warn('No "data" property found in weather response');
      }
    });
  }

  getWeatherIcon(code: number): { label: string; img: string } {
    for (const [groupKey, groupInfo] of Object.entries(WMO_WEATHER_GROUPS)) {
      if (groupInfo.codes.includes(code)) {
        return {
          label: this.getSpecificWeatherLabel(code, groupKey),
          img: groupInfo.image,
        };
      }
    }

    return {
      label: `Unknown Weather (Code ${code})`,
      img: '/assets/weather-icons/unknown.png',
    };
  }

  private getSpecificWeatherLabel(code: number, groupKey: string): string {
    const codeLabels: Record<number, string> = {
      0: 'Cloud development not observed',
      1: 'Clouds dissolving',
      2: 'State of sky unchanged',
      3: 'Clouds forming or developing',
      10: 'Mist',
      20: 'Drizzle (not freezing)',
      21: 'Rain (not freezing)',
      22: 'Snow',
      61: 'Slight rain',
      95: 'Thunderstorm',
    };

    return codeLabels[code] || `Weather Code ${code}`;
  }
}
