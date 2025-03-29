<?php

namespace App\Jobs;

use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use PNGMetadata\PNGMetadata;
use CSD\Image\Format\PNG;

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
        foreach($files as $path){
            if(preg_match('/munster_000043_000019_leftImg8bit/i', $path) === 0){
                continue;
            }

            $file = Storage::disk('local')->path($path);
            $escapedPath = escapeshellarg($path);
            $output = [];

            exec("exiftool -j -n {$file}", $output);
            $json = implode("\n", $output);
            dd($json);
            // Check if file extension is jpg
            $png_metadata = new PNGMetadata($file);

            // dd($png_metadata->toArray());
            dd($file);
        }
    }
}
