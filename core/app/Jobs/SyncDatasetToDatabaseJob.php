<?php

namespace App\Jobs;

use App\Models\Annotation;
use App\Models\City;
use App\Models\Dataset;
use App\Models\Variant;
use App\Models\VariantType;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Schema;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SyncDatasetToDatabaseJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 1;
    public $timeout = 0;

    public function handle(): void
    {
        try {
            Log::info('Starting SyncDatasetToDatabaseJob');

            Schema::disableForeignKeyConstraints();
            Dataset::truncate();
            Variant::truncate();
            Annotation::truncate();
            Schema::enableForeignKeyConstraints();
            Log::info('Truncated dataset, variant, and annotation tables');

            $storage = Storage::disk('public');
            $cities = $storage->directories();

            foreach ($cities as $cityname) {
                Log::debug("Processing city: {$cityname}");

                $city = City::where('name', $cityname)->first();
                if (!$city) {
                    throw new \Exception("City not found: {$cityname}");
                }

                $datasets = $storage->directories($cityname);
                foreach ($datasets as $dataset) {
                    $this->processDataSet($dataset, $city);
                }
            }

            Log::info('SyncDatasetToDatabaseJob completed successfully');
        } catch (\Throwable $e) {
            Log::error('SyncDatasetToDatabaseJob failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    public function processDataSet($dataset, City $city)
    {
        try {
            Log::debug("Processing dataset: {$dataset} for city: {$city->name}");

            $datasetModel = Dataset::create(['city_id' => $city->id]);

            $files = Storage::disk('public')->files($dataset);

            // Main image
            $mainImageMatches = preg_grep('/leftImg8bit/i', $files);
            $mainImage = reset($mainImageMatches);
            $mainImagePath = Storage::disk('public')->path($mainImage);
            $metaData = $this->getMetaData($mainImagePath);

            if (!$metaData) {
                throw new \Exception("Meta data not found for file: {$mainImage}");
            }

            // Vehicle JSON
            $vehicleMatches = preg_grep('/vehicle.json/i', $files);
            $vehicleJsonPath = reset($vehicleMatches);
            $vehicleJsonData = $vehicleJsonPath ? Storage::disk('public')->json($vehicleJsonPath) : [];

            // Polygon JSON
            $polygonMatches = preg_grep('/polygons.json/i', $files);
            $polygonJsonPath = reset($polygonMatches);
            $polygonJsonData = Storage::disk('public')->json($polygonJsonPath);

            if (!$polygonJsonData || !is_array($polygonJsonData)) {
                throw new \Exception("Invalid polygon data for: {$polygonJsonPath}");
            }

            $polygonJsonData['dataset_id'] = $datasetModel->id;
            $polygonJsonData['meta'] = reset($metaData);
            $polygonJsonData['vehicle'] = $vehicleJsonData;

            foreach ($polygonJsonData['objects'] as &$object) {
                if (!isset($object['objectId'])) {
                    $object = ['objectId' => uniqid('obj_', true)] + $object;
                }
            }

            Annotation::create($polygonJsonData);

            foreach ($files as $file) {
                if (Str::contains($file, ['polygons.json', 'vehicle.json'])) {
                    continue;
                }

                $variantTypeId = $this->getVariantTypeIdFromImgName($file);

                Variant::create([
                    'path' => $file,
                    'type_id' => $variantTypeId,
                    'dataset_id' => $datasetModel->id,
                ]);
            }

            Log::debug("Finished dataset: {$dataset}");
        } catch (\Throwable $e) {
            Log::error("Error processing dataset: {$dataset}", [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    public function getMetaData($file)
    {
        try {
            $escapedPath = escapeshellarg($file);
            $output = [];

            exec("exiftool -j -n {$escapedPath}", $output);
            $json = implode("\n", $output);
            $data = json_decode($json, true);

            return $data;
        } catch (\Throwable $e) {
            Log::error("Error reading metadata from: {$file}", [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return null;
        }
    }

    public function getVariantTypeIdFromImgName($imgName)
    {
        $mapping = [
            'leftImg8bit'        => 1,
            'gtFine_color'       => 2,
            'gtFine_instanceIds' => 3,
            'gtFine_labelIds'    => 4,
        ];

        foreach ($mapping as $key => $value) {
            if (Str::contains($imgName, $key)) {
                return $value;
            }
        }

        Log::error("Variant type not found for file: {$imgName}");
        throw new \Exception("Variant type not found: {$imgName}");
    }
}
