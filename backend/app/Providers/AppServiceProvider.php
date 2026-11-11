<?php
namespace App\Providers;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
class AppServiceProvider extends ServiceProvider
{
 public function boot(): void
 {
  RateLimiter::for('calculations', fn (Request $request) => Limit::perMinute(30)->by($request->ip()));
 }
}
