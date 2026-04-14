import React, { useState } from "react";
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
    const sortColumn = isBackendReady ? sort : mock.sortColumn;
    const sortDirection = isBackendReady ? direction : mock.sortDirection;

    const handleSearch = isBackendReady ? (val) => router.get(route('performance.rating'), { ...filter, search: val, sort, direction }, { preserveState: true, preserveScroll: true }) : mock.setSearch;
    const handlePageChange = isBackendReady ? (url) => { if(url) router.get(url, { ...filter, search, sort, direction }, { preserveScroll: true, preserveState: true }); } : mock.setPage;
    const handleSort = isBackendReady ? (sortKey) => {
        const dbColumnMap = { student_number: 'student_info.student_number', name: 'student_info.student_lname' };
        const dbColumn = dbColumnMap[sortKey] || 'student_info.student_id';
        const newDir = sort === dbColumn && direction === 'asc' ? 'desc' : 'asc';
        router.get(route('performance.rating'), { ...filter, search, sort: dbColumn, direction: newDir }, { preserveState: true, preserveScroll: true });
    } : mock.handleSort;

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("All");

    const [activeFilters, setActiveFilters] = useState(filter || { academic_year: "2025-2026", semester: "1st Semester", college: "1", program: "1", year_level: "3", section: "3-1" });

    const handleApplyFilter = (newFilters) => {
        setActiveFilters(newFilters);
        localStorage.setItem("academicFilterData", JSON.stringify(newFilters));
        router.get(route('performance.rating'), newFilters, { preserveState: false });
    };

    const ratingHeaders = isBackendReady ? students.categories : MOCK_PERFORMANCE_CATEGORIES;
    const visibleCategories = selectedCategory === "All" ? ratingHeaders : ratingHeaders.filter(cat => cat === selectedCategory);

    return (
        <AuthenticatedLayout>
            <Head title="Performance Rating" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="Performance Rating"
                    search={search} onSearch={handleSearch}
                    paginationData={paginator} onPageChange={handlePageChange}
                    exportEndpoint={route('performance-rating.export', filter)}
                    filterDisplay={<FilterInfoCard filters={activeFilters} mode="academic" />}
                    headerActions={
                        <>
                            {ratingHeaders.length > 0 && (
                                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-4 h-[40px] border border-[#5c297c] text-[#5c297c] bg-white rounded-[5px] text-sm font-bold focus:ring-[#5c297c] outline-none shadow-sm cursor-pointer shrink-0">
                                    <option value="All">All Categories</option>
                                    {ratingHeaders.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            )}
                            <button onClick={() => setIsFilterModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-white text-[#5c297c] border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#5c297c] hover:text-white transition-all shadow-sm shrink-0">
                                <i className="bi bi-funnel-fill leading-none"></i><span className="leading-none">Filter Program</span>
                            </button>
                            <button onClick={() => setIsMetricModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-[#5c297c] text-white border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#4a1f63] transition-all shadow-sm shrink-0">
                                <i className="bi bi-bar-chart-fill leading-none"></i><span className="leading-none">Change Metric</span>
                            </button>
                        </>
                    }
                    footerActions={
                        canManageData ? (
                            <button onClick={() => setIsAddModalOpen(true)} className="px-6 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#4a1f63] transition-all shadow-sm">Add Student</button>
                        ) : null
                    }
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase leading-normal">
                            <SortableHeader label="Student ID" sortKey="student_number" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="sticky left-0 bg-[#5c297c] z-20 w-[150px]" />
                            <SortableHeader label="Student Name" sortKey="name" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="sticky left-[150px] bg-[#5c297c] z-20 w-[250px] shadow-md" />
                            {visibleCategories.map((header, i) => <th key={i} className="py-3 px-6 font-bold text-center whitespace-nowrap min-w-[150px]">{header}</th>)}
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