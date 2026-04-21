<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // 🧠 Check if the user's position is in the array of allowed roles
        if (!in_array($request->user()->position, $roles)) {
            // Abort with a 403 Forbidden error
            abort(403, 'You do not have permission to access this page.');
        }

        return $next($request);
    }
}