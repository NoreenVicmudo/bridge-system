<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterUserRequest;
use App\Actions\Admin\RegisterUserAction;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request using our custom workflow.
     */
    public function store(RegisterUserRequest $request, RegisterUserAction $action): RedirectResponse
    {
        // 1. Action handles creation & sets to PENDING
        $user = $action->execute($request->validated());

        event(new Registered($user));

        // 2. Redirect without logging in!
        return redirect(route('login'))->with('status', 'Registration submitted. Please wait for an Admin to approve your account.');
    }
}