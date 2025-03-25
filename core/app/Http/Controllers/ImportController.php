<?php

namespace App\Http\Controllers;

use Throwable;
use Illuminate\Bus\Batch;
use Illuminate\Http\Request;
use App\Jobs\ImportDatasetJob;
use App\Services\GithubService;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Response;

class ImportController extends Controller
{
    public function __invoke(GithubService $githubService)
    {
        if ($this->importAlreadyRunning()) {
            return response()->json(['message' => 'Import already running.'], 409);
        }

        $jobs = $this->buildImportJobs($githubService);

        $batch = Bus::batch($jobs)
            ->name('Dataset Import')
            ->then(fn() => $this->onBatchSuccess())
            ->catch(fn(Batch $batch, Throwable $e) => $this->onBatchFailure($e))
            ->dispatch();

        $this->lockBatch($batch->id);

        return response()->json([
            'message' => 'Import started.',
            'batch_id' => $batch->id,
        ]);
    }

    public function progress(string $id)
    {
        return Response::stream(function () use ($id) {
            $batch = Bus::findBatch($id);

            // 🔁 Simulate if batch is finished or missing
            if (!$batch || $batch->finished()) {
                $this->simulateProgress();
                return;
            }

            // 📡 Live tracking
            while (true) {
                $batch = Bus::findBatch($id);

                if (!$batch) {
                    $this->sendSseEvent('error', ['error' => 'Batch not found']);
                    break;
                }

                $this->sendSseEvent('update', $this->formatBatchData($batch));

                if ($batch->finished()) {
                    $this->sendSseEvent('complete', ['done' => true]);
                    break;
                }

                sleep(1);
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
        ]);
    }

    // ────────────────────────────────────────────────────────────────────────────────
    // 🔧 Utility Methods
    // ────────────────────────────────────────────────────────────────────────────────

    private function buildImportJobs(GithubService $githubService): array
    {
        $cities = $githubService->getDatasetStructure();
        $jobs = [];

        foreach ($cities as $city => $datasets) {
            foreach ($datasets as $datasetPath) {
                $jobs[] = (new ImportDatasetJob($city, $datasetPath))->delay(now()->addSeconds(10));
            }
        }

        return $jobs;
    }

    private function lockBatch(string $batchId): void
    {
        Cache::put('import_in_progress', $batchId, now()->addHour());
    }

    private function importAlreadyRunning(): bool
    {
        return Cache::has('import_in_progress');
    }

    private function onBatchSuccess(): void
    {
        Log::info("✅ Import batch complete!");
        Cache::forget('import_in_progress');
    }

    private function onBatchFailure(Throwable $e): void
    {
        Log::error("❌ Import batch failed: " . $e->getMessage());
        Cache::forget('import_in_progress');
    }

    private function formatBatchData(Batch $batch): array
    {
        return [
            'status' => $batch->status,
            'progress' => $batch->progress(),
            'processedJobs' => $batch->processedJobs(),
            'totalJobs' => $batch->totalJobs,
            'failedJobs' => $batch->failedJobs,
        ];
    }

    private function sendSseEvent(string $event, array $data): void
    {
        echo "event: {$event}\n";
        echo 'data: ' . json_encode($data) . "\n\n";
        ob_flush();
        flush();
    }

    private function simulateProgress(): void
    {
        $progress = 0;
        $total = 500;

        while ($progress <= 100) {
            $this->sendSseEvent('update', [
                'status' => 'mocking',
                'progress' => $progress,
                'processedJobs' => intval($progress * ($total / 100)),
                'totalJobs' => $total,
                'failedJobs' => 0,
                'mock' => true,
            ]);

            if ($progress === 100) {
                $this->sendSseEvent('complete', ['done' => true, 'mock' => true]);
                break;
            }

            $progress += 5;
            sleep(1);
        }
    }
}
