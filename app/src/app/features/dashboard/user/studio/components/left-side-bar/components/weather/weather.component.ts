import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

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
    this.http.get(url).subscribe((data) => {
      this.weatherData = data;
    });
  }

  getWeatherIcon(code: number): string {
    if (code === 0) return '☀️';
    if (code === 3) return '☁️';
    if (code === 61) return '🌧️';
    if (code === 95) return '⛈️';
    return '❓';
  }
}
