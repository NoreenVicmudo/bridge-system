<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Display the User List with search, sort, and pagination.
     */
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

        // Map frontend sort keys to database columns
        $sortMap = [
            'username' => 'u.username',
            'name' => 'u.name',
            'email' => 'u.email',
            'college' => 'c.name',
            'position' => 'u.position',
            'program' => 'p.name',
            'date_registered' => 'u.created_at',
        ];

        $actualSort = $sortMap[$sort] ?? 'u.created_at';
        $direction = in_array(strtolower($direction), ['asc', 'desc']) ? $direction : 'desc';

        $users = $query->orderBy($actualSort, $direction)
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('User/UserList', [
            'users' => $users,
            'queryParams' => (object) $request->query()
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create()
    {
        // Fetch dropdown options matching { value, label } format
        $colleges = DB::table('colleges')->select('college_id as value', 'name as label')->get();
        $programs = DB::table('programs')->select('program_id as value', 'name as label')->get();

        return Inertia::render('User/CreateUser', [
            'colleges' => $colleges,
            'programs' => $programs
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'fname'      => 'required|string|max:255',
            'lname'      => 'required|string|max:255',
            'username'   => 'required|string|max:50|unique:users,username',
            'email'      => 'required|string|email|max:255|unique:users,email',
            'password'   => 'required|string|min:8', 
            'college_id' => 'required_unless:level,0|nullable|integer',
            'program_id' => 'nullable|integer',
            'level'      => 'required|string|max:50',
        ]);

        $levelMap = [
            '0' => 'Super Admin',
            '1' => 'Admin',
            '2' => 'Dean',
            '3' => 'Program Head', 
        ];

        $fullName = trim($validated['fname'] . ' ' . $validated['lname']);

        User::create([
            'name'       => $fullName,
            'username'   => $validated['username'],
            'email'      => $validated['email'],
            'password'   => Hash::make($validated['password']), // Encrypt the password!
            'college_id' => $validated['level'] === '0' ? null : $validated['college_id'],
            'program_id' => $validated['level'] === '3' ? $validated['program_id'] : null,
            'position'   => $levelMap[$validated['level']] ?? 'Admin',
            'status'     => 'APPROVED', // Assuming direct adds from an admin are auto-approved
        ]);

        return redirect()->route('users.index')->with('success', 'User created successfully.');
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user)
    {
        // 1. Split the single 'name' column into first and last name
        $nameParts = explode(' ', $user->name, 2);
        
        // 2. Fetch the actual names for the read-only overview
        $college = DB::table('colleges')->where('college_id', $user->college_id)->first();
        $program = DB::table('programs')->where('program_id', $user->program_id)->first();

        // 3. Map Database string to React Form integer values
        $positionMap = [
            'Super Admin'  => '0',
            'Admin'        => '1',
            'Dean'         => '2',
            'Program Head' => '3',
            'Assistant'    => '3', // Mapping legacy 'Assistant' to 'Program Head'
        ];

        // 4. Construct the exact object UpdateUserForm.jsx expects
        $userData = [
            // Form Data
            'user_id' => $user->id,
            'user_username' => $user->username,
            'user_firstname' => $nameParts[0],
            'user_lastname' => $nameParts[1] ?? '',
            'user_college' => $user->college_id ?? '',
            'user_program' => $user->program_id ?? '',
            'user_level' => $positionMap[$user->position] ?? '',
            
            // Read-Only Overview Data
            'user_email' => $user->email,
            'college_name' => $college ? $college->name : 'SYSTEM',
            'position_name' => $user->position,
            'program_name' => $program ? $program->name : null,
        ];

        // 5. Fetch dropdown options matching { value, label } format
        $colleges = DB::table('colleges')->select('college_id as value', 'name as label')->get();
        $programs = DB::table('programs')->select('program_id as value', 'name as label')->get();

        return Inertia::render('User/EditUser', [
            'user' => $userData,
            'colleges' => $colleges,
            'programs' => $programs
        ]);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'fname'      => 'required|string|max:255',
            'lname'      => 'required|string|max:255',
            'college_id' => 'required_unless:level,0|nullable|integer', // Required unless Super Admin
            'program_id' => 'nullable|integer',
            'level'      => 'required|string|max:50',
        ]);

        // Map the React Form integer back to a Database string
        $levelMap = [
            '0' => 'Super Admin',
            '1' => 'Admin',
            '2' => 'Dean',
            '3' => 'Program Head', 
        ];

        // Recombine first and last name
        $fullName = trim($validated['fname'] . ' ' . $validated['lname']);

        $user->update([
            'name'       => $fullName,
            'college_id' => $validated['level'] === '0' ? null : $validated['college_id'], // Super Admins have no college
            'program_id' => $validated['level'] === '3' ? $validated['program_id'] : null, // Only Program Heads have programs
            'position'   => $levelMap[$validated['level']] ?? 'Admin',
        ]);

        return redirect()->route('users.index')->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified users from storage (Bulk Delete).
     */
    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:users,id'
        ]);

        // Prevent users from deleting themselves
        $idsToDelete = array_diff($request->ids, [auth()->id()]);

        if (count($idsToDelete) > 0) {
            User::whereIn('id', $idsToDelete)->delete();
            // AuditService::logUserManagement('Multiple Users', 'Bulk deleted ' . count($idsToDelete) . ' users');
        }

        return redirect()->route('users.index')->with('success', 'Users removed successfully.');
    }
}