import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './import.component.html',
})
export class ImportComponent implements OnInit, OnDestroy {
  // Update the endpoints to match the new backend routes.
  private startImportUrl = 'http://localhost:9400/api/import/start';
  private statusUrl = 'http://localhost:9400/api/import/status';
  private progressUrl = 'http://localhost:9400/api/import/progress';
  intervalId: any;

  progress = 0;
  status = 'Idle';
  totalJobs = 0;
  processedJobs = 0;
  failedJobs = 0;
  isMock = false;
  batchId: string | null = null;
  isRunning = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Only check if an import is already running without starting a new one.
    this.checkExistingImport();
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  /**
   * Starts a new import job by calling the dedicated endpoint.
   */
  startImport() {
    if (this.isRunning) return;

    this.http.post<any>(this.startImportUrl, {}).subscribe((res) => {
      this.batchId = res.batch_id;
      this.status = 'started';
      this.isRunning = true;
      this.startPolling();
    });
  }

  /**
   * Checks for an existing import job without starting a new one.
   */
  checkExistingImport() {
    this.http.get<any>(this.statusUrl).subscribe(
      (res) => {
        if (res.batch_id) {
          this.batchId = res.batch_id;
          this.isRunning = true;
          this.startPolling();
        }
      },
      (error) => {
        // Handle error if needed (for example, no job running)
        console.error('Error checking import status', error);
      }
    );
  }

  /**
   * Start polling the progress endpoint.
   */
  startPolling() {
    this.fetchProgress(); // initial call
    this.intervalId = setInterval(() => this.fetchProgress(), 2000);
  }

  /**
   * Fetches the progress of the current import batch.
   */
  fetchProgress() {
    if (!this.batchId) return;

    this.http
      .get<any>(`${this.progressUrl}/${this.batchId}`)
      .subscribe((data) => {
        this.progress = data.progress;
        this.status = data.status;
        this.totalJobs = data.totalJobs;
        this.processedJobs = data.processedJobs;
        this.failedJobs = data.failedJobs;
        this.isMock = !!data.mock;

        if (data.status === 'finished' || data.status === 'failed') {
          this.isRunning = false;
          clearInterval(this.intervalId);
        }
      });
  }
}
