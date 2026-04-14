import React, { useState } from "react";
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

    const handleSearch = (val) => router.get(route('review.center'), { ...filter, search: val, sort, direction }, { preserveState: true });

    const handleSort = (key) => {
        const dbKeyMap = { 'student_number': 'student_info.student_number', 'name': 'student_info.student_lname', 'review_center': 'student_review_center.review_center' };
        const dbKey = dbKeyMap[key] || 'student_info.student_lname';
        const dir = sort === dbKey && direction === 'asc' ? 'desc' : 'asc';
        router.get(route('review.center'), { ...filter, search, sort: dbKey, direction: dir }, { preserveState: true });
    };

    const handleApplyFilter = (newFilters) => router.get(route('review.center'), { ...newFilters, search, sort, direction }, { preserveState: true });

    return (
        <AuthenticatedLayout>
            <Head title="Student Review Center" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="Student Review Center"
                    search={search} onSearch={handleSearch}
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
                            <SortableHeader label="Student ID" sortKey="student_number" currentSort={sort} currentDirection={direction} onSort={handleSort} />
                            <SortableHeader label="Student Name" sortKey="name" currentSort={sort} currentDirection={direction} onSort={handleSort} />
                            <SortableHeader label="Review Center" sortKey="review_center" currentSort={sort} currentDirection={direction} onSort={handleSort} className="text-center" />
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