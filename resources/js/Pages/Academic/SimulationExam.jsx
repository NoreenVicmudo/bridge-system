import React, { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { TableContainer, SortableHeader } from "@/Components/ReusableTable";
import { useMockInertia, MOCK_STUDENTS_SIMULATION, MOCK_SIMULATION_EXAMS } from "@/Hooks/useMockInertia";
import AcademicFilterModal from "@/Components/Modals/Academic/AcademicFilterModal";
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";
import FilterInfoCard from "@/Components/FilterInfoCard";
import SimAddStudentModal from "@/Components/Modals/Academic/SimAddStudentModal";

export default function SimulationExamPage({ students, filter, search: backendSearch = "", sort = "", direction = "" }) {
    const isBackendReady = !!students;
    const mock = useMockInertia(MOCK_STUDENTS_SIMULATION);

    const paginator = isBackendReady ? students.data : mock.data;
    const records = isBackendReady ? students.data.data : mock.data.data;

    const search = isBackendReady ? backendSearch : mock.search;

    const [searchQuery, setSearchQuery] = useState(search);
    const initialRender = useRef(true);

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    const [selectedSim, setSelectedSim] = useState("All");
    const [examPeriod, setExamPeriod] = useState(filter?.exam_period || "Default"); 

    const [activeFilters, setActiveFilters] = useState(filter || {
        academic_year: "2025-2026", semester: "1st Semester", college: "1", program: "1", year_level: "4", section: "4-1",
    });

    const simHeaders = isBackendReady ? students.simulations : MOCK_SIMULATION_EXAMS;
    const visibleSims = selectedSim === "All" ? simHeaders : simHeaders.filter(s => s === selectedSim);

    const PERIOD_OPTIONS = ["Default Period", "Diagnostic", "Pre-Test", "Midterm", "Post-Test"];

    const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
    const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
    const periodDropdownRef = useRef(null);
    const subjectDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (periodDropdownRef.current && !periodDropdownRef.current.contains(event.target)) {
                setIsPeriodDropdownOpen(false);
            }
            if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(event.target)) {
                setIsSubjectDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const actualSort = isBackendReady ? (sort || urlParams.get('sort') || "") : mock.sortColumn;
    const actualDirection = isBackendReady ? (direction || urlParams.get('direction') || "asc") : mock.sortDirection;

    const reverseDbColumnMap = {
        'student_info.student_number': 'student_number',
        'student_info.student_lname': 'name'
    };
    const activeFrontendSort = reverseDbColumnMap[actualSort] || actualSort;

    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            if (isBackendReady) {
                const params = { ...activeFilters, search: searchQuery, exam_period: examPeriod };
                if (actualSort) { params.sort = actualSort; params.direction = actualDirection; }
                router.get(route('simulation.exam'), params, { preserveState: true, preserveScroll: true, replace: true });
            } else {
                mock.setSearch(searchQuery);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSearch = (val) => {
        const text = typeof val === 'string' ? val : val?.target?.value || "";
        setSearchQuery(text);
    };

    const handlePageChange = isBackendReady ? (url) => {
        if(url) {
            const params = { ...activeFilters, search: searchQuery, exam_period: examPeriod };
            if (actualSort) { params.sort = actualSort; params.direction = actualDirection; }
            router.get(url, params, { preserveScroll: true, preserveState: true });
        }
    } : mock.setPage;

    const handleSort = isBackendReady ? (key) => {
        const dbColumnMap = { student_number: 'student_info.student_number', name: 'student_info.student_lname' };
        const dbKey = dbColumnMap[key] || key; 
        
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

        const params = { ...activeFilters, search: searchQuery, exam_period: examPeriod };
        if (nextSort) {
            params.sort = nextSort;
            params.direction = nextDir;
        }

        router.get(route('simulation.exam'), params, { preserveState: true, preserveScroll: true });
    } : mock.handleSort;

    const handleApplyFilter = (newFilters) => {
        setActiveFilters(newFilters);
        localStorage.setItem("academicFilterData", JSON.stringify(newFilters));
        const params = { ...newFilters, search: searchQuery, exam_period: examPeriod };
        if (actualSort) { params.sort = actualSort; params.direction = actualDirection; }
        router.get(route('simulation.exam'), params, { preserveState: false });
    };

    const handlePeriodChange = (newPeriod) => {
        setIsPeriodDropdownOpen(false);
        const backendValue = newPeriod === "Default Period" ? "Default" : newPeriod;
        setExamPeriod(backendValue);
        
        const params = { ...activeFilters, search: searchQuery, exam_period: backendValue };
        if (actualSort) { params.sort = actualSort; params.direction = actualDirection; }
        
        if (isBackendReady) {
            router.get(route('simulation.exam'), params, { preserveState: true, preserveScroll: true });
        }
    };

    const displayPeriod = examPeriod === "Default" ? "Default Period" : examPeriod;

    return (
        <AuthenticatedLayout>
            <Head title="Simulation Exam Results" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title={`Simulation Exam Results (${displayPeriod})`}
                    search={searchQuery} onSearch={handleSearch}
                    paginationData={paginator} onPageChange={handlePageChange}
                    exportEndpoint={route('simulation-exam.export', { ...activeFilters, search: searchQuery, sort: actualSort, direction: actualDirection, exam_period: examPeriod, simulation: selectedSim })}
                    filterDisplay={<FilterInfoCard filters={activeFilters} mode="academic" />}
                    headerActions={
                        <>
                            <div className="relative shrink-0 flex-1 md:flex-none" ref={periodDropdownRef}>
                                <button 
                                    onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                                    className={`flex items-center justify-between gap-3 px-5 h-[40px] border rounded-[5px] text-sm font-bold transition-all duration-300 ease-in-out shadow-sm w-full md:w-[180px] ${
                                        isPeriodDropdownOpen 
                                            ? "bg-amber-50 text-[#ffb736] border-[#ffb736] ring-1 ring-[#ffb736]" 
                                            : "bg-amber-50 text-[#ffb736] border-[#ffb736] hover:bg-[#ffb736] hover:text-white" 
                                    }`}
                                >
                                    <span className="truncate flex-1 text-left">{displayPeriod}</span>
                                    <svg className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isPeriodDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                <div className={`absolute top-full left-0 z-[100] w-full min-w-max mt-1 bg-white rounded-[5px] shadow-lg grid transition-all duration-300 ease-in-out ${isPeriodDropdownOpen ? "grid-rows-[1fr] opacity-100 border border-[#ffb736]" : "grid-rows-[0fr] opacity-0 border-none pointer-events-none"}`}>
                                    <div className="overflow-hidden min-h-0">
                                        <ul className="max-h-60 overflow-y-auto custom-scrollbar py-1">
                                            {PERIOD_OPTIONS.map(period => (
                                                <li 
                                                    key={period}
                                                    onClick={() => handlePeriodChange(period)}
                                                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${displayPeriod === period ? "bg-[#5c297c] text-white font-bold" : "text-black hover:bg-[#ffb736]/20 font-medium"}`}
                                                >
                                                    {period}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {simHeaders.length > 0 && (
                                <div className="relative shrink-0 flex-1 md:flex-none" ref={subjectDropdownRef}>
                                    <button 
                                        onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                                        className={`flex items-center justify-between gap-3 px-5 h-[40px] border rounded-[5px] text-sm font-bold transition-all duration-300 ease-in-out shadow-sm w-full md:w-[200px] ${
                                            isSubjectDropdownOpen 
                                                ? "bg-white text-[#5c297c] border-[#ffb736] ring-1 ring-[#ffb736]" 
                                                : "bg-white text-[#5c297c] border-[#5c297c] hover:bg-[#5c297c] hover:text-white" 
                                        }`}
                                    >
                                        <span className="truncate flex-1 text-left">
                                            {selectedSim === "All" ? "All Exams" : selectedSim}
                                        </span>
                                        <svg className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isSubjectDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    <div className={`absolute top-full left-0 z-[100] w-full min-w-max mt-1 bg-white rounded-[5px] shadow-lg grid transition-all duration-300 ease-in-out ${isSubjectDropdownOpen ? "grid-rows-[1fr] opacity-100 border border-[#ffb736]" : "grid-rows-[0fr] opacity-0 border-none pointer-events-none"}`}>
                                        <div className="overflow-hidden min-h-0">
                                            <ul className="max-h-60 overflow-y-auto custom-scrollbar py-1">
                                                <li 
                                                    onClick={() => { setSelectedSim("All"); setIsSubjectDropdownOpen(false); }}
                                                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${selectedSim === "All" ? "bg-[#5c297c] text-white font-bold" : "text-black hover:bg-[#ffb736]/20 font-medium"}`}
                                                >
                                                    All Exams
                                                </li>
                                                {simHeaders.map(sub => (
                                                    <li
                                                        key={sub}
                                                        onClick={() => { setSelectedSim(sub); setIsSubjectDropdownOpen(false); }}
                                                        className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${selectedSim === sub ? "bg-[#5c297c] text-white font-bold" : "text-black hover:bg-[#ffb736]/20 font-medium"}`}
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
                                <i className="bi bi-funnel-fill leading-none"></i><span className="leading-none">Filter</span>
                            </button>
                            <button onClick={() => setIsMetricModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-[#5c297c] text-white border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#4a1f63] transition-all shadow-sm shrink-0">
                                <i className="bi bi-bar-chart-fill leading-none"></i><span className="leading-none">Change Metric</span>
                            </button>
                        </>
                    }
                    footerActions={
                        <button onClick={() => setIsAddModalOpen(true)} className="px-6 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#4a1f63] transition-all shadow-sm">
                            Manage Records
                        </button>
                    }
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase leading-normal">
                            <SortableHeader label="Student ID" sortKey="student_number" currentSort={activeFrontendSort} currentDirection={actualDirection} onSort={handleSort} className="sticky left-0 bg-[#5c297c] z-20 w-[150px]" />
                            <SortableHeader label="Student Name" sortKey="name" currentSort={activeFrontendSort} currentDirection={actualDirection} onSort={handleSort} className="sticky left-[150px] bg-[#5c297c] z-20 w-[250px] shadow-md" />
                            {visibleSims.map((header, i) => (
                                <SortableHeader 
                                    key={i} 
                                    label={header} 
                                    sortKey={header} 
                                    currentSort={activeFrontendSort} 
                                    currentDirection={actualDirection} 
                                    onSort={handleSort} 
                                    className={`bg-[#5c297c] whitespace-nowrap [&>div]:justify-center ${visibleSims.length === 1 ? 'w-full' : 'min-w-[150px]'}`} 
                                />
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {records?.length > 0 ? records.map((student, i) => (
                            <tr key={student.id} className={`border-b border-gray-100 hover:bg-purple-50 transition-all ${i % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}>
                                <td className="py-3 px-6 sticky left-0 bg-inherit z-10"><Link href={route('simulation.exam.entry', { student_id: student.id, exam_period: examPeriod })} className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold hover:bg-[#e0a800] hover:scale-105 hover:shadow-md transition-all text-center">{student.student_number}</Link></td>
                                <td className="py-3 px-6 text-gray-800 uppercase font-bold sticky left-[150px] bg-inherit z-10 shadow-md">{student.name}</td>
                                {visibleSims.map((header, idx) => {
                                    const value = student.results[header];
                                    return (
                                        <td key={idx} className="py-3 px-6 text-center">
                                            {value ? <span className={`font-bold ${parseInt(value) < 75 ? "text-red-500" : "text-[#5c297c]"}`}>{value}%</span> : <span className="text-gray-300">-</span>}
                                        </td>
                                    );
                                })}
                            </tr>
                        )) : (
                            <tr><td colSpan={visibleSims.length + 2} className="py-8 text-center text-gray-500 italic">No records found.</td></tr>
                        )}
                    </tbody>
                </TableContainer>

                <AcademicFilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} currentFilters={activeFilters} onApply={handleApplyFilter} />
                <ChangeMetricModal isOpen={isMetricModalOpen} onClose={() => setIsMetricModalOpen(false)} currentMetric="Simulation Exam Results" filterData={filter} />
                <SimAddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} currentFilter={{...activeFilters, exam_period: examPeriod}} subjectHeaders={simHeaders} />
            </div>
        </AuthenticatedLayout>
    );
}