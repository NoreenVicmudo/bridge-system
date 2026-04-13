<?php

namespace App\Providers;

use App\Socialite\MicrosoftProvider;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Laravel\Socialite\Facades\Socialite;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        Socialite::extend('microsoft', function ($app) {
            $config = $app['config']['services.microsoft'];

            return Socialite::buildProvider(MicrosoftProvider::class, $config);
        });
    }
}
