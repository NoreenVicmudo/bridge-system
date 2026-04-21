import React, { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { TableContainer, SortableHeader } from "@/Components/ReusableTable";
import { useMockInertia, MOCK_STUDENTS_PERFORMANCE, MOCK_PERFORMANCE_CATEGORIES } from "@/Hooks/useMockInertia";
import AcademicFilterModal from "@/Components/Modals/Academic/AcademicFilterModal";
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";
import FilterInfoCard from "@/Components/FilterInfoCard";
import PerformanceAddStudentModal from "@/Components/Modals/Academic/PerformanceAddStudentModal";

export default function PerformanceRatingPage({ students, filter, search: backendSearch = "", sort = "", direction = "asc" }) {
    const { auth } = usePage().props;
    const isAcademicAffairs = ["Admin", "Academic Affairs"].includes(auth.user?.position);
    const canManageData = !isAcademicAffairs;

    const isBackendReady = !!students;
    const mock = useMockInertia(MOCK_STUDENTS_PERFORMANCE);

    const paginator = isBackendReady ? students.data : mock.data;
    const records = isBackendReady ? students.data.data : mock.data.data;
    const search = isBackendReady ? backendSearch : mock.search;

    const [searchQuery, setSearchQuery] = useState(search);
    const initialRender = useRef(true);

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // UI States
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [activeFilters, setActiveFilters] = useState(filter || { academic_year: "2025-2026", semester: "1st Semester", college: "1", program: "1", year_level: "3", section: "3-1" });

    // Hybrid Dropdown State
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const categoryDropdownRef = useRef(null);

    // Close Dropdown on Outside Click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
                setIsCategoryDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // THE FIX: Grab sort params directly from the URL if the backend didn't pass them back
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const actualSort = isBackendReady ? (sort || urlParams.get('sort') || "") : mock.sortColumn;
    const actualDirection = isBackendReady ? (direction || urlParams.get('direction') || "asc") : mock.sortDirection;

    // Reverse Map for the Active Arrow Indicator
    const reverseDbColumnMap = {
        'student_info.student_number': 'student_number',
        'student_info.student_lname': 'name'
    };
    const activeFrontendSort = reverseDbColumnMap[actualSort] || actualSort;

    // The Debounce Effect
    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            if (isBackendReady) {
                const params = { ...activeFilters, search: searchQuery };
                if (actualSort) { params.sort = actualSort; params.direction = actualDirection; }
                router.get(route('performance.rating'), params, { preserveState: true, preserveScroll: true, replace: true });
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
            const params = { ...activeFilters, search: searchQuery };
            if (actualSort) { params.sort = actualSort; params.direction = actualDirection; }
            router.get(url, params, { preserveScroll: true, preserveState: true }); 
        }
    } : mock.setPage;
    
    // 3-State Sorting (Ascending -> Descending -> None)
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

        const params = { ...activeFilters, search: searchQuery };
        if (nextSort) {
            params.sort = nextSort;
            params.direction = nextDir;
        }
        router.get(route('performance.rating'), params, { preserveState: true, preserveScroll: true });
    } : mock.handleSort;

    const handleApplyFilter = (newFilters) => {
        setActiveFilters(newFilters);
        localStorage.setItem("academicFilterData", JSON.stringify(newFilters));
        const params = { ...newFilters, search: searchQuery };
        if (actualSort) { params.sort = actualSort; params.direction = actualDirection; }
        router.get(route('performance.rating'), params, { preserveState: false });
    };

    const ratingHeaders = isBackendReady ? students.categories : MOCK_PERFORMANCE_CATEGORIES;
    const visibleCategories = selectedCategory === "All" ? ratingHeaders : ratingHeaders.filter(cat => cat === selectedCategory);

    return (
        <AuthenticatedLayout>
            <Head title="Performance Rating" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="Performance Rating"
                    search={searchQuery} onSearch={handleSearch}
                    paginationData={paginator} onPageChange={handlePageChange}
                    exportEndpoint={route('performance-rating.export', { ...activeFilters, search: searchQuery, sort: actualSort, direction: actualDirection })}
                    filterDisplay={<FilterInfoCard filters={activeFilters} mode="academic" />}
                    headerActions={
                        <>
                            {/* HYBRID DROPDOWN - CATEGORIES */}
                            {ratingHeaders.length > 0 && (
                                <div className="relative shrink-0 flex-1 md:flex-none" ref={categoryDropdownRef}>
                                    <button 
                                        onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                        className={`flex items-center justify-between gap-3 px-5 h-[40px] border rounded-[5px] text-sm font-bold transition-all duration-300 ease-in-out shadow-sm w-full md:w-[220px] ${
                                            isCategoryDropdownOpen 
                                                ? "bg-white text-[#5c297c] border-[#ffb736] ring-1 ring-[#ffb736]" 
                                                : "bg-white text-[#5c297c] border-[#5c297c] hover:bg-[#5c297c] hover:text-white" 
                                        }`}
                                    >
                                        <span className="truncate flex-1 text-left">
                                            {selectedCategory === "All" ? "All Categories" : selectedCategory}
                                        </span>
                                        <svg className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isCategoryDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* MENU */}
                                    <div className={`absolute top-full left-0 z-[100] w-full min-w-max mt-1 bg-white rounded-[5px] shadow-lg grid transition-all duration-300 ease-in-out ${isCategoryDropdownOpen ? "grid-rows-[1fr] opacity-100 border border-[#ffb736]" : "grid-rows-[0fr] opacity-0 border-none pointer-events-none"}`}>
                                        <div className="overflow-hidden min-h-0">
                                            <ul className="max-h-60 overflow-y-auto custom-scrollbar py-1">
                                                <li 
                                                    onClick={() => { setSelectedCategory("All"); setIsCategoryDropdownOpen(false); }}
                                                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${selectedCategory === "All" ? "bg-[#5c297c] text-white font-bold" : "text-black hover:bg-[#ffb736]/20 font-medium"}`}
                                                >
                                                    All Categories
                                                </li>
                                                {ratingHeaders.map(cat => (
                                                    <li
                                                        key={cat}
                                                        onClick={() => { setSelectedCategory(cat); setIsCategoryDropdownOpen(false); }}
                                                        className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${selectedCategory === cat ? "bg-[#5c297c] text-white font-bold" : "text-black hover:bg-[#ffb736]/20 font-medium"}`}
                                                    >
                                                        {cat}
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
                        canManageData ? (
                            <button onClick={() => setIsAddModalOpen(true)} className="px-6 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#4a1f63] transition-all shadow-sm">Manage Records</button>
                        ) : null
                    }
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase leading-normal">
                            <SortableHeader label="Student ID" sortKey="student_number" currentSort={activeFrontendSort} currentDirection={actualDirection} onSort={handleSort} className="sticky left-0 bg-[#5c297c] z-20 w-[150px]" />
                            <SortableHeader label="Student Name" sortKey="name" currentSort={activeFrontendSort} currentDirection={actualDirection} onSort={handleSort} className="sticky left-[150px] bg-[#5c297c] z-20 w-[250px] shadow-md" />
                            {/* FIX: Used SortableHeader with bg fix for the dynamic categories */}
                            {visibleCategories.map((header, i) => (
                                <SortableHeader 
                                    key={i} 
                                    label={header} 
                                    sortKey={header} 
                                    currentSort={activeFrontendSort} 
                                    currentDirection={actualDirection} 
                                    onSort={handleSort} 
                                    className={`bg-[#5c297c] whitespace-nowrap [&>div]:justify-center ${visibleCategories.length === 1 ? 'w-full' : 'min-w-[150px]'}`} 
                                />
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {records?.length > 0 ? records.map((student, i) => (
                            <tr key={student.id} className={`border-b border-gray-100 hover:bg-purple-50 transition-all ${i % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}>
                                <td className="py-3 px-6 sticky left-0 bg-inherit z-10">
                                    {canManageData ? (
                                        <Link href={route('performance.rating.entry', { student_id: student.id })} className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold hover:bg-[#e0a800] hover:scale-105 hover:shadow-md transition-all text-center">{student.student_number}</Link>
                                    ) : (
                                        <span className="inline-block px-4 py-1.5 rounded-[6px] bg-gray-400 text-white font-bold text-center shadow-sm">{student.student_number}</span>
                                    )}
                                </td>
                                <td className="py-3 px-6 text-gray-800 uppercase font-bold sticky left-[150px] bg-inherit z-10 shadow-md">{student.name}</td>
                                {visibleCategories.map((header, idx) => {
                                    const value = student.ratings[header];
                                    return <td key={idx} className="py-3 px-6 text-center">{value ? <span className={`font-bold ${parseFloat(value) < 75 ? "text-red-500" : "text-[#5c297c]"}`}>{value}</span> : <span className="text-gray-300">-</span>}</td>;
                                })}
                            </tr>
                        )) : (
                            <tr><td colSpan={visibleCategories.length + 2} className="py-8 text-center text-gray-500 italic">No records found.</td></tr>
                        )}
                    </tbody>
                </TableContainer>

                <AcademicFilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} currentFilters={activeFilters} onApply={handleApplyFilter} />
                <ChangeMetricModal isOpen={isMetricModalOpen} onClose={() => setIsMetricModalOpen(false)} currentMetric="Performance Rating" filterData={filter} />
                {canManageData && <PerformanceAddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} currentFilter={filter} subjectHeaders={ratingHeaders} />}
            </div>
        </AuthenticatedLayout>
    );
}