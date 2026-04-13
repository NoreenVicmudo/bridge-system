<?php

namespace App\Socialite;

use Laravel\Socialite\Two\AbstractProvider;
use Laravel\Socialite\Two\User;

class MicrosoftProvider extends AbstractProvider
{
    protected function getAuthUrl($state)
    {
        return $this->buildAuthUrlFromBase(
            'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
            $state
        );
    }

    protected function getTokenUrl()
    {
        return 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
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