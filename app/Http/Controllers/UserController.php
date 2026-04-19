<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search', '');
        $sort = $request->query('sort', 'date_registered');
        $direction = $request->query('direction', 'desc');

        $query = DB::table('users as u')
            ->leftJoin('colleges as c', 'u.college_id', '=', 'c.college_id')
            ->leftJoin('programs as p', 'u.program_id', '=', 'p.program_id')
            ->select(
                'u.id',
                'u.username',
                'u.name',
                'u.email',
                DB::raw("COALESCE(c.name, 'SYSTEM') as college"),
                'u.position',
                DB::raw("COALESCE(p.name, 'N/A') as program"),
                DB::raw("DATE_FORMAT(u.created_at, '%Y-%m-%d %H:%i:%s') as date_registered")
            );

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('u.username', 'like', "%{$search}%")
                  ->orWhere('u.name', 'like', "%{$search}%")
                  ->orWhere('u.email', 'like', "%{$search}%");
            });
        }

        $sortMap = [
            'username' => 'u.username', 'name' => 'u.name', 'email' => 'u.email',
            'college' => 'c.name', 'position' => 'u.position', 'program' => 'p.name',
            'date_registered' => 'u.created_at',
        ];

        $actualSort = $sortMap[$sort] ?? 'u.created_at';
        $direction = in_array(strtolower($direction), ['asc', 'desc']) ? $direction : 'desc';

        $users = $query->orderBy($actualSort, $direction)->paginate(15)->withQueryString();

        return Inertia::render('User/UserList', ['users' => $users, 'queryParams' => (object) $request->query()]);
    }

    public function create()
    {
        $colleges = DB::table('colleges')->select('college_id as value', 'name as label')->get();
        // 🧠 FIXED: Added college_id to the query so React can filter the dropdown!
        $programs = DB::table('programs')->select('program_id as value', 'name as label', 'college_id')->get();

        return Inertia::render('User/CreateUser', ['colleges' => $colleges, 'programs' => $programs]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'fname'      => 'required|string|max:255',
            'lname'      => 'required|string|max:255',
            'username'   => 'required|string|max:50|unique:users,username',
            'email'      => 'required|string|email|max:255|unique:users,email',
            'password'   => 'required|string|min:8', 
            'position'   => 'required|string|max:50',
            'college_id' => 'nullable|integer',
            'program_id' => 'nullable|integer',
        ]);

        // 🧠 SECURITY: Strictly enforce what IDs get saved based on the role
        $needsCollege = in_array($validated['position'], ['Dean', 'Administrative Assistant', 'Program Head']);
        $needsProgram = $validated['position'] === 'Program Head';

        if ($needsCollege && empty($validated['college_id'])) return back()->withErrors(['college_id' => 'College is required for this position.']);
        if ($needsProgram && empty($validated['program_id'])) return back()->withErrors(['program_id' => 'Program is required for this position.']);

        User::create([
            'name'       => trim($validated['fname'] . ' ' . $validated['lname']),
            'username'   => $validated['username'],
            'email'      => $validated['email'],
            'password'   => Hash::make($validated['password']),
            'position'   => $validated['position'],
            'college_id' => $needsCollege ? $validated['college_id'] : null,
            'program_id' => $needsProgram ? $validated['program_id'] : null,
            'status'     => 'APPROVED', 
        ]);

        AuditService::logUserManagement($validated['username'], "Created new user account with role: {$validated['position']}");

        return redirect()->route('users.index')->with('success', 'User created successfully.');
    }

    public function edit(User $user)
    {
        $nameParts = explode(' ', $user->name, 2);
        $college = DB::table('colleges')->where('college_id', $user->college_id)->first();
        $program = DB::table('programs')->where('program_id', $user->program_id)->first();

        $userData = [
            'user_id' => $user->id,
            'user_username' => $user->username,
            'user_firstname' => $nameParts[0],
            'user_lastname' => $nameParts[1] ?? '',
            'user_college' => $user->college_id ?? '',
            'user_program' => $user->program_id ?? '',
            'user_position' => $user->position, // 🧠 FIXED: Using explicit string
            'user_email' => $user->email,
            'college_name' => $college ? $college->name : 'SYSTEM',
            'position_name' => $user->position,
            'program_name' => $program ? $program->name : null,
        ];

        $colleges = DB::table('colleges')->select('college_id as value', 'name as label')->get();
        $programs = DB::table('programs')->select('program_id as value', 'name as label', 'college_id')->get();

        return Inertia::render('User/EditUser', ['user' => $userData, 'colleges' => $colleges, 'programs' => $programs]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'fname'      => 'required|string|max:255',
            'lname'      => 'required|string|max:255',
            'position'   => 'required|string|max:50',
            'college_id' => 'nullable|integer',
            'program_id' => 'nullable|integer',
        ]);

        // 🧠 SECURITY: Strictly enforce what IDs get saved based on the role
        $needsCollege = in_array($validated['position'], ['Dean', 'Administrative Assistant', 'Program Head']);
        $needsProgram = $validated['position'] === 'Program Head';

        if ($needsCollege && empty($validated['college_id'])) return back()->withErrors(['college_id' => 'College is required for this position.']);
        if ($needsProgram && empty($validated['program_id'])) return back()->withErrors(['program_id' => 'Program is required for this position.']);

        $user->update([
            'name'       => trim($validated['fname'] . ' ' . $validated['lname']),
            'position'   => $validated['position'],
            'college_id' => $needsCollege ? $validated['college_id'] : null,
            'program_id' => $needsProgram ? $validated['program_id'] : null,
        ]);

        AuditService::logUserManagement($user->username, "Updated user account info/role to: {$validated['position']}");

        return redirect()->route('users.index')->with('success', 'User updated successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array', 
            'ids.*' => 'integer|exists:users,id',
            'reason_mode' => 'required|in:single,multiple', // From React
        ]);

        $idsToDelete = array_diff($request->ids, [auth()->id()]);
        
        if (count($idsToDelete) > 0) {
            $usersToDelete = User::whereIn('id', $idsToDelete)->get();
            
            foreach($usersToDelete as $u) {
                // Determine the reason sent by RemoveUserModal
                $reason = $request->reason_mode === 'single' 
                    ? $request->reason 
                    : ($request->per_reasons[$u->id] ?? 'No reason provided');
                
                // 🧠 NEW: Log the deletion WITH the specific reason!
                AuditService::logUserManagement($u->username, "Removed user account. Reason: {$reason}");
            }

            // Execute the bulk delete
            User::whereIn('id', $idsToDelete)->delete();
        }

        return redirect()->route('users.index')->with('success', 'Users removed successfully.');
    }

    public function acceptTos(Request $request)
    {
        $user = $request->user();
        
        $user->update([
            'tos_accepted_at' => now()
        ]);

        \App\Services\AuditService::logUserAuth('Accepted Terms of Service');

        return redirect()->back();
    }
}