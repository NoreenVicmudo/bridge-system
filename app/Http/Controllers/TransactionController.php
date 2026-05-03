<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search', '');
        $collegeFilter = $request->query('college', 'ALL'); 
        $programFilter = $request->query('program', 'ALL'); 
        $actionFilter = $request->query('action', 'ALL');
        
        // 🧠 FIXED: URL Sanitizer and Empty State Handling
        $rawSort = $request->query('sort', '');
        $cleanSortColumn = explode('?', $rawSort)[0];
        $direction = $request->query('direction', 'desc');

        // --- SUB-QUERIES ---
        $q1 = DB::table('user_generate_report_audit as t')
            ->leftJoin('users as u', 't.generated_by', '=', 'u.id')
            ->leftJoin('colleges as c', 'u.college_id', '=', 'c.college_id')
            ->select('t.id as log_id', 'u.name as user', 'c.name as college', 'u.college_id', 'u.program_id', 'u.position as role', DB::raw("'REPORT GENERATION' as action"), 't.batch as target_entity', 't.remarks', 't.generated_at as created_at');

        $q2 = DB::table('user_auth_audit as t')
            ->leftJoin('users as u', 't.action_by', '=', 'u.id')
            ->leftJoin('colleges as c', 'u.college_id', '=', 'c.college_id')
            ->select('t.id as log_id', 'u.name as user', 'c.name as college', 'u.college_id', 'u.program_id', 'u.position as role', DB::raw("'ACTIVITY LOG' as action"), DB::raw("'System' as target_entity"), 't.remarks', 't.action_at as created_at');

        $q3 = DB::table('user_manage_audit as t')
            ->leftJoin('users as u', 't.action_by', '=', 'u.id')
            ->leftJoin('colleges as c', 'u.college_id', '=', 'c.college_id')
            ->select('t.id as log_id', 'u.name as user', 'c.name as college', 'u.college_id', 'u.program_id', 'u.position as role', DB::raw("'USER MANAGEMENT' as action"), 't.user_username as target_entity', 't.remarks', 't.action_at as created_at');

        $q4 = DB::table('user_additional_entry_audit as t')
            ->leftJoin('users as u', 't.updated_by', '=', 'u.id')
            ->leftJoin('colleges as c', 'u.college_id', '=', 'c.college_id')
            ->select('t.id as log_id', 'u.name as user', 'c.name as college', 'u.college_id', 'u.program_id', 'u.position as role', DB::raw("'ADDITIONAL ENTRY' as action"), 't.field as target_entity', 't.remarks', 't.updated_at as created_at');

        $q5 = DB::table('student_add_audit as t')
            ->leftJoin('users as u', 't.added_by', '=', 'u.id')
            ->leftJoin('colleges as c', 'u.college_id', '=', 'c.college_id')
            ->select('t.id as log_id', 'u.name as user', 'c.name as college', 'u.college_id', 'u.program_id', 'u.position as role', DB::raw("'ADD STUDENT' as action"), 't.student_number as target_entity', 't.remarks', 't.added_at as created_at');

        $q6 = DB::table('student_update_audit as t')
            ->leftJoin('users as u', 't.updated_by', '=', 'u.id')
            ->leftJoin('colleges as c', 'u.college_id', '=', 'c.college_id')
            ->select('t.id as log_id', 'u.name as user', 'c.name as college', 'u.college_id', 'u.program_id', 'u.position as role', DB::raw("'UPDATE STUDENT' as action"), 't.student_number as target_entity', 't.remarks', 't.updated_at as created_at');

        $q7 = DB::table('student_delete_audit as t')
            ->leftJoin('users as u', 't.deleted_by', '=', 'u.id')
            ->leftJoin('colleges as c', 'u.college_id', '=', 'c.college_id')
            ->select('t.id as log_id', 'u.name as user', 'c.name as college', 'u.college_id', 'u.program_id', 'u.position as role', DB::raw("'REMOVE STUDENT' as action"), 't.student_number as target_entity', 't.reason as remarks', 't.deleted_at as created_at');

        $q8 = DB::table('student_academic_audit as t')
            ->leftJoin('users as u', 't.updated_by', '=', 'u.id')
            ->leftJoin('colleges as c', 'u.college_id', '=', 'c.college_id')
            ->select('t.id as log_id', 'u.name as user', 'c.name as college', 'u.college_id', 'u.program_id', 'u.position as role', DB::raw("'ACADEMIC PROFILE' as action"), 't.student_number as target_entity', 't.remarks', 't.updated_at as created_at');

        $q9 = DB::table('student_program_audit as t')
            ->leftJoin('users as u', 't.updated_by', '=', 'u.id')
            ->leftJoin('colleges as c', 'u.college_id', '=', 'c.college_id')
            ->select('t.id as log_id', 'u.name as user', 'c.name as college', 'u.college_id', 'u.program_id', 'u.position as role', DB::raw("'PROGRAM METRICS' as action"), 't.student_number as target_entity', 't.remarks', 't.updated_at as created_at');

        // --- COMBINE QUERIES ---
        $combinedQuery = $q1->unionAll($q2)->unionAll($q3)->unionAll($q4)->unionAll($q5)->unionAll($q6)->unionAll($q7)->unionAll($q8)->unionAll($q9);

        // --- WRAP AND APPLY FILTERS ---
        $query = DB::table(DB::raw("({$combinedQuery->toSql()}) as unified_logs"))
            ->mergeBindings($combinedQuery);

        if (!empty($search)) {
            $query->where(function($q) use ($search) {
                $q->where('user', 'like', "%{$search}%")
                  ->orWhere('target_entity', 'like', "%{$search}%")
                  ->orWhere('remarks', 'like', "%{$search}%");
            });
        }

        if ($collegeFilter !== 'ALL') {
            $query->where('college_id', $collegeFilter);
        }

        if ($programFilter !== 'ALL') {
            $query->where('program_id', $programFilter);
        }

        if ($actionFilter !== 'ALL') {
            $query->where('action', $actionFilter);
        }

        // 🧠 FIXED: Dynamic sorting with fallback
        $allowedSorts = ['log_id', 'user', 'college', 'role', 'action', 'target_entity', 'created_at'];
        
        if (!empty($cleanSortColumn) && in_array($cleanSortColumn, $allowedSorts)) {
            $dir = in_array(strtolower($direction), ['asc', 'desc']) ? $direction : 'desc';
            $query->orderBy($cleanSortColumn, $dir);
        } else {
            // Default sort if no column is clicked
            $query->orderBy('created_at', 'desc');
        }

        $transactions = $query->paginate(15)->withQueryString(); 

        $transactions->getCollection()->transform(function ($item) {
            $item->college = $item->college ?? 'SYSTEM';
            return $item;
        });

        // 1. FETCH DYNAMIC OPTIONS FOR THE FRONTEND
        $dbColleges = DB::table('colleges')->select('college_id', 'name')->get();
        $dbPrograms = DB::table('programs')->select('program_id', 'college_id', 'name')->get();

        return Inertia::render('Transactions/TransactionLogs', [
            'transactions' => $transactions,
            'queryParams' => (object) request()->query(),
            'dbColleges' => $dbColleges,
            'dbPrograms' => $dbPrograms,
            'sort' => $cleanSortColumn,
            'direction' => $direction
        ]);
    }
}