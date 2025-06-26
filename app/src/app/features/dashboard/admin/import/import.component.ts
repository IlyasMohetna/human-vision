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
  private startImportUrl = 'http://localhost:9400/api/import/start';
  private stopImportUrl = 'http://localhost:9400/api/import/stop';
  private statusUrl = 'http://localhost:9400/api/import/status';
  private progressUrl = 'http://localhost:9400/api/import/progress';
  private startWithProgressUrl = 'http://localhost:9400/api/import/start-with-progress';
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
    this.checkExistingImport();
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  /**
   * Starts a new import job.
   * Immediately disables the start button to prevent double-clicks.
   */
  startImport() {
    if (this.isRunning) return;
    this.isRunning = true;

    this.http.get<any>(this.startWithProgressUrl).subscribe(
      (res) => {
        this.batchId = res.batch_id;
        this.status = 'running';
        this.startPolling();
      },
      (error) => {
        console.error('Error starting import', error);
        this.isRunning = false;
      }
    );
  }

  /**
   * Stops/cancels the ongoing import job.
   */
  stopImport() {
    if (!this.isRunning) return;

    this.http.post<any>(this.stopImportUrl, {}).subscribe(
      (res) => {
        this.status = 'cancelled';
        this.isRunning = false;
        clearInterval(this.intervalId);
      },
      (error) => {
        console.error('Error stopping import', error);
      }
    );
  }

  /**
   * Checks if an import is already running.
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
        console.error('Error checking import status', error);
      }
    );
  }

  /**
   * Starts polling for progress updates.
   */
  startPolling() {
    this.fetchProgress();
    this.intervalId = setInterval(() => this.fetchProgress(), 2000);
  }

  /**
   * Fetches progress details from the backend.
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

        if (
          data.status === 'finished' ||
          data.status === 'failed' ||
          data.status === 'cancelled'
        ) {
          this.isRunning = false;
          clearInterval(this.intervalId);
        }
      });
  }
}
