import React, { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { TableContainer, SortableHeader } from "@/Components/ReusableTable";
import ProgramFilterModal from "@/Components/Modals/Program/ProgramFilterModal"; 
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";
import FilterInfoCard from "@/Components/FilterInfoCard";
import LicensureAddModal from "@/Components/Modals/Program/LicensureAddModal"; 

export default function LicensureExamPage({ students, filter, search = "", sort = "", direction = "asc", dbColleges = [], dbPrograms = [] }) {
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

    // 🧠 2. The Debounce Effect
    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            router.get(route('licensure.exam'), { ...filter, search: searchQuery, sort, direction }, { preserveState: true, preserveScroll: true, replace: true });
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // 🧠 3. Handlers using searchQuery
    const handleSearch = (val) => {
        const text = typeof val === 'string' ? val : val?.target?.value || "";
        setSearchQuery(text);
    };

    const handleSort = (key) => {
        const dbKeyMap = { 'student_number': 'student_info.student_number', 'name': 'student_info.student_lname', 'status': 'student_licensure_exam.exam_result' };
        const dbKey = dbKeyMap[key] || 'student_info.student_lname';
        const dir = sort === dbKey && direction === 'asc' ? 'desc' : 'asc';
        router.get(route('licensure.exam'), { ...filter, search: searchQuery, sort: dbKey, direction: dir }, { preserveState: true, preserveScroll: true });
    };

    const handleApplyFilter = (newFilters) => router.get(route('licensure.exam'), { ...newFilters, search: searchQuery, sort, direction }, { preserveState: true, preserveScroll: true });

    return (
        <AuthenticatedLayout>
            <Head title="Licensure Exam Results" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="Licensure Exam Results"
                    search={searchQuery} onSearch={handleSearch}
                    paginationData={students}
                    exportEndpoint={route('licensure.exam.export', filter)}
                    filterDisplay={<FilterInfoCard filters={enrichedFilter} mode="batch" />}
                    headerActions={
                        <>
                            <button onClick={() => setIsFilterModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-white text-[#5c297c] border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#5c297c] hover:text-white transition-all duration-300 shadow-sm"><i className="bi bi-funnel-fill"></i> Filter</button>
                            <button onClick={() => setIsMetricModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-[#5c297c] text-white border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#4a1f63] transition-all duration-300 shadow-sm"><i className="bi bi-bar-chart-fill"></i> Change Metric</button>
                        </>
                    }
                    footerActions={
                        canManageData ? (
                            <button onClick={() => setIsAddModalOpen(true)} className="px-6 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#ffb736] transition-all shadow-sm">Manage Records</button>
                        ) : null
                    }
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase leading-normal">
                            <SortableHeader label="Student ID" sortKey="student_number" currentSort={sort} currentDirection={direction} onSort={handleSort} />
                            <SortableHeader label="Student Name" sortKey="name" currentSort={sort} currentDirection={direction} onSort={handleSort} />
                            <SortableHeader label="Status" sortKey="status" currentSort={sort} currentDirection={direction} onSort={handleSort} className="text-center" />
                            <th className="py-3 px-6 font-bold text-center">Exam Date</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {records.length > 0 ? records.map((student, i) => (
                            <tr key={student.batch_id} className={`border-b border-gray-100 hover:bg-purple-50 transition-all duration-300 ${i % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}>
                                <td className="py-3 px-6">
                                    {canManageData ? (
                                        <Link href={route('licensure.exam.edit', student.batch_id)} className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold hover:bg-[#e0a800] hover:scale-105 transition-all text-center">{student.student_number}</Link>
                                    ) : (
                                        <span className="inline-block px-4 py-1.5 rounded-[6px] bg-gray-400 text-white font-bold text-center shadow-sm">{student.student_number}</span>
                                    )}
                                </td>
                                <td className="py-3 px-6 text-gray-800 uppercase font-bold">{student.name}</td>
                                <td className="py-3 px-6 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${student.status === "PASSED" ? "bg-green-100 text-green-700" : student.status === "FAILED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>{student.status}</span>
                                </td>
                                <td className="py-3 px-6 text-center text-gray-600">{student.exam_date}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={4} className="py-8 text-center text-gray-500 italic">No records found for the selected batch.</td></tr>
                        )}
                    </tbody>
                </TableContainer>

                <ProgramFilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} currentFilters={filter} onApply={handleApplyFilter} dbColleges={dbColleges} dbPrograms={dbPrograms} />
                <ChangeMetricModal isOpen={isMetricModalOpen} onClose={() => setIsMetricModalOpen(false)} currentMetric="Licensure Exam Results" type="program" filterData={filter} />
                {canManageData && <LicensureAddModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} currentFilter={filter} />}
            </div>
        </AuthenticatedLayout>
    );
}