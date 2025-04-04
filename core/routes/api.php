<?php

use App\Http\Controllers\AiApiGatewayController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\DatasetController;
use App\Http\Controllers\TestController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']); 
    });
});

Route::prefix('dataset')->group(function () {
    Route::get('random', [DatasetController::class, 'random']);
    Route::get('{id}/weather', [DatasetController::class, 'weather']);
    Route::get('{id}/traffic-signs', [AiApiGatewayController::class, '__invoke']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('me', [AuthController::class, 'me']); 
});

Route::get('import/start', [\App\Http\Controllers\ImportController::class, 'start']);
Route::post('import/stop', [\App\Http\Controllers\ImportController::class, 'stop']);
Route::get('import/status', [\App\Http\Controllers\ImportController::class, 'status']);
Route::get('import/progress/{id}', [\App\Http\Controllers\ImportController::class, 'progress']);
Route::get('import/start-with-progress', [\App\Http\Controllers\ImportController::class, 'startWithProgress']);

Route::get('test', [ImportController::class, 'test']);

Route::get('meteo', [TestController::class, 'test']);

