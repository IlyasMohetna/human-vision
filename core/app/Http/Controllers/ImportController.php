<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\GithubService;
use Illuminate\Http\StreamedEvent;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class ImportController extends Controller
{
    public function __invoke(Request $request)
    {
        $importId = (string) Str::uuid();

        // Store a "running" flag (or "stop" == false). We'll use this to check cancellation.
        Cache::put("import-status:{$importId}", 'running', 300);

        // Example array of data to import. In your case, you might fetch from GitHubService, etc.
        // E.g.: $cities = (new GithubService)->getCities();
        $cities = ['CityA', 'CityB', 'CityC', 'CityD'];

        // Return an eventStream response (Laravel 10+).
        return response()->eventStream(function () use ($cities, $importId) {
            $total = count($cities);
            $processed = 0;

            // Iterate the dataset
            foreach ($cities as $city) {
                // Check if a stop was requested
                $status = Cache::get("import-status:{$importId}");
                if ($status === 'stopped') {
                    // Emit a final event to let the client know we're stopping
                    yield new StreamedEvent(
                        event: 'update',
                        data: json_encode([
                            'status' => 'stopped',
                            'processed' => $processed,
                            'total' => $total,
                        ])
                    );
                    // End the function => close the stream
                    return;
                }

                // ... DO IMPORT LOGIC HERE ...
                // E.g. call some service, store data, etc.

                $processed++;

                // yield an SSE chunk with progress
                yield new StreamedEvent(
                    event: 'update',
                    data: json_encode([
                        'status' => 'running',
                        'processed' => $processed,
                        'total' => $total,
                        'city' => $city,
                    ])
                );

                // Simulate a delay for demonstration
                sleep(2);
            }
        }, endStreamWith: new StreamedEvent(
            event: 'update',
            data: json_encode(['status' => 'done'])
        ));
    }

    // Endpoint to stop the import
    public function stop(Request $request)
    {
        $importId = $request->input('importId');

        // Mark it as stopped
        Cache::put("import-status:{$importId}", 'stopped', 300);

        return response()->json(['message' => 'Stop request acknowledged.']);
    }
}
