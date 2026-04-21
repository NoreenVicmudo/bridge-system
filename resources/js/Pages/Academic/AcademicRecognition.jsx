import React, { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { TableContainer, SortableHeader } from "@/Components/ReusableTable";
import AcademicFilterModal from "@/Components/Modals/Academic/AcademicFilterModal";
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";
import FilterInfoCard from "@/Components/FilterInfoCard";
import RecognitionAddStudentModal from "@/Components/Modals/Academic/RecognitionAddStudentModal";

export default function AcademicRecognitionPage({ students, filter, search = "", sort = "", direction = "" }) {
    const { auth } = usePage().props;
    const isAcademicAffairs = ["Admin", "Academic Affairs"].includes(auth.user?.position);
    const canManageData = !isAcademicAffairs;

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
        'award_count': 'recognition_count' 
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
            router.get(route('academic.recognition'), params, { preserveState: true, preserveScroll: true, replace: true });
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
            'recognition_count': 'award_count'
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
        router.get(route('academic.recognition'), params, { preserveState: true, preserveScroll: true });
    };

    const handleApplyFilter = (newFilters) => {
        const params = { ...newFilters, search: searchQuery };
        if (actualSort) { params.sort = actualSort; params.direction = actualDirection; }
        router.get(route('academic.recognition'), params, { preserveState: true, preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Academic Recognition" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="Academic Recognition"
                    search={searchQuery} onSearch={handleSearch}
                    paginationData={students}
                    exportEndpoint={route('academic.recognition.export', { ...filter, search: searchQuery, sort: actualSort, direction: actualDirection })}
                    filterDisplay={<FilterInfoCard filters={filter} mode="academic" />}
                    headerActions={
                        <>
                            <button onClick={() => setIsFilterModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-white text-[#5c297c] border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#5c297c] hover:text-white transition-all shadow-sm shrink-0">
                                <i className="bi bi-funnel-fill"></i> Filter
                            </button>
                            <button onClick={() => setIsMetricModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-[#5c297c] text-white border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#4a1f63] transition-all shadow-sm shrink-0">
                                <i className="bi bi-bar-chart-fill"></i> Change Metric
                            </button>
                        </>
                    }
                    footerActions={
                        canManageData ? (
                            <button onClick={() => setIsAddModalOpen(true)} className="px-6 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#4a1f63] transition-all shadow-sm">Manage Records</button>
                        ) : null
                    }
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase leading-normal">
                            <SortableHeader label="Student ID" sortKey="student_number" currentSort={activeFrontendSort} currentDirection={actualDirection} onSort={handleSort} className="bg-[#5c297c]" />
                            <SortableHeader label="Student Name" sortKey="name" currentSort={activeFrontendSort} currentDirection={actualDirection} onSort={handleSort} className="bg-[#5c297c]" />
                            <SortableHeader label="Dean's List" sortKey="recognition_count" currentSort={activeFrontendSort} currentDirection={actualDirection} onSort={handleSort} className="bg-[#5c297c] text-center [&>div]:justify-center" />
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {records.length > 0 ? records.map((student, i) => (
                            <tr key={student.id} className={`border-b border-gray-100 hover:bg-purple-50 transition-all ${i % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}>
                                <td className="py-3 px-6">
                                    {canManageData ? (
                                        <Link href={route('academic.recognition.entry', { student_id: student.id })} className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold hover:bg-[#e0a800] transition-all text-center">{student.student_number}</Link>
                                    ) : (
                                        <span className="inline-block px-4 py-1.5 rounded-[6px] bg-gray-400 text-white font-bold text-center shadow-sm">{student.student_number}</span>
                                    )}
                                </td>
                                <td className="py-3 px-6 text-gray-800 uppercase font-bold">{student.name}</td>
                                <td className="py-3 px-6 text-center"><span className="text-gray-700 font-bold text-base">{student.recognition_count > 0 ? student.recognition_count : "-"}</span></td>
                            </tr>
                        )) : (
                            <tr><td colSpan={3} className="py-8 text-center text-gray-500 italic">No records found.</td></tr>
                        )}
                    </tbody>
                </TableContainer>

                <AcademicFilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} currentFilters={filter} onApply={handleApplyFilter} />
                <ChangeMetricModal isOpen={isMetricModalOpen} onClose={() => setIsMetricModalOpen(false)} currentMetric="Academic Recognition" filterData={filter} />
                {canManageData && <RecognitionAddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} currentFilter={filter} />}
            </div>
        </AuthenticatedLayout>
    );
}