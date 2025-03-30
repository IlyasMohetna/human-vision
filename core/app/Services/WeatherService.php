<?php

namespace App\Services;

use Illuminate\Support\Uri;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;

class WeatherService {
    
    private $latitude;
    private $longitude;
    private $date;

    /**
     * Create a new service instance.
     *
     * @return void
     */
    public function __construct($latitude = null, $longitude = null, $date = null)
    {
        $this->latitude = $latitude;
        $this->longitude = $longitude;
        $this->date = $date;
    }

    public function getWeather(){
        $date = Carbon::parse($this->date);

        $url = Uri::of('https://archive-api.open-meteo.com/v1/archive')->withQuery([
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
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