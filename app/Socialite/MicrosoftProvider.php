<?php

namespace App\Socialite;

use Laravel\Socialite\Two\AbstractProvider;
use Laravel\Socialite\Two\User;

class MicrosoftProvider extends AbstractProvider
{
    // 1. Add the scopes you need (openid, profile, email, and Graph API read access)
    protected $scopes = ['openid', 'profile', 'email', 'User.Read'];

    // 2. Microsoft requires scopes to be separated by a space
    protected $scopeSeparator = ' ';

    protected function getAuthUrl($state)
    {
        // Grab the tenant ID from the services config, fallback to 'common' if missing
        $tenant = config('services.microsoft.tenant', 'common');

        return $this->buildAuthUrlFromBase(
            "https://login.microsoftonline.com/{$tenant}/oauth2/v2.0/authorize",
            $state
        );
    }

    protected function getTokenUrl()
    {
        $tenant = config('services.microsoft.tenant', 'common');
        
        return "https://login.microsoftonline.com/{$tenant}/oauth2/v2.0/token";
    }

    protected function getUserByToken($token)
    {
        $response = $this->getHttpClient()->get(
            'https://graph.microsoft.com/v1.0/me',
            [
                'headers' => [
                    'Authorization' => 'Bearer ' . $token,
                ],
            ]
        );

        return json_decode($response->getBody(), true);
    }

    protected function mapUserToObject(array $user)
    {
        return (new User)->setRaw($user)->map([
            'id' => $user['id'],
            'name' => $user['displayName'] ?? null,
            'email' => $user['mail'] ?? $user['userPrincipalName'] ?? null,
        ]);
    }
}