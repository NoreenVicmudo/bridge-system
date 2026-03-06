<?php

namespace App\Actions\Admin;

use App\Models\User;
use App\Models\AdminAuditLog;
use Illuminate\Support\Facades\Auth;

class ReviewUserSignupAction
{
    public function execute(User $targetUser, string $newStatus): User
    {
        $targetUser->update(['status' => $newStatus]);

        AdminAuditLog::create([
            'target_user'     => $targetUser->username,
            'action_category' => 'USER LIST',
            'remarks'         => $newStatus === 'APPROVED' ? 'Approve user signup' : 'Reject user signup',
            'action_by'       => Auth::id()
        ]);

        return $targetUser;
    }
}