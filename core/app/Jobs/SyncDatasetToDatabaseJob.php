<?php

namespace App\Jobs;

use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;

class SyncDatasetToDatabaseJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $storage = Storage::disk('local');
        $cities = $storage->directories();

        foreach($cities as $city){
            $datasets = $storage->directories($city);
            foreach($datasets as $dataset){
                $this->processDataSet($dataset);
                dd('stop');
            }
        }
    }

    public function processDataSet($dataset)
    {        
        $files = Storage::disk('local')->files($dataset);
        foreach($files as $file){
            dd($file);
        }
    }
}
