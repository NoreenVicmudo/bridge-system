import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { TableContainer, SortableHeader } from "@/Components/ReusableTable";
import ProgramFilterModal from "@/Components/Modals/Program/ProgramFilterModal"; 
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";
import FilterInfoCard from "@/Components/FilterInfoCard";
import LicensureAddModal from "@/Components/Modals/Program/LicensureAddModal"; 

export default function LicensureExamPage({ 
    students, 
    filter, 
    search = "", 
    sort = "", 
    direction = "asc", 
    dbColleges = [], 
    dbPrograms = [] 
}) {
    // 1. Data Source (Handles paginated data from LicensureExamController)
    const records = students?.data || [];
    
    // 2. Component State
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // 3. Filter Enrichment for the Info Card
    const enrichedFilter = {
        ...filter,
        batch_year: filter?.calendar_year,
        board_batch: filter?.batch_number,
        batch_college_name: dbColleges.find(c => c.value == filter?.college || c.college_id == filter?.college)?.label || filter?.college,
        batch_program_name: dbPrograms.find(p => p.program_id == filter?.program)?.name || filter?.program,
    };

    // 4. Handlers using the 'licensure.exam' route name from web.php
    const handleSearch = (val) => {
        router.get(route('licensure.exam'), { ...filter, search: val, sort, direction }, { preserveState: true });
    };

    const handleSort = (key) => {
        const dbKeyMap = {
            'student_number': 'student_info.student_number',
            'name': 'student_info.student_lname',
            'status': 'student_licensure_exam.exam_result'
        };
        const dbKey = dbKeyMap[key] || 'student_info.student_lname';
        const dir = sort === dbKey && direction === 'asc' ? 'desc' : 'asc';
        
        router.get(route('licensure.exam'), { ...filter, search, sort: dbKey, direction: dir }, { preserveState: true });
    };

    const handleApplyFilter = (newFilters) => {
        router.get(route('licensure.exam'), { ...newFilters, search, sort, direction }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Licensure Exam Results" />
            
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="Licensure Exam Results"
                    search={search}
                    onSearch={handleSearch}
                    paginationData={students}
                    exportEndpoint={route('licensure.exam.export', filter)}
                    filterDisplay={<FilterInfoCard filters={enrichedFilter} mode="batch" />}
                    headerActions={
                        <>
                            <button 
                                onClick={() => setIsFilterModalOpen(true)} 
                                className="flex items-center justify-center gap-2 px-5 h-[40px] bg-white text-[#5c297c] border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#5c297c] hover:text-white transition-all duration-300 shadow-sm"
                            >
                                <i className="bi bi-funnel-fill"></i> Filter
                            </button>
                            <button 
                                onClick={() => setIsMetricModalOpen(true)} 
                                className="flex items-center justify-center gap-2 px-5 h-[40px] bg-[#5c297c] text-white border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#4a1f63] transition-all duration-300 shadow-sm"
                            >
                                <i className="bi bi-bar-chart-fill"></i> Change Metric
                            </button>
                        </>
                    }
                    footerActions={
                        <button 
                            onClick={() => setIsAddModalOpen(true)} 
                            className="px-6 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#ffb736] transition-all shadow-sm"
                        >
                            Manage Records
                        </button>
                    }
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase leading-normal">
                            <SortableHeader label="Student ID" sortKey="student_number" currentSort={sort} currentDirection={direction} onSort={handleSort} />
                            <SortableHeader label="Student Name" sortKey="name" currentSort={sort} currentDirection={direction} onSort={handleSort} />
                            <SortableHeader label="Status" sortKey="status" currentSort={sort} currentDirection={direction} onSort={handleSort} className="text-center" />
                            <th className="py-3 px-6 font-bold text-center">Exam Date</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {records.length > 0 ? records.map((student, i) => (
                            <tr key={student.batch_id} className={`border-b border-gray-100 hover:bg-purple-50 transition-all duration-300 ${i % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}>
                                <td className="py-3 px-6">
                                    <Link 
                                        href={route('licensure.exam.edit', student.batch_id)} 
                                        className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold hover:bg-[#e0a800] hover:scale-105 transition-all text-center"
                                    >
                                        {student.student_number}
                                    </Link>
                                </td>
                                <td className="py-3 px-6 text-gray-800 uppercase font-bold">{student.name}</td>
                                <td className="py-3 px-6 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                        student.status === "PASSED" ? "bg-green-100 text-green-700" : 
                                        student.status === "FAILED" ? "bg-red-100 text-red-700" : 
                                        "bg-gray-100 text-gray-500"
                                    }`}>
                                        {student.status}
                                    </span>
                                </td>
                                <td className="py-3 px-6 text-center text-gray-600">
                                    {student.exam_date}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="py-8 text-center text-gray-500 italic">
                                    No records found for the selected batch.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </TableContainer>

                {/* Modals */}
                <ProgramFilterModal 
                    isOpen={isFilterModalOpen} 
                    onClose={() => setIsFilterModalOpen(false)} 
                    currentFilters={filter} 
                    onApply={handleApplyFilter} 
                    dbColleges={dbColleges} 
                    dbPrograms={dbPrograms} 
                />
                
                <ChangeMetricModal 
                    isOpen={isMetricModalOpen} 
                    onClose={() => setIsMetricModalOpen(false)} 
                    currentMetric="Licensure Exam Results" 
                    type="program" 
                    filterData={filter} 
                />

                <LicensureAddModal 
                    isOpen={isAddModalOpen} 
                    onClose={() => setIsAddModalOpen(false)} 
                    currentFilter={filter} 
                />
            </div>
        </AuthenticatedLayout>
    );
}