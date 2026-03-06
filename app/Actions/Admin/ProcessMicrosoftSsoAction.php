<?php

namespace App\Actions\Admin;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Laravel\Socialite\Contracts\User as SocialiteUser;

class ProcessMicrosoftSsoAction
{
    public function execute(SocialiteUser $azureUser): User
    {
        return DB::transaction(function () use ($azureUser) {
            // 1. Check if the user already exists
            $user = User::where('microsoft_id', $azureUser->getId())
                        ->orWhere('email', $azureUser->getEmail())
                        ->first();

            if ($user) {
                if (!$user->microsoft_id) {
                    $user->update(['microsoft_id' => $azureUser->getId()]);
                }
                return $user;
            }

            // 2. Create a new user, locked out as PENDING
            // Note: Make sure 'status' and 'microsoft_id' are in your User model's $fillable array!
            $newUser = User::create([
                'name'         => $azureUser->getName(),
                'username'     => explode('@', $azureUser->getEmail())[0], 
                'email'        => $azureUser->getEmail(),
                'microsoft_id' => $azureUser->getId(),
                'password'     => null, 
                'position'     => 'Assistant', 
                'status'       => 'PENDING'    
            ]);

            // Optional: Insert your AdminAuditLog creation here if you created that model

            return $newUser;
        });
    }
}