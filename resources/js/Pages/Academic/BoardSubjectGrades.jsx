import React, { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { TableContainer, SortableHeader } from "@/Components/ReusableTable";
import { useMockInertia, MOCK_STUDENTS_BOARD, MOCK_BOARD_SUBJECTS } from "@/Hooks/useMockInertia";
import AcademicFilterModal from "@/Components/Modals/Academic/AcademicFilterModal";
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";
import FilterInfoCard from "@/Components/FilterInfoCard";
import BoardAddStudentModal from "@/Components/Modals/Academic/BoardAddStudentModal";

export default function BoardGradesPage({ students, filter, search: backendSearch = "", sort = "", direction = "asc" }) {
    const { auth } = usePage().props;
    const isAcademicAffairs = ["Admin", "Academic Affairs"].includes(auth.user?.position);
    const canManageData = !isAcademicAffairs;

    const isBackendReady = !!students;
    const mock = useMockInertia(MOCK_STUDENTS_BOARD);

    const paginator = isBackendReady ? students.data : mock.data;
    const records = isBackendReady ? students.data.data : mock.data.data;

    const search = isBackendReady ? backendSearch : mock.search;
    const sortColumn = isBackendReady ? sort : mock.sortColumn;
    const sortDirection = isBackendReady ? direction : mock.sortDirection;

    // 🧠 1. Local state & ref
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState("All");
    
    // Dropdown State
    const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const [activeFilters, setActiveFilters] = useState(filter || {
        academic_year: "2025-2026", semester: "1st Semester", college: "COLLEGE OF MEDICAL TECHNOLOGY", program: "BS MEDICAL TECHNOLOGY", year_level: "4TH YEAR", section: "4-1",
    });
    const [filterMode, setFilterMode] = useState(filter?.mode || "section");
    const [searchQuery, setSearchQuery] = useState(search);
    const initialRender = useRef(true);

    // Close Dropdown on Outside Click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsSubjectDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 🧠 2. Debounce Effect
    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            if (isBackendReady) {
                router.get(route('board.subject.grades'), { ...filter, search: searchQuery, sort, direction }, { preserveState: true, preserveScroll: true, replace: true });
            } else {
                mock.setSearch(searchQuery);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // 🧠 3. Fast local state update
    const handleSearch = (val) => {
        const text = typeof val === 'string' ? val : val?.target?.value || "";
        setSearchQuery(text);
    };

    const handlePageChange = isBackendReady ? (url) => {
        if(url) router.get(url, { ...filter, search: searchQuery, sort, direction }, { preserveScroll: true, preserveState: true });
    } : mock.setPage;

    const handleSort = isBackendReady ? (sortKey) => {
        const dbColumnMap = { student_number: 'student_info.student_number', name: 'student_info.student_lname' };
        const dbColumn = dbColumnMap[sortKey] || sortKey; 
        const newDir = sort === dbColumn && direction === 'asc' ? 'desc' : 'asc';
        router.get(route('board.subject.grades'), { ...filter, search: searchQuery, sort: dbColumn, direction: newDir }, { preserveState: true, preserveScroll: true });
    } : mock.handleSort;

    const subjectHeaders = isBackendReady ? students.subjects : MOCK_BOARD_SUBJECTS;
    const visibleSubjects = selectedSubject === "All" ? subjectHeaders : subjectHeaders.filter(sub => sub === selectedSubject);

    const handleApplyFilter = (newFilters) => {
        setActiveFilters(newFilters);
        localStorage.setItem("academicFilterData", JSON.stringify(newFilters));
        router.get(route('board.subject.grades'), newFilters, { preserveState: false });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Grades in Board Subjects" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="Grades in Board Subjects"
                    search={searchQuery} onSearch={handleSearch}
                    paginationData={paginator} onPageChange={handlePageChange}
                    exportEndpoint={route('board-grades.export', filter)}
                    filterDisplay={<FilterInfoCard filters={activeFilters} mode={filterMode} />}
                    headerActions={
                        <>
                            {/* HYBRID SELECTGROUP DROPDOWN */}
                            {subjectHeaders.length > 0 && (
                                <div className="relative shrink-0 flex-1 md:flex-none" ref={dropdownRef}>
                                    <button 
                                        onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                                        className={`flex items-center justify-between gap-3 px-5 h-[40px] border rounded-[5px] text-sm font-bold transition-all duration-300 ease-in-out shadow-sm w-full md:w-[200px] ${
                                            isSubjectDropdownOpen 
                                                ? "bg-white text-[#5c297c] border-[#ffb736] ring-1 ring-[#ffb736]" // Match SelectGroup Focus
                                                : "bg-white text-[#5c297c] border-[#5c297c] hover:bg-[#5c297c] hover:text-white" // Match Filter Idle
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

                                    {/* MENU - Styled exactly like SelectGroup.jsx */}
                                    <div className={`absolute top-full left-0 z-[100] w-full min-w-max mt-1 bg-white rounded-[5px] shadow-lg grid transition-all duration-300 ease-in-out ${isSubjectDropdownOpen ? "grid-rows-[1fr] opacity-100 border border-[#ffb736]" : "grid-rows-[0fr] opacity-0 border-none pointer-events-none"}`}>
                                        <div className="overflow-hidden min-h-0">
                                            <ul className="max-h-60 overflow-y-auto custom-scrollbar py-1">
                                                <li 
                                                    onClick={() => { setSelectedSubject("All"); setIsSubjectDropdownOpen(false); }}
                                                    className={`px-3 py-2 text-sm cursor-pointer transition-colors ${selectedSubject === "All" ? "bg-[#5c297c] text-white" : "text-slate-700 hover:bg-[#ffb736]/20"}`}
                                                >
                                                    All Subjects
                                                </li>
                                                {subjectHeaders.map(sub => (
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

                            <button onClick={() => setIsFilterModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-white text-[#5c297c] border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#5c297c] hover:text-white transition-all duration-300 ease-in-out shadow-sm shrink-0">
                                <i className="bi bi-funnel-fill leading-none"></i><span className="leading-none">Filter</span>
                            </button>
                            <button onClick={() => setIsMetricModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-[#5c297c] text-white border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#4a1f63] transition-all duration-300 ease-in-out shadow-sm shrink-0">
                                <i className="bi bi-bar-chart-fill leading-none"></i><span className="leading-none">Change Metric</span>
                            </button>
                        </>
                    }
                    footerActions={
                        canManageData ? (
                            <button onClick={() => setIsAddModalOpen(true)} className="px-6 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#4a1f63] transition-all duration-300 ease-in-out shadow-sm">Add Student</button>
                        ) : null
                    }
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase leading-normal">
                            <SortableHeader label="Student ID" sortKey="student_number" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="sticky left-0 bg-[#5c297c] z-20 w-[150px]" />
                            <SortableHeader label="Student Name" sortKey="name" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="sticky left-[150px] bg-[#5c297c] z-20 w-[250px] shadow-md" />
                            
                            {/* 🧠 FIX: Center the subject if it's the only one by applying w-full */}
                            {visibleSubjects.map((subject, i) => (
                                <SortableHeader 
                                    key={i} 
                                    label={subject} 
                                    sortKey={subject} 
                                    currentSort={sortColumn} 
                                    currentDirection={sortDirection} 
                                    onSort={handleSort} 
                                    className={`text-center whitespace-nowrap ${visibleSubjects.length === 1 ? 'w-full' : 'min-w-[150px]'}`} 
                                />
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {records?.length > 0 ? records.map((student, i) => (
                            <tr key={student.id} className={`border-b border-gray-100 hover:bg-purple-50 transition-all duration-300 ease-in-out ${i % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}>
                                <td className="py-3 px-6 sticky left-0 bg-inherit z-10">
                                    {canManageData ? (
                                        <Link href={route('board.grades.entry', { student_id: student.id })} className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold hover:bg-[#e0a800] hover:scale-105 hover:shadow-md transition-all text-center">{student.student_number}</Link>
                                    ) : (
                                        <span className="inline-block px-4 py-1.5 rounded-[6px] bg-gray-400 text-white font-bold text-center shadow-sm">{student.student_number}</span>
                                    )}
                                </td>
                                <td className="py-3 px-6 text-gray-800 uppercase font-bold sticky left-[150px] bg-inherit z-10 shadow-md">{student.name}</td>
                                {visibleSubjects.map((subject, idx) => {
                                    const grade = student.grades[subject];
                                    return (
                                        <td key={idx} className="py-3 px-6 text-center">
                                            {/* 🧠 FIX: Always black text */}
                                            {grade ? <span className="font-bold text-black">{grade}</span> : <span className="text-gray-300">-</span>}
                                        </td>
                                    );
                                })}
                            </tr>
                        )) : (
                            <tr><td colSpan={visibleSubjects.length + 2} className="py-8 text-center text-gray-500 italic">No records found.</td></tr>
                        )}
                    </tbody>
                </TableContainer>

                <AcademicFilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} currentFilters={activeFilters} onApply={handleApplyFilter} />
                <ChangeMetricModal isOpen={isMetricModalOpen} onClose={() => setIsMetricModalOpen(false)} currentMetric="Grades in Board Subjects" filterData={filter} />
                {canManageData && <BoardAddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} currentFilter={filter} subjectHeaders={subjectHeaders}/>}
            </div>
        </AuthenticatedLayout>
    );
}