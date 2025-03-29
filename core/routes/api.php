<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ImportController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('me', [AuthController::class, 'me']);
});

Route::get('import/start', [\App\Http\Controllers\ImportController::class, 'start']);
Route::post('import/stop', [\App\Http\Controllers\ImportController::class, 'stop']);
Route::get('import/status', [\App\Http\Controllers\ImportController::class, 'status']);
Route::get('import/progress/{id}', [\App\Http\Controllers\ImportController::class, 'progress']);


Route::get('test', [ImportController::class, 'test']);