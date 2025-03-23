<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\GithubService;

class ImportController extends Controller
{
    public function __invoke(GithubService $github)
    {
        $cities = $github->getCities();
        dd($cities);
    }
}
