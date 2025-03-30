<?php

namespace App\Http\Controllers;

use App\Models\Dataset;
use App\Models\Variant;
use App\Models\Annotation;
use Illuminate\Http\Request;
use App\Services\WeatherService;
use Illuminate\Support\Facades\Cache;
use App\Http\Resources\DatasetResource;

class DatasetController extends Controller
{
    private $allowedTypes = [
        'person',
        'rider',

        'cargroup',
        'car',
        'truck',
        'bus',
        'on rails',
        'motorcycle',
        'bicycle',
        'caravan',
        'trailer',

        'traffic sign',
        'traffic light',
    ];

    public function random()
    {
        $dataset = Dataset::where('status_id', 1)->with('city','variants.type')->inRandomOrder()->first();
        $annotation = $dataset->annotation;
        
        $annotation['objects'] = array_filter($annotation['objects'], function ($item) {
            return in_array($item['label'], $this->allowedTypes);
        });

        $dataset->annotation = $annotation;

        return response()->json(new DatasetResource($dataset), 200);
    }

    public function weather($id)
    {
        $cacheKey = "weather_dataset_$id";

        if (Cache::has($cacheKey)) {
            $weather = Cache::get($cacheKey);
            $fromCache = true;
        } else {
            $dataset = Dataset::findOrFail($id);
            $annotation = $dataset->annotation;
            $metadata = $annotation->meta;
            $latitude = $annotation->vehicle['gpsLatitude'];
            $longitude = $annotation->vehicle['gpsLongitude'];
            $date = $metadata['Datecreate'];
    
            $weatherService = new WeatherService($latitude, $longitude, $date);
            $weather = $weatherService->getWeather();
    
            Cache::put($cacheKey, $weather, now()->addMinutes(60));
            $fromCache = false;
        }
    
        return response()->json([
            'from_cache' => $fromCache,
            'data' => $weather
        ], 200);
    }
}
