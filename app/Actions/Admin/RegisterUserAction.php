<?php

namespace App\Actions\Admin;

use App\Models\User;
use App\Models\AdminAuditLog;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class RegisterUserAction
{
    public function execute(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name'     => $data['name'],
                'username' => $data['username'],
                'email'    => $data['email'],
                'password' => Hash::make($data['password']),
                'position' => $data['position'],
                'status'   => 'PENDING' // CRITICAL: Locks the account initially
            ]);

            AdminAuditLog::create([
                'target_user'     => $user->username,
                'action_category' => 'SIGNUP',
                'remarks'         => 'Signup request',
            ]);

            return $user;
        });
    }
}