import React, { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { TableContainer, SortableHeader } from "@/Components/ReusableTable";
import ProgramFilterModal from "@/Components/Modals/Program/ProgramFilterModal"; 
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";
import FilterInfoCard from "@/Components/FilterInfoCard";
import ReviewCenterAddModal from "@/Components/Modals/Program/ReviewCenterAddModal";

export default function ReviewCenterPage({ students, filter, search = "", sort = "", direction = "asc", dbColleges = [], dbPrograms = [] }) {
    // --- RBAC ---
    const { auth } = usePage().props;
    const isAcademicAffairs = ["Admin", "Academic Affairs"].includes(auth.user?.position);
    const canManageData = !isAcademicAffairs;

    const records = students?.data || [];
    
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const enrichedFilter = {
        ...filter,
        batch_year: filter?.calendar_year,
        board_batch: filter?.batch_number,
        batch_college_name: dbColleges.find(c => c.value == filter?.college || c.college_id == filter?.college)?.label || filter?.college,
        batch_program_name: dbPrograms.find(p => p.program_id == filter?.program)?.name || filter?.program,
    };

    // 🧠 1. Setup local state and debounce ref
    const [searchQuery, setSearchQuery] = useState(search);
    const initialRender = useRef(true);

    // 🧠 THE FIX: Read directly from URL to prevent backend defaults from keeping the arrow "stuck"
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const actualSort = urlParams.get('sort') || ""; 
    const actualDirection = urlParams.get('direction') || "asc";

    // 🧠 2. Reverse Map for Active Arrow Indicator
    const reverseDbKeyMap = {
        'student_info.student_number': 'student_number',
        'student_info.student_lname': 'name',
        'student_review_center.review_center': 'review_center'
    };
    const activeFrontendSort = reverseDbKeyMap[actualSort] || actualSort;

    // 🧠 3. The Debounce Effect
    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            const params = { ...filter, search: searchQuery };
            if (actualSort) { params.sort = actualSort; params.direction = actualDirection; }
            router.get(route('review.center'), params, { preserveState: true, preserveScroll: true, replace: true });
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // 🧠 4. Handlers using searchQuery
    const handleSearch = (val) => {
        const text = typeof val === 'string' ? val : val?.target?.value || "";
        setSearchQuery(text);
    };

    // 🧠 5. Handle 3-State Sorting (Asc -> Desc -> None)
    const handleSort = (key) => {
        const dbKeyMap = { 'student_number': 'student_info.student_number', 'name': 'student_info.student_lname', 'review_center': 'student_review_center.review_center' };
        
        // 🧠 THE FIX: Fall back to 'key' instead of defaulting to student name
        const dbKey = dbKeyMap[key] || key; 
        
        let nextDir = 'asc';
        let nextSort = dbKey;

        if (actualSort === dbKey) {
            if (actualDirection === 'asc') {
                nextDir = 'desc';
            } else {
                nextDir = null;
                nextSort = null;
            }
        }

        const params = { ...filter, search: searchQuery };
        if (nextSort) {
            params.sort = nextSort;
            params.direction = nextDir;
        }
        router.get(route('review.center'), params, { preserveState: true, preserveScroll: true });
    };

    const handleApplyFilter = (newFilters) => {
        const params = { ...newFilters, search: searchQuery };
        if (actualSort) { params.sort = actualSort; params.direction = actualDirection; }
        router.get(route('review.center'), params, { preserveState: true, preserveScroll: true });
    };
    
    return (
        <AuthenticatedLayout>
            <Head title="Student Review Center" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="Student Review Center"
                    search={searchQuery} onSearch={handleSearch}
                    paginationData={students}
                    exportEndpoint={route('review.center.export', filter)}
                    filterDisplay={<FilterInfoCard filters={enrichedFilter} mode="batch" />}
                    headerActions={
                        <>
                            <button onClick={() => setIsFilterModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-white text-[#5c297c] border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#5c297c] hover:text-white transition-all duration-300 ease-in-out shadow-sm shrink-0"><i className="bi bi-funnel-fill leading-none"></i><span className="leading-none">Filter</span></button>
                            <button onClick={() => setIsMetricModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-[#5c297c] text-white border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#4a1f63] transition-all duration-300 ease-in-out shadow-sm shrink-0"><i className="bi bi-bar-chart-fill leading-none"></i><span className="leading-none">Change Metric</span></button>
                        </>
                    }
                    footerActions={
                        canManageData ? (
                            <button onClick={() => setIsAddModalOpen(true)} className="px-6 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#4a1f63] transition-all duration-300 ease-in-out shadow-sm">Manage Records</button>
                        ) : null
                    }
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase leading-normal">
                            {/* 🧠 FIX: Passed actualDirection and activeFrontendSort so the arrows cycle perfectly */}
                            <SortableHeader label="Student ID" sortKey="student_number" currentSort={activeFrontendSort} currentDirection={actualDirection} onSort={handleSort} className="bg-[#5c297c]" />
                            <SortableHeader label="Student Name" sortKey="name" currentSort={activeFrontendSort} currentDirection={actualDirection} onSort={handleSort} className="bg-[#5c297c]" />
                            <SortableHeader label="Review Center" sortKey="review_center" currentSort={activeFrontendSort} currentDirection={actualDirection} onSort={handleSort} className="bg-[#5c297c] text-center [&>div]:justify-center" />
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {records.length > 0 ? records.map((student, i) => (
                            <tr key={student.batch_id} className={`border-b border-gray-100 hover:bg-purple-50 transition-all duration-300 ease-in-out ${i % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}>
                                <td className="py-3 px-6">
                                    {canManageData ? (
                                        <Link href={route('review.center.edit', student.batch_id)} className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold hover:bg-[#e0a800] hover:scale-105 hover:shadow-md transition-all duration-300 ease-in-out text-center">{student.student_number}</Link>
                                    ) : (
                                        <span className="inline-block px-4 py-1.5 rounded-[6px] bg-gray-400 text-white font-bold text-center shadow-sm">{student.student_number}</span>
                                    )}
                                </td>
                                <td className="py-3 px-6 text-gray-800 uppercase font-bold">{student.name}</td>
                                <td className={`py-3 px-6 text-center font-bold ${student.review_center === '—' ? 'text-gray-400 font-normal' : 'text-[#5c297c]'}`}>{student.review_center}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={3} className="py-8 text-center text-gray-500 italic">No students found for this batch.</td></tr>
                        )}
                    </tbody>
                </TableContainer>

                <ProgramFilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} currentFilters={filter} onApply={handleApplyFilter} dbColleges={dbColleges} dbPrograms={dbPrograms} />
                <ChangeMetricModal isOpen={isMetricModalOpen} onClose={() => setIsMetricModalOpen(false)} currentMetric="Review Center" type="program" filterData={filter} />
                {canManageData && <ReviewCenterAddModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} currentFilter={filter} />}
            </div>
        </AuthenticatedLayout>
    );
}