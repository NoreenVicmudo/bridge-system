import React, { useState, useMemo, useRef, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { TableContainer } from "@/Components/ReusableTable";
import { useMockInertia, MOCK_STUDENTS_GWA } from "@/Hooks/useMockInertia"; 

// --- MODALS & COMPONENTS ---
import FilterStudentModal from "@/Components/Modals/FilterStudentModal";
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";
import FilterInfoCard from "@/Components/FilterInfoCard"; 
import AddStudentModal from "@/Components/Modals/AddStudentModal"; 

// --- DYNAMIC HEADER GENERATOR ---
// Calculates headers based on the max program duration in the current list
const getGwaHeaders = (students) => {
    if (!students || students.length === 0) return [];
    // Find the max duration (e.g., 4 years or 5 years) among visible students
    const maxYears = Math.max(...students.map(s => s.program_duration || 4));
    
    const headers = [];
    for (let y = 1; y <= maxYears; y++) {
        headers.push(`${y}Y - 1S`);
        headers.push(`${y}Y - 2S`);
    }
    return headers;
};

export default function GwaPage({ students }) {
    const isBackendReady = !!students;
    const mock = useMockInertia(MOCK_STUDENTS_GWA);
    
    const data = isBackendReady ? students : mock.data;
    const search = isBackendReady ? "" : mock.search;
    const handleSearch = isBackendReady ? (val) => {} : mock.setSearch;
    const handlePageChange = isBackendReady ? null : mock.setPage;

    // --- STATES ---
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false); // For "Add Student" button

    // Filter Display State (Mock Data)
    const [activeFilters, setActiveFilters] = useState({
        academic_year: "2025-2026",
        semester: "1st Semester",
        college: "COLLEGE OF ARTS AND SCIENCES",
        program: "BS PSYCHOLOGY",
        year_level: "1ST YEAR",
        section: "1-1"
    });
    const [filterMode, setFilterMode] = useState("section");

    // Dynamic Columns based on current data
    const gwaHeaders = useMemo(() => getGwaHeaders(data.data), [data.data]);

    // --- EXPORT DROPDOWN (Reused) ---
    const ExportDropdown = () => {
        const [isOpen, setIsOpen] = useState(false);
        const dropdownRef = useRef(null);
        const queryParams = typeof window !== "undefined" ? window.location.search : "";

        useEffect(() => {
            function handleClickOutside(event) {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
            }
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }, [dropdownRef]);

        return (
            <div className="relative" ref={dropdownRef}>
                <button onClick={() => setIsOpen(!isOpen)} className={`flex items-center gap-2 px-5 py-2 border rounded-[5px] text-sm font-bold transition-all duration-300 ease-in-out shadow-sm ${isOpen ? "bg-[#5c297c] text-white border-[#5c297c]" : "bg-white text-[#5c297c] border-[#5c297c] hover:bg-[#5c297c] hover:text-white"}`}>
                    <i className="bi bi-download text-lg"></i>
                    <span>Export</span>
                    <i className={`bi bi-chevron-down transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}></i>
                </button>
                <div className={`absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-100 overflow-hidden z-[999] transition-all duration-300 origin-top-right transform ${isOpen ? "opacity-100 scale-100 translate-y-0 visible" : "opacity-0 scale-95 -translate-y-2 invisible"}`}>
                    <div className="p-1 flex flex-col">
                        <a href={`/export/csv${queryParams}`} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-purple-50 hover:text-[#5c297c] transition-colors rounded-md group"><i className="bi bi-filetype-csv text-lg text-gray-400 group-hover:text-[#5c297c]"></i><span className="font-medium">Export to CSV</span></a>
                        <a href={`/export/excel${queryParams}`} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-purple-50 hover:text-[#5c297c] transition-colors rounded-md group"><i className="bi bi-file-earmark-excel text-lg text-gray-400 group-hover:text-[#5c297c]"></i><span className="font-medium">Export to Excel</span></a>
                        <a href={`/export/pdf${queryParams}`} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-purple-50 hover:text-[#5c297c] transition-colors rounded-md group"><i className="bi bi-file-earmark-pdf text-lg text-gray-400 group-hover:text-[#5c297c]"></i><span className="font-medium">Export to PDF</span></a>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="General Weighted Average" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="General Weighted Average"
                    search={search}
                    onSearch={handleSearch}
                    paginationData={data}
                    onPageChange={handlePageChange}
                    
                    // 1. INFO CARD
                    filterDisplay={<FilterInfoCard filters={activeFilters} mode={filterMode} />}
                    
                    // 2. HEADER BUTTONS
                    headerActions={
                        <>
                            {/* Filter Button */}
                            <button 
                                onClick={() => setIsFilterModalOpen(true)}
                                className="flex items-center gap-2 px-5 py-2 bg-white text-[#5c297c] border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#5c297c] hover:text-white transition-all duration-300 shadow-sm"
                            >
                                <i className="bi bi-funnel-fill"></i>
                                <span>Filter</span>
                            </button>

                            {/* Change Metric Button */}
                            <button 
                                onClick={() => setIsMetricModalOpen(true)}
                                className="flex items-center gap-2 px-5 py-2 bg-[#5c297c] text-white border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#4a1f63] transition-all duration-300 shadow-sm"
                            >
                                <i className="bi bi-bar-chart-fill"></i>
                                <span>Change Metric</span>
                            </button>

                            {/* Export */}
                            <ExportDropdown />
                        </>
                    }
                    
                    // 3. FOOTER: Only "Add Student"
                    footerActions={
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-6 py-2 bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#4a1f63] transition-all duration-300 shadow-sm"
                        >
                            Add Student
                        </button>
                    }
                >
                    {/* TABLE HEADERS */}
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase leading-normal">
                            {/* Sticky Left Headers */}
                            <th className="py-3 px-6 font-bold text-left sticky left-0 bg-[#5c297c] z-20 w-[150px]">Student ID</th>
                            <th className="py-3 px-6 font-bold text-left sticky left-[150px] bg-[#5c297c] z-20 w-[250px] shadow-md">Student Name</th>
                            
                            {/* Dynamic Year Headers (1Y-1S, etc) */}
                            {gwaHeaders.map((header, i) => (
                                <th key={i} className="py-3 px-4 font-bold text-center whitespace-nowrap min-w-[80px]">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* TABLE BODY */}
                    <tbody className="text-gray-600 text-sm font-medium">
                        {data.data.length > 0 ? (
                            data.data.map((student, index) => (
                                <tr key={student.id} className={`border-b border-gray-100 hover:bg-purple-50 transition-all duration-300 ease-in-out ${index % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}>
                                    
                                    {/* CLICKABLE ID (Sticky Left) */}
                                    <td className="py-3 px-6 sticky left-0 bg-inherit z-10">
                                        <Link 
                                            href={`#edit/${student.id}`} 
                                            className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold hover:bg-[#e0a800] hover:scale-105 hover:shadow-md transition-all duration-300 ease-in-out text-center"
                                        >
                                            {student.student_number}
                                        </Link>
                                    </td>

                                    {/* NAME (Sticky Left) */}
                                    <td className="py-3 px-6 text-gray-800 uppercase font-bold sticky left-[150px] bg-inherit z-10 shadow-md">
                                        {student.name}
                                    </td>

                                    {/* DYNAMIC GRADES */}
                                    {gwaHeaders.map((header, i) => {
                                        const key = header.replace(/\s/g, ''); // "1Y - 1S" -> "1Y-1S"
                                        const grade = student.grades[key];
                                        
                                        return (
                                            <td key={i} className="py-3 px-4 text-center">
                                                {grade ? (
                                                    <span className={`font-bold ${grade <= 3.0 ? 'text-[#5c297c]' : 'text-red-500'}`}>
                                                        {grade}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={gwaHeaders.length + 2} className="py-8 text-center text-gray-500 italic">No students found.</td>
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
                    allowBatch={false} // <--- IMPORTANT CHANGE
                />

                <ChangeMetricModal 
                    isOpen={isMetricModalOpen} 
                    onClose={() => setIsMetricModalOpen(false)}
                    currentMetric="GWA"
                />

                <AddStudentModal 
                    isOpen={isAddModalOpen} 
                    onClose={() => setIsAddModalOpen(false)} 
                />
            </div>
        </AuthenticatedLayout>
    );
}