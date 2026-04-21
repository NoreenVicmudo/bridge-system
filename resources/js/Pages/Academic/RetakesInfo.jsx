import React, { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { TableContainer, SortableHeader } from "@/Components/ReusableTable";
import AcademicFilterModal from "@/Components/Modals/Academic/AcademicFilterModal";
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";
import FilterInfoCard from "@/Components/FilterInfoCard";
import RetakesAddStudentModal from "@/Components/Modals/Academic/RetakesAddStudentModal";

export default function RetakesInfo({ students, subjects = [], filter, search = "", sort = "", direction = "" }) {
    const { auth } = usePage().props;
    const isAcademicAffairs = ["Admin", "Academic Affairs"].includes(auth.user?.position);
    const canManageData = !isAcademicAffairs;

    const records = students?.data || [];
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState("All");
    const [searchQuery, setSearchQuery] = useState(search);
    const initialRender = useRef(true);

    const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsSubjectDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const actualSort = sort || urlParams.get('sort') || "";
    const actualDirection = direction || urlParams.get('direction') || "asc";

    const reverseDbKeyMap = {
        'student_info.student_number': 'student_number',
        'student_info.student_lname': 'name',
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
            router.get(route('retakes.info'), params, { preserveState: true, preserveScroll: true, replace: true });
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
        router.get(route('retakes.info'), params, { preserveState: true, preserveScroll: true });
    };

    const handleApplyFilter = (newFilters) => {
        const params = { ...newFilters, search: searchQuery };
        if (actualSort) { params.sort = actualSort; params.direction = actualDirection; }
        router.get(route('retakes.info'), params, { preserveState: true, preserveScroll: true });
    };

    const visibleSubjects = selectedSubject === "All" ? subjects : subjects.filter(s => s === selectedSubject);

    return (
        <AuthenticatedLayout>
            <Head title="Back Subjects & Retakes" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="Back Subjects & Retakes"
                    search={searchQuery} onSearch={handleSearch}
                    paginationData={students}
                    exportEndpoint={route('retakes.export', { ...filter, search: searchQuery, sort: actualSort, direction: actualDirection, subject: selectedSubject })} 
                    filterDisplay={<FilterInfoCard filters={filter} mode="academic" />}
                    headerActions={
                        <>
                            {subjects.length > 0 && (
                                <div className="relative shrink-0 flex-1 md:flex-none" ref={dropdownRef}>
                                    <button 
                                        onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                                        className={`flex items-center justify-between gap-3 px-5 h-[40px] border rounded-[5px] text-sm font-bold transition-all duration-300 ease-in-out shadow-sm w-full md:w-[200px] ${
                                            isSubjectDropdownOpen 
                                                ? "bg-white text-[#5c297c] border-[#ffb736] ring-1 ring-[#ffb736]" 
                                                : "bg-white text-[#5c297c] border-[#5c297c] hover:bg-[#5c297c] hover:text-white" 
                                        }`}
                                    >
                                        <span className="truncate flex-1 text-left">
                                            {selectedSubject === "All" ? "All Subjects" : selectedSubject}
                                        </span>
                                        <svg
                                            className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isSubjectDropdownOpen ? "rotate-180" : ""}`}
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    <div className={`absolute top-full left-0 z-[100] w-full min-w-max mt-1 bg-white rounded-[5px] shadow-lg grid transition-all duration-300 ease-in-out ${isSubjectDropdownOpen ? "grid-rows-[1fr] opacity-100 border border-[#ffb736]" : "grid-rows-[0fr] opacity-0 border-none pointer-events-none"}`}>
                                        <div className="overflow-hidden min-h-0">
                                            <ul className="max-h-60 overflow-y-auto custom-scrollbar py-1">
                                                <li 
                                                    onClick={() => { setSelectedSubject("All"); setIsSubjectDropdownOpen(false); }}
                                                    className={`px-3 py-2 text-sm cursor-pointer transition-colors ${selectedSubject === "All" ? "bg-[#5c297c] text-white" : "text-slate-700 hover:bg-[#ffb736]/20"}`}
                                                >
                                                    All Subjects
                                                </li>
                                                {subjects.map(sub => (
                                                    <li
                                                        key={sub}
                                                        onClick={() => { setSelectedSubject(sub); setIsSubjectDropdownOpen(false); }}
                                                        className={`px-3 py-2 text-sm cursor-pointer transition-colors ${selectedSubject === sub ? "bg-[#5c297c] text-white" : "text-slate-700 hover:bg-[#ffb736]/20"}`}
                                                    >
                                                        {sub}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
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
                            <SortableHeader label="Student ID" sortKey="student_number" currentSort={activeFrontendSort} currentDirection={actualDirection} onSort={handleSort} className="sticky left-0 bg-[#5c297c] z-20 w-[150px]" />
                            <SortableHeader label="Student Name" sortKey="name" currentSort={activeFrontendSort} currentDirection={actualDirection} onSort={handleSort} className="sticky left-[150px] bg-[#5c297c] z-20 w-[250px] shadow-md" />
                            {visibleSubjects.map((sub, i) => (
                                <SortableHeader 
                                    key={i} 
                                    label={sub} 
                                    sortKey={sub} 
                                    currentSort={activeFrontendSort} 
                                    currentDirection={actualDirection} 
                                    onSort={handleSort} 
                                    className={`bg-[#5c297c] whitespace-nowrap [&>div]:w-full [&>div]:justify-center ${visibleSubjects.length === 1 ? 'w-full' : 'min-w-[150px]'}`} 
                                />
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {records.length > 0 ? records.map((student, i) => (
                            <tr key={student.id} className={`border-b hover:bg-purple-50 transition-all ${i % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}>
                                <td className="py-3 px-6 sticky left-0 bg-inherit z-10">
                                    {canManageData ? (
                                        <Link href={route('retakes.entry', { student_id: student.id })} className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold hover:bg-[#e0a800] transition-all text-center">{student.student_number}</Link>
                                    ) : (
                                        <span className="inline-block px-4 py-1.5 rounded-[6px] bg-gray-400 text-white font-bold text-center shadow-sm">{student.student_number}</span>
                                    )}
                                </td>
                                <td className="py-3 px-6 text-gray-800 uppercase font-bold sticky left-[150px] bg-inherit z-10 shadow-md">{student.name}</td>
                                
                                {visibleSubjects.map((sub, idx) => {
                                    const count = student.grades[sub];
                                    return (
                                        <td key={idx} className="py-3 px-6 text-center">
                                            <span className={`font-bold ${count > 0 ? "text-red-500" : "text-gray-400"}`}>
                                                {count !== undefined && count !== null ? count : "-"}
                                            </span>
                                        </td>
                                    );
                                })}
                            </tr>
                        )) : (
                            <tr><td colSpan={visibleSubjects.length + 2} className="py-8 text-center text-gray-500 italic">No records found.</td></tr>
                        )}
                    </tbody>
                </TableContainer>

                <AcademicFilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} currentFilters={filter} onApply={handleApplyFilter} />
                <ChangeMetricModal isOpen={isMetricModalOpen} onClose={() => setIsMetricModalOpen(false)} currentMetric="Back Subjects/Retakes" filterData={filter} />
                {canManageData && <RetakesAddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} currentFilter={filter} subjectHeaders={subjects} />}
            </div>
        </AuthenticatedLayout>
    );
}