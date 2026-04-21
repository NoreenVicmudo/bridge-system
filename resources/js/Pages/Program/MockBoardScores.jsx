import React, { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { TableContainer, SortableHeader } from "@/Components/ReusableTable";
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";
import FilterInfoCard from "@/Components/FilterInfoCard";
import MockAddStudentModal from "@/Components/Modals/Program/MockAddStudentModal";
import ProgramFilterModal from "@/Components/Modals/Program/ProgramFilterModal";

export default function MockExamScoresPage({ students, filter, search = "", sort = "", direction = "asc", dbColleges = [], dbPrograms = [] }) {
    const { auth } = usePage().props;
    const isAcademicAffairs = ["Admin", "Academic Affairs"].includes(auth.user?.position);
    const canManageData = !isAcademicAffairs;

    const records = students?.data?.data || [];
    const subjectHeaders = students?.subjects || [];
    
    const [selectedSubject, setSelectedSubject] = useState("All");
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false); 

    const currentExamPeriod = filter?.exam_period || "Default";

    const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
    const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
    const periodDropdownRef = useRef(null);
    const subjectDropdownRef = useRef(null);

    const PERIOD_OPTIONS = ["Default Period", "Diagnostic", "Pre-Test", "Midterm", "Post-Test"];

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

    const enrichedFilter = {
        ...filter,
        batch_year: filter?.calendar_year,
        board_batch: filter?.batch_number,
        batch_college_name: dbColleges.find(c => c.value == filter?.college || c.college_id == filter?.college)?.label || filter?.college,
        batch_program_name: dbPrograms.find(p => p.program_id == filter?.program)?.name || filter?.program,
    };

    const [searchQuery, setSearchQuery] = useState(search);
    const initialRender = useRef(true);

    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const actualSort = urlParams.get('sort') || sort || "";
    const actualDirection = urlParams.get('direction') || direction || "asc";

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
            const params = { ...filter, search: searchQuery, exam_period: currentExamPeriod };
            if (actualSort) { params.sort = actualSort; params.direction = actualDirection; }
            router.get(route('mock.board.scores'), params, { preserveState: true, preserveScroll: true, replace: true });
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSearch = (val) => {
        const text = typeof val === 'string' ? val : val?.target?.value || "";
        setSearchQuery(text);
    };
    
    const handleSort = (key) => {
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

        const params = { ...filter, search: searchQuery, exam_period: currentExamPeriod };
        if (nextSort) {
            params.sort = nextSort;
            params.direction = nextDir;
        } 

        router.get(route('mock.board.scores'), params, { preserveState: true, preserveScroll: true });
    };

    const handleApplyFilter = (newFilters) => {
        const params = { ...newFilters, search: searchQuery, exam_period: currentExamPeriod };
        if (actualSort) { params.sort = actualSort; params.direction = actualDirection; }
        router.get(route('mock.board.scores'), params, { preserveState: true, preserveScroll: true });
    };

    const handlePeriodChange = (newPeriod) => {
        setIsPeriodDropdownOpen(false);
        const backendValue = newPeriod === "Default Period" ? "Default" : newPeriod;
        const params = { ...filter, search: searchQuery, exam_period: backendValue };
        if (actualSort) { params.sort = actualSort; params.direction = actualDirection; }
        router.get(route('mock.board.scores'), params, { preserveState: true, preserveScroll: true });
    };

    const visibleSubjects = selectedSubject === "All" ? subjectHeaders : subjectHeaders.filter(s => s === selectedSubject);
    const displayPeriod = currentExamPeriod === "Default" ? "Default Period" : currentExamPeriod;

    return (
        <AuthenticatedLayout>
            <Head title="Mock Exam Scores" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title={`Mock Board Scores (${displayPeriod})`}
                    search={searchQuery} onSearch={handleSearch}
                    paginationData={students?.data} 
                    exportEndpoint={route('mock-scores.export', { ...filter, search: searchQuery, sort: actualSort, direction: actualDirection, exam_period: currentExamPeriod, subject: selectedSubject })}
                    filterDisplay={<FilterInfoCard filters={enrichedFilter} mode="batch" />} 
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

                            {subjectHeaders.length > 0 && (
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
                                            {selectedSubject === "All" ? "All Subjects" : selectedSubject}
                                        </span>
                                        <svg className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isSubjectDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    <div className={`absolute top-full left-0 z-[100] w-full min-w-max mt-1 bg-white rounded-[5px] shadow-lg grid transition-all duration-300 ease-in-out ${isSubjectDropdownOpen ? "grid-rows-[1fr] opacity-100 border border-[#ffb736]" : "grid-rows-[0fr] opacity-0 border-none pointer-events-none"}`}>
                                        <div className="overflow-hidden min-h-0">
                                            <ul className="max-h-60 overflow-y-auto custom-scrollbar py-1">
                                                <li 
                                                    onClick={() => { setSelectedSubject("All"); setIsSubjectDropdownOpen(false); }}
                                                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${selectedSubject === "All" ? "bg-[#5c297c] text-white font-bold" : "text-black hover:bg-[#ffb736]/20 font-medium"}`}
                                                >
                                                    All Subjects
                                                </li>
                                                {subjectHeaders.map(sub => (
                                                    <li
                                                        key={sub}
                                                        onClick={() => { setSelectedSubject(sub); setIsSubjectDropdownOpen(false); }}
                                                        className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${selectedSubject === sub ? "bg-[#5c297c] text-white font-bold" : "text-black hover:bg-[#ffb736]/20 font-medium"}`}
                                                    >
                                                        {sub}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button onClick={() => setIsFilterModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-white text-[#5c297c] border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#5c297c] hover:text-white transition-all duration-300 ease-in-out shadow-sm shrink-0"><i className="bi bi-funnel-fill"></i> Filter</button>
                            <button onClick={() => setIsMetricModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-bold hover:bg-[#4a1f63] transition-all duration-300 ease-in-out shadow-sm shrink-0"><i className="bi bi-bar-chart-fill"></i> Change Metric</button>
                        </>
                    }
                    footerActions={
                        canManageData ? (
                            <button onClick={() => setIsAddModalOpen(true)} className="px-6 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#4a1f63] transition-all duration-300 ease-in-out shadow-sm">Manage Scores</button>
                        ) : null
                    }
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase leading-normal">
                            <SortableHeader label="Student ID" sortKey="student_number" currentSort={activeFrontendSort} currentDirection={actualDirection} onSort={handleSort} className="sticky left-0 bg-[#5c297c] z-20 w-[150px]" />
                            <SortableHeader label="Student Name" sortKey="name" currentSort={activeFrontendSort} currentDirection={actualDirection} onSort={handleSort} className="sticky left-[150px] bg-[#5c297c] z-20 w-[250px] shadow-md" />
                            
                            {visibleSubjects.map((header, i) => (
                                <SortableHeader 
                                    key={i} 
                                    label={header} 
                                    sortKey={header} 
                                    currentSort={activeFrontendSort} 
                                    currentDirection={actualDirection} 
                                    onSort={handleSort} 
                                    className={`bg-[#5c297c] whitespace-nowrap [&>div]:justify-center ${visibleSubjects.length === 1 ? 'w-full' : 'min-w-[150px]'}`} 
                                />
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {records.map((student, i) => (
                            <tr key={student.batch_id} className={`border-b border-gray-100 hover:bg-purple-50 transition-all duration-300 ease-in-out ${i % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}>
                                <td className="py-3 px-6 sticky left-0 z-10 bg-inherit">
                                    {canManageData ? (
                                        <Link href={route('mock.scores.entry', { batch_id: student.batch_id, exam_period: currentExamPeriod })} className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold text-center hover:bg-[#e0a800] hover:scale-105 hover:shadow-md transition-all">{student.student_number}</Link>
                                    ) : (
                                        <span className="inline-block px-4 py-1.5 rounded-[6px] bg-gray-400 text-white font-bold text-center shadow-sm">{student.student_number}</span>
                                    )}
                                </td>
                                <td className="py-3 px-6 text-gray-800 uppercase font-bold sticky left-[150px] z-10 bg-inherit shadow-md">{student.name}</td>
                                {visibleSubjects.map((header, idx) => (
                                    <td key={idx} className="py-3 px-6 text-center">
                                        {student.scores[header] !== undefined && student.scores[header] !== null 
                                            ? <span className="font-bold text-black">{student.scores[header]}%</span> 
                                            : <span className="text-gray-300">-</span>}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </TableContainer>

                <ChangeMetricModal isOpen={isMetricModalOpen} onClose={() => setIsMetricModalOpen(false)} currentMetric="Mock Exam Scores" type="program" filterData={filter} />
                {canManageData && <MockAddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} currentFilter={filter} subjectHeaders={subjectHeaders} />}
                <ProgramFilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} currentFilters={filter} onApply={handleApplyFilter} dbColleges={dbColleges} dbPrograms={dbPrograms} />
            </div>
        </AuthenticatedLayout>
    );
}