<?php

namespace App\Http\Controllers;

use App\Services\WeatherService;
use Illuminate\Support\Uri;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Http;

class TestController extends Controller
{
    public function test(){
        $date = "2015-12-25T14:53:46+01:0";
        $latitude = '47.6344031';
        $longitude = '6.8508721';

        $meteoService = new WeatherService;
        $meteoData = $meteoService->getMeteo($latitude, $longitude, $date);

        dd($meteoData);
    }
}
