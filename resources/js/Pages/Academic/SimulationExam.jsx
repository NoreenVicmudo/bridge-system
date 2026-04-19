import React, { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { TableContainer, SortableHeader } from "@/Components/ReusableTable";
import { useMockInertia, MOCK_STUDENTS_SIMULATION, MOCK_SIMULATION_EXAMS } from "@/Hooks/useMockInertia";
import AcademicFilterModal from "@/Components/Modals/Academic/AcademicFilterModal";
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";
import FilterInfoCard from "@/Components/FilterInfoCard";
import SimAddStudentModal from "@/Components/Modals/Academic/SimAddStudentModal";

export default function SimulationExamPage({ students, filter, search: backendSearch = "", sort = "", direction = "asc" }) {
    const isBackendReady = !!students;
    const mock = useMockInertia(MOCK_STUDENTS_SIMULATION);

    const paginator = isBackendReady ? students.data : mock.data;
    const records = isBackendReady ? students.data.data : mock.data.data;

    const search = isBackendReady ? backendSearch : mock.search;
    const sortColumn = isBackendReady ? sort : mock.sortColumn;
    const sortDirection = isBackendReady ? direction : mock.sortDirection;

    const [searchQuery, setSearchQuery] = useState(search);
    const initialRender = useRef(true);

    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            if (isBackendReady) {
                router.get(route('simulation.exam'), { ...filter, search: searchQuery, sort, direction, exam_period: examPeriod }, { preserveState: true, preserveScroll: true, replace: true });
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
        if(url) router.get(url, { ...filter, search: searchQuery, sort, direction, exam_period: examPeriod }, { preserveScroll: true, preserveState: true });
    } : mock.setPage;

    const handleSort = isBackendReady ? (sortKey) => {
        const dbColumnMap = { student_number: 'student_info.student_number', name: 'student_info.student_lname' };
        const dbColumn = dbColumnMap[sortKey] || 'student_info.student_id';
        const newDir = sort === dbColumn && direction === 'asc' ? 'desc' : 'asc';
        router.get(route('simulation.exam'), { ...filter, search: searchQuery, sort: dbColumn, direction: newDir, exam_period: examPeriod }, { preserveState: true, preserveScroll: true });
    } : mock.handleSort;

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // --- NEW: UI States for filtering ---
    const [selectedSim, setSelectedSim] = useState("All");
    const [examPeriod, setExamPeriod] = useState(filter?.exam_period || "Default"); // Pre-Test, Post-Test, etc.

    const [activeFilters, setActiveFilters] = useState(filter || {
        academic_year: "2025-2026", semester: "1st Semester", college: "1", program: "1", year_level: "4", section: "4-1",
    });

    const handleApplyFilter = (newFilters) => {
        setActiveFilters(newFilters);
        localStorage.setItem("academicFilterData", JSON.stringify(newFilters));
        // Pass the exam period along with the filters!
        router.get(route('simulation.exam'), { ...newFilters, exam_period: examPeriod }, { preserveState: false });
    };

    // Handler for changing the Exam Period
    const handlePeriodChange = (e) => {
        const newPeriod = e.target.value;
        setExamPeriod(newPeriod);
        router.get(route('simulation.exam'), { ...activeFilters, search, sort, direction, exam_period: newPeriod }, { preserveState: true, preserveScroll: true });
    };

    const simHeaders = isBackendReady ? students.simulations : MOCK_SIMULATION_EXAMS;
    const visibleSims = selectedSim === "All" ? simHeaders : simHeaders.filter(s => s === selectedSim);

    return (
        <AuthenticatedLayout>
            <Head title="Simulation Exam Results" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="Simulation Exam Results"
                    search={searchQuery} onSearch={handleSearch}
                    paginationData={paginator} onPageChange={handlePageChange}
                    exportEndpoint={route('simulation-exam.export', { ...filter, exam_period: examPeriod })}
                    filterDisplay={<FilterInfoCard filters={activeFilters} mode="academic" />}
                    headerActions={
                        <>
                            {/* NEW: Exam Period Dropdown */}
                            <select 
                                value={examPeriod} 
                                onChange={handlePeriodChange}
                                className="px-4 h-[40px] border border-[#ffb736] text-[#ffb736] bg-white rounded-[5px] text-sm font-bold focus:ring-[#ffb736] outline-none shadow-sm cursor-pointer shrink-0"
                            >
                                <option value="Default">Default Period</option>
                                <option value="Diagnostic">Diagnostic</option>
                                <option value="Pre-Test">Pre-Test</option>
                                <option value="Midterm">Midterm</option>
                                <option value="Post-Test">Post-Test</option>
                            </select>

                            {simHeaders.length > 0 && (
                                <select 
                                    value={selectedSim} onChange={(e) => setSelectedSim(e.target.value)}
                                    className="px-4 h-[40px] border border-[#5c297c] text-[#5c297c] bg-white rounded-[5px] text-sm font-bold focus:ring-[#5c297c] outline-none shadow-sm cursor-pointer shrink-0"
                                >
                                    <option value="All">All Exams</option>
                                    {simHeaders.map(s => <option key={s} value={s}>{s}</option>)}
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
                        <button onClick={() => setIsAddModalOpen(true)} className="px-6 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#4a1f63] transition-all shadow-sm">
                            Add Student
                        </button>
                    }
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase leading-normal">
                            <SortableHeader label="Student ID" sortKey="student_number" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="sticky left-0 bg-[#5c297c] z-20 w-[150px]" />
                            <SortableHeader label="Student Name" sortKey="name" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="sticky left-[150px] bg-[#5c297c] z-20 w-[250px] shadow-md" />
                            {visibleSims.map((header, i) => (
                                <th key={i} className="py-3 px-6 font-bold text-center whitespace-nowrap min-w-[150px]">{header}</th>
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
                                            {value ? <span className={`font-bold ${parseInt(value) < 75 ? "text-red-500" : "text-[#5c297c]"}`}>{value}</span> : <span className="text-gray-300">-</span>}
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
                <SimAddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} currentFilter={{...filter, exam_period: examPeriod}} subjectHeaders={simHeaders} />
            </div>
        </AuthenticatedLayout>
    );
}