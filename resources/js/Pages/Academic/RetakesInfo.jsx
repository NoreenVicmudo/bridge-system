import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, Link } from "@inertiajs/react";
import { TableContainer, SortableHeader } from "@/Components/ReusableTable";
import AcademicFilterModal from "@/Components/Modals/Academic/AcademicFilterModal";
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";
import FilterInfoCard from "@/Components/FilterInfoCard";
import RetakesAddStudentModal from "@/Components/Modals/Academic/RetakesAddStudentModal";

export default function RetakesInfoPage({ students, subjects, filter, search: backendSearch = "", sort = "", direction = "asc" }) {
    const isBackendReady = !!students;
    const paginator = isBackendReady ? students : null;
    const records = isBackendReady ? students.data : [];

    const [selectedSubject, setSelectedSubject] = useState("All");

    const search = isBackendReady ? backendSearch : "";
    const sortColumn = isBackendReady ? sort : "";
    const sortDirection = isBackendReady ? direction : "asc";

    const handleSearch = (val) => {
        router.get(route('retakes.info'), { ...filter, search: val, sort, direction }, { preserveState: true, preserveScroll: true });
    };

    const handlePageChange = (url) => {
        if (url) router.get(url, { ...filter, search, sort, direction }, { preserveScroll: true, preserveState: true });
    };

    const handleSort = (sortKey) => {
        const dbColumnMap = { student_number: 'student_info.student_number', name: 'student_info.student_lname' };
        const dbColumn = dbColumnMap[sortKey] || 'student_info.student_id';
        const newDir = sort === dbColumn && direction === 'asc' ? 'desc' : 'asc';
        router.get(route('retakes.info'), { ...filter, search, sort: dbColumn, direction: newDir }, { preserveState: true, preserveScroll: true });
    };

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [activeFilters, setActiveFilters] = useState(filter || {
        academic_year: "2025-2026",
        semester: "1st Semester",
        college: "1",
        program: "1",
        year_level: "4",
        section: "4-1",
    });

    const handleApplyFilter = (newFilters) => {
        setActiveFilters(newFilters);
        localStorage.setItem("academicFilterData", JSON.stringify(newFilters));
        router.get(route('back-subjects.info'), newFilters, { preserveState: false });
    };

    // Calculate visible columns
    const subjectHeaders = subjects || [];
    const visibleSubjects = selectedSubject === "All" 
        ? subjectHeaders 
        : subjectHeaders.filter(s => s === selectedSubject);

    return (
        <AuthenticatedLayout>
            <Head title="Back Subjects / Retakes" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="Back Subjects / Retakes"
                    search={backendSearch}
                    onSearch={handleSearch}
                    paginationData={paginator}
                    onPageChange={handlePageChange}
                    exportEndpoint={route('retakes.export', filter)}
                    filterDisplay={<FilterInfoCard filters={filter} mode="academic" />}
                    headerActions={
                        <>
                            {/* Subject Selection Dropdown */}
                            {subjectHeaders.length > 0 && (
                                <select 
                                    value={selectedSubject} 
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="px-4 h-[40px] border border-[#5c297c] text-[#5c297c] bg-white rounded-[5px] text-sm font-bold focus:ring-[#5c297c] outline-none shadow-sm cursor-pointer shrink-0"
                                >
                                    <option value="All">All Subjects</option>
                                    {subjectHeaders.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            )}
                            
                            <button 
                                onClick={() => setIsFilterModalOpen(true)} 
                                className="flex items-center justify-center gap-2 px-5 h-[40px] bg-white text-[#5c297c] border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#5c297c] hover:text-white transition-all duration-300 ease-in-out shadow-sm shrink-0"
                            >
                                <i className="bi bi-funnel-fill leading-none"></i>
                                <span className="leading-none">Filter</span>
                            </button>

                            <button 
                                onClick={() => setIsMetricModalOpen(true)} 
                                className="flex items-center justify-center gap-2 px-5 h-[40px] bg-[#5c297c] text-white border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#4a1f63] transition-all duration-300 ease-in-out shadow-sm shrink-0"
                            >
                                <i className="bi bi-bar-chart-fill leading-none"></i>
                                <span className="leading-none">Change Metric</span>
                            </button>
                        </>
                    }
                    footerActions={
                        <button onClick={() => setIsAddModalOpen(true)} className="px-6 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#4a1f63] transition-all shadow-sm">
                            Add Student
                        </button>
                    }
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase leading-normal">
                            <SortableHeader label="Student ID" sortKey="student_number" currentSort={sort} currentDirection={direction} onSort={handleSort} className="sticky left-0 bg-[#5c297c] z-20 w-[150px]" />
                            <SortableHeader label="Student Name" sortKey="name" currentSort={sort} currentDirection={direction} onSort={handleSort} className="sticky left-[150px] bg-[#5c297c] z-20 w-[250px] shadow-md" />
                            {visibleSubjects.map((subject, i) => (
                                <th key={i} className="py-3 px-6 font-bold text-center whitespace-nowrap min-w-[150px]">{subject}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {records.length > 0 ? records.map((student, i) => (
                            <tr key={student.id} className={`border-b border-gray-100 hover:bg-purple-50 transition-all ${i % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}>
                                <td className="py-3 px-6 sticky left-0 bg-inherit z-10">
                                    <Link
                                        href={route('retakes.entry', { student_id: student.id })}
                                        className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold hover:bg-[#e0a800] text-center"
                                    >
                                        {student.student_number}
                                    </Link>
                                </td>
                                <td className="..."> {student.name} </td>
                                {visibleSubjects.map((subject, idx) => {
                                    const value = student.grades[subject];
                                    return (
                                        <td key={idx} className="py-3 px-6 text-center">
                                            {/* Logic: If value > 0, it means they retook it. Show red. */}
                                            <span className={`font-bold ${value > 0 ? "text-red-500" : "text-gray-400"}`}>
                                                {value > 0 ? value : '-'}
                                            </span>
                                        </td>
                                    );
                                })}
                            </tr>
                        )) : (
                            <tr><td colSpan={subjectHeaders.length + 2} className="py-8 text-center text-gray-500 italic">No records found.</td></tr>
                        )}
                    </tbody>
                </TableContainer>

                <AcademicFilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} currentFilters={activeFilters} onApply={handleApplyFilter} />
                <ChangeMetricModal isOpen={isMetricModalOpen} onClose={() => setIsMetricModalOpen(false)} currentMetric="Back Subjects/Retakes" filterData={filter} type="academic" />
                <RetakesAddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} currentFilter={filter} subjectHeaders={subjectHeaders} />
            </div>
        </AuthenticatedLayout>
    );
}