<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'       => $this->id,
            'name'     => $this->name,
            'username' => $this->username,
            'email'    => $this->email,
            'position' => $this->position,
            'status'   => $this->status, // 'PENDING', 'APPROVED', etc.
            'joined'   => $this->created_at->format('M d, Y')
        ];
    }
}
