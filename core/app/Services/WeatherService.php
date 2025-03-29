<?php

namespace App\Services;

use Illuminate\Support\Uri;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;

class WeatherService {
    public function getMeteo($latitude, $longitude, $date){
        $date = Carbon::parse($date);

        $url = Uri::of('https://archive-api.open-meteo.com/v1/archive')->withQuery([
            'latitude' => $latitude,
            'longitude' => $longitude,
            'start_date' => $date->format('Y-m-d'),
            'end_date' => $date->format('Y-m-d'),
            'hourly' => 'temperature_2m,weather_code'
        ]);

        $response = Http::get($url);
        $data = $response->json();
        $nearestHour = $date->ceilHour()->format('Y-m-d\TH:i');

        $appliedIndex = array_search($nearestHour, $data['hourly']['time']);

        $result = [
            'time' => $nearestHour,
            'temperature' => $data['hourly']['temperature_2m'][$appliedIndex],
            'weather_code' => $data['hourly']['weather_code'][$appliedIndex],
        ];

        return $result; 
    }
}