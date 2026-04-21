<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request with Approval Check.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        // 1. Standard Breeze Auth
        $request->authenticate();

        // 2. Our Bouncer Check
        $user = Auth::user();
        if ($user->status !== 'APPROVED') {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'Your account is currently ' . strtolower($user->status) . '.',
            ]);
        }

        // 3. Let them in
        $request->session()->regenerate();

        \App\Services\AuditService::logUserAuth('Logged in via standard authentication');
        return redirect()->intended(route('dashboard', absolute: false));
    }

    public function destroy(Request $request)
    {
        \App\Services\AuditService::logUserAuth('Logged out of the system');

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // 🧠 THE FIX: Use Inertia::location to force a hard browser refresh.
        // This instantly stops the nprogress bar and clears all React memory.
        return Inertia::location(route('login'));
    }
}