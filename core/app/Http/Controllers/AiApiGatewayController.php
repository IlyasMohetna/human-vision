<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AiApiGatewayController extends Controller
{
    public function __invoke(int $dataset_id)
    {
        $response = Http::post('http://humanvision_ai_api:8000/predict', [
            'dataset_id' => $dataset_id,
        ]);
        if ($response->successful()) {
            return response()->json([
                'data'    => $response->json(),
            ]);
        }
    }
}
