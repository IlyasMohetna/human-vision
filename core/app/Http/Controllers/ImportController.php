<?php

namespace App\Http\Controllers;

use Throwable;
use Illuminate\Bus\Batch;
use Illuminate\Http\Request;
use App\Jobs\ImportDatasetJob;
use App\Jobs\SyncDatasetToDatabaseJob;
use App\Services\GithubService;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Response;

class ImportController extends Controller
{
    public function start(GithubService $githubService)
    {
        $lockKey = 'import_in_progress';

        // If an import is already running, return its batch ID.
        if (Cache::has($lockKey)) {
            return response()->json([
                'message'  => 'Import already running.',
                'batch_id' => Cache::get($lockKey),
            ], 200);
        }

        $jobs = $this->buildImportJobs($githubService);

        $batch = Bus::batch($jobs)
            ->name('Dataset Download')
            ->then(function (Batch $batch) {
                Log::info("✅ Download batch complete! Dispatching sync job...");
                dispatch(new SyncDatasetToDatabaseJob());
                Cache::forget('import_in_progress');
            })
            ->catch(function (Batch $batch, Throwable $e) {
                Log::error("❌ Download batch failed: " . $e->getMessage());
                Cache::forget('import_in_progress');
            })
            ->dispatch();

        Cache::put($lockKey, $batch->id, now()->addHour());

        return response()->json([
            'message'  => 'Download started.',
            'batch_id' => $batch->id,
        ]);
    }

    public function stop(Request $request)
    {
        $lockKey = 'import_in_progress';

        if (Cache::has($lockKey)) {
            $batchId = Cache::get($lockKey);
            $batch = Bus::findBatch($batchId);

            if ($batch && !$batch->cancelled()) {
                $batch->cancel();
            }
            Cache::forget($lockKey);

            return response()->json([
                'message'  => 'Import batch has been cancelled.',
                'batch_id' => $batchId,
            ]);
        }

        return response()->json(['message' => 'No import batch is currently running.'], 404);
    }

    public function status()
    {
        $lockKey = 'import_in_progress';

        if (Cache::has($lockKey)) {
            return response()->json([
                'message'  => 'Import running.',
                'batch_id' => Cache::get($lockKey),
            ], 200);
        }

        return response()->json([
            'message'  => 'No import running.',
            'batch_id' => null,
        ], 200);
    }

    public function progress(string $id)
    {
        $batch = Bus::findBatch($id);

        if (!$batch) {
            $progress = now()->second % 101;

            return response()->json([
                'status'         => 'mocking',
                'progress'       => $progress,
                'processedJobs'  => intval($progress * 5),
                'totalJobs'      => 500,
                'failedJobs'     => 0,
                'mock'           => true,
            ]);
        }

        return response()->json($this->formatBatchData($batch));
    }

    private function buildImportJobs(GithubService $githubService): array
    {
        $cities = $githubService->getDatasetStructure();
        $jobs = [];

        foreach ($cities as $city => $datasets) {
            foreach ($datasets as $datasetPath) {
                $jobs[] = new ImportDatasetJob($city, $datasetPath);
            }
        }

        return $jobs;
    }

    private function formatBatchData(Batch $batch): array
    {
        return [
            'status'        => $batch->status,
            'progress'      => $batch->progress(),
            'processedJobs' => $batch->processedJobs(),
            'totalJobs'     => $batch->totalJobs,
            'failedJobs'    => $batch->failedJobs,
        ];
    }
}
