<?php
use App\Http\Controllers\SettlementController;
use Illuminate\Support\Facades\Route;
Route::post('/settlements', SettlementController::class)->middleware('throttle:calculations');
