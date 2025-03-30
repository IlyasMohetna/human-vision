<?php

namespace App\Http\Controllers;

use App\Http\Resources\DatasetResource;
use App\Models\Annotation;
use App\Models\Dataset;
use App\Models\Variant;
use App\Services\WeatherService;
use Illuminate\Http\Request;

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
        $dataset = Dataset::findOrFail($id);
        $annotation = $dataset->annotation;
        $metadata = $annotation->meta;
        $latitude = $annotation->vehicle['gpsLatitude'];
        $longitude = $annotation->vehicle['gpsLongitude'];
        $date = $metadata['Datecreate'];

        $weatherService = new WeatherService($latitude, $longitude, $date);
        $weather = $weatherService->getWeather();

        return response()->json($weather, 200);
    }
}
