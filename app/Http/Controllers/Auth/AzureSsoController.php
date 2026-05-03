<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Actions\Admin\ProcessMicrosoftSsoAction;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class AzureSsoController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('azure')->redirect();
    }

    public function handleCallback(ProcessMicrosoftSsoAction $action)
    {
        try {
            $azureUser = Socialite::driver('azure')->user();
            
            $user = $action->execute($azureUser);

            if ($user->status !== 'APPROVED') {
                // Kick them back to login with an error message
                return redirect()->route('login')->withErrors([
                    'email' => 'Your account is currently PENDING. An admin must approve your request before you can log in.',
                ]);
            }

            Auth::login($user);

            return redirect()->intended(route('dashboard', absolute: false));

        } catch (\Exception $e) {
            return redirect()->route('login')->withErrors([
                'email' => 'Microsoft Azure Authentication failed. Please try again.',
            ]);
        }
    }
}