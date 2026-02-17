import React, { useState, useRef, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { TableContainer } from "@/Components/ReusableTable";
import {
    useMockInertia,
    MOCK_STUDENTS_MOCK_SCORES,
    MOCK_MOCK_SUBJECTS,
} from "@/Hooks/useMockInertia";

// --- IMPORTS ---
import FilterStudentModal from "@/Components/Modals/FilterStudentModal";
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";
import FilterInfoCard from "@/Components/FilterInfoCard";
import AddStudentModal from "@/Components/Modals/AddStudentModal";

// SortableHeader Component
const SortableHeader = ({
    label,
    sortKey,
    currentSort,
    currentDirection,
    onSort,
    className = "",
}) => {
    const isActive = currentSort === sortKey;
    return (
        <th
            onClick={() => onSort(sortKey)}
            className={`py-3 px-6 font-bold cursor-pointer hover:bg-[#4a1f63] transition-colors select-none group ${className}`}
        >
            <div className="flex items-center gap-2">
                {label}
                <div className="flex flex-col text-[10px] leading-none text-white/50 group-hover:text-white">
                    <i
                        className={`bi bi-caret-up-fill ${isActive && currentDirection === "asc" ? "text-[#ffb736]" : ""}`}
                    ></i>
                    <i
                        className={`bi bi-caret-down-fill ${isActive && currentDirection === "desc" ? "text-[#ffb736]" : ""}`}
                    ></i>
                </div>
            </div>
        </th>
    );
};

export default function MockExamScoresPage({ students }) {
    const isBackendReady = !!students;
    const mock = useMockInertia(MOCK_STUDENTS_MOCK_SCORES);

    const data = isBackendReady ? students : mock.data;
    const search = isBackendReady ? "" : mock.search;
    const handleSearch = isBackendReady ? (val) => {} : mock.setSearch;
    const handlePageChange = isBackendReady ? null : mock.setPage;

    // Sorting
    const sortColumn = isBackendReady ? null : mock.sortColumn;
    const sortDirection = isBackendReady ? null : mock.sortDirection;
    const handleSort = isBackendReady ? (col) => {} : mock.handleSort;

    // --- STATES ---
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Active Filters (Batch Mode)
    const [activeFilters, setActiveFilters] = useState({
        batch_college: "COLLEGE OF MEDICAL TECHNOLOGY",
        batch_program: "BS MEDICAL TECHNOLOGY",
        batch_year: "2026",
        board_batch: "1",
    });
    const [filterMode, setFilterMode] = useState("batch");

    // Dynamic Mock Subject Headers
    const subjectHeaders = isBackendReady
        ? students.subjects
        : MOCK_MOCK_SUBJECTS;

    // --- EXPORT DROPDOWN ---
    const ExportDropdown = () => {
        const [isOpen, setIsOpen] = useState(false);
        const dropdownRef = useRef(null);
        const queryParams =
            typeof window !== "undefined" ? window.location.search : "";

        useEffect(() => {
            function handleClickOutside(event) {
                if (
                    dropdownRef.current &&
                    !dropdownRef.current.contains(event.target)
                )
                    setIsOpen(false);
            }
            document.addEventListener("mousedown", handleClickOutside);
            return () =>
                document.removeEventListener("mousedown", handleClickOutside);
        }, [dropdownRef]);

        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 px-5 py-2 border rounded-[5px] text-sm font-bold transition-all duration-300 ease-in-out shadow-sm ${isOpen ? "bg-[#5c297c] text-white border-[#5c297c]" : "bg-white text-[#5c297c] border-[#5c297c] hover:bg-[#5c297c] hover:text-white"}`}
                >
                    <i className="bi bi-download text-lg"></i>
                    <span>Export</span>
                    <i
                        className={`bi bi-chevron-down transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    ></i>
                </button>
                {isOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-100 overflow-hidden z-[999] animate-fade-in">
                        <div className="p-1 flex flex-col">
                            <a
                                href={`/export/csv${queryParams}`}
                                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-purple-50 hover:text-[#5c297c] transition-colors rounded-md group"
                            >
                                <i className="bi bi-filetype-csv text-lg text-gray-400 group-hover:text-[#5c297c]"></i>
                                <span className="font-medium">
                                    Export to CSV
                                </span>
                            </a>
                            <a
                                href={`/export/excel${queryParams}`}
                                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-purple-50 hover:text-[#5c297c] transition-colors rounded-md group"
                            >
                                <i className="bi bi-file-earmark-excel text-lg text-gray-400 group-hover:text-[#5c297c]"></i>
                                <span className="font-medium">
                                    Export to Excel
                                </span>
                            </a>
                            <a
                                href={`/export/pdf${queryParams}`}
                                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-purple-50 hover:text-[#5c297c] transition-colors rounded-md group"
                            >
                                <i className="bi bi-file-earmark-pdf text-lg text-gray-400 group-hover:text-[#5c297c]"></i>
                                <span className="font-medium">
                                    Export to PDF
                                </span>
                            </a>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Mock Exam Scores" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="Mock Board Scores"
                    search={search}
                    onSearch={handleSearch}
                    paginationData={data}
                    onPageChange={handlePageChange}
                    filterDisplay={
                        <FilterInfoCard
                            filters={activeFilters}
                            mode={filterMode}
                        />
                    }
                    headerActions={
                        <>
                            <button
                                onClick={() => setIsFilterModalOpen(true)}
                                className="flex items-center gap-2 px-5 py-2 bg-white text-[#5c297c] border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#5c297c] hover:text-white transition-all duration-300 shadow-sm"
                            >
                                <i className="bi bi-funnel-fill"></i>
                                <span>Filter</span>
                            </button>
                            <button
                                onClick={() => setIsMetricModalOpen(true)}
                                className="flex items-center gap-2 px-5 py-2 bg-[#5c297c] text-white border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#4a1f63] transition-all duration-300 shadow-sm"
                            >
                                <i className="bi bi-bar-chart-fill"></i>
                                <span>Change Metric</span>
                            </button>
                            <ExportDropdown />
                        </>
                    }
                    footerActions={
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-6 py-2 bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#4a1f63] transition-all duration-300 shadow-sm"
                        >
                            Add Student
                        </button>
                    }
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase leading-normal">
                            <SortableHeader
                                label="Student ID"
                                sortKey="student_number"
                                currentSort={sortColumn}
                                currentDirection={sortDirection}
                                onSort={handleSort}
                                className="sticky left-0 bg-[#5c297c] z-20 w-[150px]"
                            />
                            <SortableHeader
                                label="Student Name"
                                sortKey="name"
                                currentSort={sortColumn}
                                currentDirection={sortDirection}
                                onSort={handleSort}
                                className="sticky left-[150px] bg-[#5c297c] z-20 w-[250px] shadow-md"
                            />

                            {/* Dynamic Mock Subject Headers */}
                            {subjectHeaders.map((header, i) => (
                                <th
                                    key={i}
                                    className="py-3 px-6 font-bold text-center whitespace-nowrap min-w-[150px]"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="text-gray-600 text-sm font-medium">
                        {data.data.length > 0 ? (
                            data.data.map((student, index) => (
                                <tr
                                    key={student.id}
                                    className={`border-b border-gray-100 hover:bg-purple-50 transition-all duration-300 ease-in-out ${index % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}
                                >
                                    <td className="py-3 px-6 sticky left-0 bg-inherit z-10">
                                        <Link
                                            href={`#edit/${student.id}`}
                                            className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold hover:bg-[#e0a800] hover:scale-105 hover:shadow-md transition-all duration-300 ease-in-out text-center"
                                        >
                                            {student.student_number}
                                        </Link>
                                    </td>

                                    <td className="py-3 px-6 text-gray-800 uppercase font-bold sticky left-[150px] bg-inherit z-10 shadow-md">
                                        {student.name}
                                    </td>

                                    {/* Dynamic Mock Scores - Formatted as Score/Total */}
                                    {subjectHeaders.map((header, i) => {
                                        const value = student.scores[header];
                                        return (
                                            <td
                                                key={i}
                                                className="py-3 px-6 text-center"
                                            >
                                                {value ? (
                                                    <span className="text-gray-700 font-medium">
                                                        {value}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={subjectHeaders.length + 2}
                                    className="py-8 text-center text-gray-500 italic"
                                >
                                    No records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </TableContainer>

                {/* MODALS */}

                <FilterStudentModal
                    isOpen={isFilterModalOpen}
                    onClose={() => setIsFilterModalOpen(false)}
                    currentFilters={activeFilters}
                    onApply={(vals, mode) => {
                        setActiveFilters(vals);
                        setFilterMode(mode);
                    }}
                    allowSection={false}
                    defaultMode="batch"
                />

                <ChangeMetricModal
                    isOpen={isMetricModalOpen}
                    onClose={() => setIsMetricModalOpen(false)}
                    currentMetric="Mock Exam Scores"
                    type="program"
                />

                <AddStudentModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                />
            </div>
        </AuthenticatedLayout>
    );
}
