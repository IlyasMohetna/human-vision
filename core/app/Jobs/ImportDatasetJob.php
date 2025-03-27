<?php

namespace App\Jobs;

use Illuminate\Bus\Batchable;
use App\Services\GithubService;
use Illuminate\Support\Facades\Log;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\Middleware\WithoutOverlapping;

class ImportDatasetJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels, Batchable;

    protected string $city;
    protected string $datasetPath;

    /**
     * Create a new job instance.
     */
    public function __construct(string $city, string $datasetPath)
    {
        $this->city = $city;
        $this->datasetPath = $datasetPath;
    }

    /**
     * Execute the job.
     */
    public function handle(GithubService $githubService): void
    {
        // Check for cancellation before processing.
        if ($this->batch() && $this->batch()->cancelled()) {
            Log::info("Batch cancelled for {$this->city} - {$this->datasetPath} before processing.");
            return;
        }

        $files = $githubService->listContents($this->datasetPath);

        foreach ($files as $file) {
            // Periodically check if the batch has been cancelled.
            if ($this->batch() && $this->batch()->cancelled()) {
                Log::info("Batch cancelled during processing for {$this->city} - {$this->datasetPath}.");
                return;
            }
            if ($file['type'] !== 'file') continue;

            $filePath = $file['path'];
            $fileName = basename($filePath);
            $content = $githubService->downloadFile($file);

            if (!$content) {
                Log::warning("Skipping file due to download failure: $filePath");
                continue;
            }

            $datasetId = basename($this->datasetPath);
            $storagePath = "{$this->city}/{$datasetId}/{$fileName}";

            Storage::put($storagePath, $content);
        }
    }

    public function middleware(): array
    {
        return [
            // Prevent same dataset from running multiple times concurrently
            new WithoutOverlapping($this->city . '_' . basename($this->datasetPath)),
        ];
    }
}
