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
    public function handle(Request $request, Closure $next, string $role): Response
    {
        // If the logged-in user does NOT have the required position...
        if ($request->user()->position !== $role) {
            
            // Abort with a 403 Forbidden error
            abort(403, 'You do not have permission to access this page.');
        }

        return $next($request);
    }
}
