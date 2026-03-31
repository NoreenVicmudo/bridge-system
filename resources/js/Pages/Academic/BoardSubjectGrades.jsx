import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { TableContainer, SortableHeader } from "@/Components/ReusableTable";
import { useMockInertia, MOCK_STUDENTS_BOARD, MOCK_BOARD_SUBJECTS } from "@/Hooks/useMockInertia";
import FilterStudentModal from "@/Components/Modals/FilterStudentModal";
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";
import FilterInfoCard from "@/Components/FilterInfoCard";
import AddStudentModal from "@/Components/Modals/AddStudentModal";

export default function BoardGradesPage({ students }) {
    const isBackendReady = !!students;
    const mock = useMockInertia(MOCK_STUDENTS_BOARD);

    const data = isBackendReady ? students : mock.data;
    const search = isBackendReady ? "" : mock.search;
    const handleSearch = isBackendReady ? () => {} : mock.setSearch;
    const handlePageChange = isBackendReady ? null : mock.setPage;
    const sortColumn = isBackendReady ? null : mock.sortColumn;
    const sortDirection = isBackendReady ? null : mock.sortDirection;
    const handleSort = isBackendReady ? () => {} : mock.handleSort;

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [activeFilters, setActiveFilters] = useState({
        academic_year: "2025-2026", semester: "1st Semester",
        college: "COLLEGE OF MEDICAL TECHNOLOGY", program: "BS MEDICAL TECHNOLOGY",
        year_level: "4TH YEAR", section: "4-1",
    });
    const [filterMode, setFilterMode] = useState("section");

    const subjectHeaders = isBackendReady ? students.subjects : MOCK_BOARD_SUBJECTS;

    return (
        <AuthenticatedLayout>
            <Head title="Grades in Board Subjects" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="Grades in Board Subjects"
                    search={search}
                    onSearch={handleSearch}
                    paginationData={data}
                    onPageChange={handlePageChange}
                    exportEndpoint="/academic/export/csv"
                    filterDisplay={<FilterInfoCard filters={activeFilters} mode={filterMode} />}
                    headerActions={
                        <>
                            <button onClick={() => setIsFilterModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-white text-[#5c297c] border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#5c297c] hover:text-white transition-all duration-300 ease-in-out shadow-sm shrink-0">
                                <i className="bi bi-funnel-fill leading-none"></i><span className="leading-none">Filter</span>
                            </button>
                            <button onClick={() => setIsMetricModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-[#5c297c] text-white border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#4a1f63] transition-all duration-300 ease-in-out shadow-sm shrink-0">
                                <i className="bi bi-bar-chart-fill leading-none"></i><span className="leading-none">Change Metric</span>
                            </button>
                        </>
                    }
                    footerActions={
                        <button onClick={() => setIsAddModalOpen(true)} className="px-6 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#4a1f63] transition-all duration-300 ease-in-out shadow-sm">
                            Add Student
                        </button>
                    }
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase leading-normal">
                            <SortableHeader label="Student ID" sortKey="student_number" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="sticky left-0 bg-[#5c297c] z-20 w-[150px]" />
                            <SortableHeader label="Student Name" sortKey="name" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="sticky left-[150px] bg-[#5c297c] z-20 w-[250px] shadow-md" />
                            {subjectHeaders.map((subject, i) => (
                                <th key={i} className="py-3 px-6 font-bold text-center whitespace-nowrap min-w-[150px]">{subject}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {data.data.length > 0 ? data.data.map((student, i) => (
                            <tr key={student.id} className={`border-b border-gray-100 hover:bg-purple-50 transition-all duration-300 ease-in-out ${i % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}>
                                <td className="py-3 px-6 sticky left-0 bg-inherit z-10"><Link href={`#edit/${student.id}`} className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold hover:bg-[#e0a800] hover:scale-105 hover:shadow-md transition-all duration-300 ease-in-out text-center">{student.student_number}</Link></td>
                                <td className="py-3 px-6 text-gray-800 uppercase font-bold sticky left-[150px] bg-inherit z-10 shadow-md">{student.name}</td>
                                {subjectHeaders.map((subject, idx) => {
                                    const grade = student.grades[subject];
                                    return (
                                        <td key={idx} className="py-3 px-6 text-center">
                                            {grade ? <span className={`font-bold ${parseFloat(grade) <= 3.0 ? "text-[#5c297c]" : "text-red-500"}`}>{grade}</span> : <span className="text-gray-300">-</span>}
                                        </td>
                                    );
                                })}
                            </tr>
                        )) : (
                            <tr><td colSpan={subjectHeaders.length + 2} className="py-8 text-center text-gray-500 italic">No records found.</td></tr>
                        )}
                    </tbody>
                </TableContainer>

                <FilterStudentModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} currentFilters={activeFilters} onApply={(v, m) => { setActiveFilters(v); setFilterMode(m); }} allowBatch={false} />
                <ChangeMetricModal isOpen={isMetricModalOpen} onClose={() => setIsMetricModalOpen(false)} currentMetric="Grades in Board Subjects" />
                <AddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
            </div>
        </AuthenticatedLayout>
    );
}