import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-import',
  imports: [CommonModule],
  templateUrl: './import.component.html',
})
export class ImportComponent implements OnInit, OnDestroy {
  private apiUrl =
    'http://localhost:9400/api/import/progress/9e84bde1-773d-4bd4-8d8b-5e5e10ea679d';
  intervalId: any;

  progress = 0;
  status = 'Initializing...';
  totalJobs = 0;
  processedJobs = 0;
  failedJobs = 0;
  isMock = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchProgress();
    this.intervalId = setInterval(() => this.fetchProgress(), 2000);
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  fetchProgress() {
    this.http.get<any>(this.apiUrl).subscribe((data) => {
      this.progress = data.progress;
      this.status = data.status;
      this.totalJobs = data.totalJobs;
      this.processedJobs = data.processedJobs;
      this.failedJobs = data.failedJobs;
      this.isMock = !!data.mock;
    });
  }
}
