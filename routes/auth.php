<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Support\Facades\Route;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

Route::middleware('guest')->group(function () {
    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');

    Route::post('register', [RegisteredUserController::class, 'store']);

    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    // 1. The Redirect Route
    Route::get('/auth/microsoft', function () {
        return Socialite::driver('microsoft')->stateless()->redirect();
    });

    // 2. The Callback Route
    Route::get('/auth/microsoft/callback', function () {
        try {
            $azureUser = Socialite::driver('microsoft')->stateless()->user();

            // 1. Look for the user STRICTLY by the email the Superadmin inserted
            // Using ID first is highly recommended if available!
            $user = User::where('microsoft_id', $azureUser->getId())
                        ->orWhere('email', $azureUser->getEmail())
                        ->first();

            if ($user) {
                // 2. Link Microsoft ID if missing
                if (!$user->microsoft_id) {
                    $user->update(['microsoft_id' => $azureUser->getId()]);
                }

                // ==========================================
                // 3. FETCH AND SAVE THE PROFILE PICTURE
                // ==========================================
                try {
                    // Ask Microsoft Graph for the high-res photo using the user's token
                    $photoResponse = Http::withToken($azureUser->token)
                        ->get('https://graph.microsoft.com/v1.0/me/photo/$value');

                    if ($photoResponse->successful()) {
                        // Generate a unique filename using their ID
                        $filename = 'avatars/' . $azureUser->getId() . '.jpg';
                        
                        // Save the raw image data to storage/app/public/avatars
                        Storage::disk('public')->put($filename, $photoResponse->body());

                        // Update the database with the public URL path
                        $user->update(['avatar' => '/storage/' . $filename]);
                    }
                } catch (\Exception $photoException) {
                    // Silently ignore. If they don't have a photo, Microsoft returns a 404.
                    // We don't want to stop the login process just because of a missing picture.
                }
                // ==========================================

                // 4. Block REJECTED users
                if ($user->status === 'REJECTED') {
                    return redirect()->route('login')->withErrors([
                        'email' => 'Your account has been deactivated. Please contact the administrator.'
                    ]);
                }

                // 5. Log the user in
                Auth::login($user);

                AuditService::logUserAuth('Logged in via Microsoft SSO');

                return redirect()->route('main');
                
            } else {
                return redirect()->route('login')->withErrors([
                    'email' => 'Access Denied: Your email is not registered in the BRIDGE system. Please contact the Superadmin for access.'
                ]);
            }

        } catch (\Exception $e) {
            return redirect()->route('login')->withErrors([
                'email' => 'Failed to log in with Microsoft. Please try again.'
            ]);
        }
    });
    
    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');
});

Route::middleware('auth')->group(function () {
    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::put('password', [PasswordController::class, 'update'])->name('password.update');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
