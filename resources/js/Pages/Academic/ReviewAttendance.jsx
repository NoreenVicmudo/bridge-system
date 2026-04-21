import React, { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { TableContainer, SortableHeader } from "@/Components/ReusableTable";
import AcademicFilterModal from "@/Components/Modals/Academic/AcademicFilterModal";
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";
import FilterInfoCard from "@/Components/FilterInfoCard";
import AttendanceAddStudentModal from "@/Components/Modals/Academic/AttendanceAddStudentModal";

export default function ReviewAttendance({ students, filter, search = "", sort = "", direction = "" }) {
    const records = students?.data || [];
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState(search);
    const initialRender = useRef(true);

    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const actualSort = sort || urlParams.get('sort') || "";
    const actualDirection = direction || urlParams.get('direction') || "asc";

    const reverseDbKeyMap = {
        'student_info.student_number': 'student_number',
        'student_info.student_lname': 'name',
        'attended': 'attended',
        'total': 'total',
        'percentage': 'percentage'
    };
    const activeFrontendSort = reverseDbKeyMap[actualSort] || actualSort;

    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            const params = { ...filter, search: searchQuery };
            if (actualSort) { params.sort = actualSort; params.direction = actualDirection; }
            router.get(route('review.attendance'), params, { preserveState: true, preserveScroll: true, replace: true });
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSearch = (val) => {
        const text = typeof val === 'string' ? val : val?.target?.value || "";
        setSearchQuery(text);
    };

    const handleSort = (key) => {
        const dbKeyMap = {
            'student_number': 'student_info.student_number',
            'name': 'student_info.student_lname',
            'attended': 'attended',
            'total': 'total',
            'percentage': 'percentage'
        };
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
        router.get(route('review.attendance'), params, { preserveState: true, preserveScroll: true });
    };

    const handleApplyFilter = (newFilters) => {
        const params = { ...newFilters, search: searchQuery };
        if (actualSort) { params.sort = actualSort; params.direction = actualDirection; }
        router.get(route('review.attendance'), params, { preserveState: true, preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Attendance in Review Classes" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="Attendance in Review Classes"
                    search={searchQuery} onSearch={handleSearch}
                    paginationData={students}
                    exportEndpoint={route('review.attendance.export', { ...filter, search: searchQuery, sort: actualSort, direction: actualDirection })}
                    filterDisplay={<FilterInfoCard filters={filter} mode="academic" />}
                    headerActions={
                        <>
                            <button onClick={() => setIsFilterModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-white text-[#5c297c] border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#5c297c] hover:text-white transition-all shadow-sm">
                                <i className="bi bi-funnel-fill"></i> Filter 
                            </button>
                            <button onClick={() => setIsMetricModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-[#5c297c] text-white border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#4a1f63] transition-all shadow-sm">
                                <i className="bi bi-bar-chart-fill"></i> Change Metric
                            </button>
                        </>
                    }
                    footerActions={
                        <button onClick={() => setIsAddModalOpen(true)} className="px-6 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#4a1f63] transition-all">
                            Manage Records
                        </button>
                    }
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase">
                            <SortableHeader label="Student ID" sortKey="student_number" currentSort={activeFrontendSort} currentDirection={actualDirection} onSort={handleSort} className="sticky left-0 bg-[#5c297c] z-20 w-[150px]" />
                            <SortableHeader label="Student Name" sortKey="name" currentSort={activeFrontendSort} currentDirection={actualDirection} onSort={handleSort} className="sticky left-[150px] bg-[#5c297c] z-20 w-[250px] shadow-md" />
                            <SortableHeader label="Attended" sortKey="attended" currentSort={activeFrontendSort} currentDirection={actualDirection} onSort={handleSort} className="bg-[#5c297c] text-center [&>div]:justify-center" />
                            <SortableHeader label="Total" sortKey="total" currentSort={activeFrontendSort} currentDirection={actualDirection} onSort={handleSort} className="bg-[#5c297c] text-center [&>div]:justify-center" />
                            <SortableHeader label="Percentage" sortKey="percentage" currentSort={activeFrontendSort} currentDirection={actualDirection} onSort={handleSort} className="bg-[#5c297c] text-center [&>div]:justify-center" />
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {records.length > 0 ? records.map((student, i) => (
                            <tr key={student.id} className={`border-b hover:bg-purple-50 transition-all ${i % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}>
                                <td className="py-3 px-6 sticky left-0 bg-inherit z-10">
                                    <Link href={route('review.attendance.entry', { student_id: student.id })} className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold hover:bg-[#e0a800] transition-all text-center">{student.student_number}</Link>
                                </td>
                                <td className="py-3 px-6 text-gray-800 uppercase font-bold sticky left-[150px] bg-inherit z-10 shadow-md">{student.name}</td>
                                <td className="py-3 px-6 text-center">{student.attended}</td>
                                <td className="py-3 px-6 text-center">{student.total}</td>
                                <td className="py-3 px-6 text-center font-bold">
                                    <span className={student.percentage < 80 ? "text-red-500" : "text-[#5c297c]"}>{student.percentage}%</span>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={5} className="py-8 text-center text-gray-500 italic">No records found.</td></tr>
                        )}
                    </tbody>
                </TableContainer>

                <AcademicFilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} currentFilters={filter} onApply={handleApplyFilter} />
                <ChangeMetricModal isOpen={isMetricModalOpen} onClose={() => setIsMetricModalOpen(false)} currentMetric="Attendance in Review Classes" filterData={filter} />
                <AttendanceAddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} currentFilter={filter} />
            </div>
        </AuthenticatedLayout>
    );
}