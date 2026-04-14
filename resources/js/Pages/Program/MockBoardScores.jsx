import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { TableContainer, SortableHeader } from "@/Components/ReusableTable";
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";
import FilterInfoCard from "@/Components/FilterInfoCard";
import MockAddStudentModal from "@/Components/Modals/Program/MockAddStudentModal";
import ProgramFilterModal from "@/Components/Modals/Program/ProgramFilterModal";

export default function MockExamScoresPage({ students, filter, search = "", sort = "", direction = "asc", dbColleges = [], dbPrograms = [] }) {
    // --- RBAC ---
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

    const enrichedFilter = {
        ...filter,
        batch_year: filter?.calendar_year,
        board_batch: filter?.batch_number,
        batch_college_name: dbColleges.find(c => c.value == filter?.college || c.college_id == filter?.college)?.label || filter?.college,
        batch_program_name: dbPrograms.find(p => p.program_id == filter?.program)?.name || filter?.program,
    };

    const handleSearch = (val) => router.get(route('mock.board.scores'), { ...filter, search: val, sort, direction }, { preserveState: true });
    
    const handleSort = (key) => {
        const dbKey = key === 'student_number' ? 'student_info.student_number' : 'student_info.student_lname';
        const dir = sort === dbKey && direction === 'asc' ? 'desc' : 'asc';
        router.get(route('mock.board.scores'), { ...filter, search, sort: dbKey, direction: dir }, { preserveState: true });
    };

    const handleApplyFilter = (newFilters) => router.get(route('mock.board.scores'), { ...newFilters, search, sort, direction }, { preserveState: true });

    const handlePeriodChange = (e) => {
        const newPeriod = e.target.value;
        router.get(route('mock.board.scores'), { ...filter, search, sort, direction, exam_period: newPeriod }, { preserveState: true });
    };

    const visibleSubjects = selectedSubject === "All" ? subjectHeaders : subjectHeaders.filter(s => s === selectedSubject);

    return (
        <AuthenticatedLayout>
            <Head title="Mock Exam Scores" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title={`Mock Board Scores (${currentExamPeriod})`}
                    search={search} onSearch={handleSearch}
                    paginationData={students?.data} 
                    exportEndpoint={route('mock-scores.export', filter)}
                    filterDisplay={<FilterInfoCard filters={enrichedFilter} mode="batch" />} 
                    headerActions={
                        <>
                            <select value={currentExamPeriod} onChange={handlePeriodChange} className="px-4 h-[40px] border border-[#ffb736] text-[#ffb736] bg-amber-50 rounded-[5px] text-sm font-bold shadow-sm outline-none cursor-pointer">
                                <option value="Default">Default Period</option>
                                <option value="Diagnostic">Diagnostic</option>
                                <option value="Pre-Test">Pre-Test</option>
                                <option value="Midterm">Midterm</option>
                                <option value="Post-Test">Post-Test</option>
                            </select>

                            {subjectHeaders.length > 0 && (
                                <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="px-4 h-[40px] border border-[#5c297c] text-[#5c297c] rounded-[5px] text-sm font-bold shadow-sm outline-none cursor-pointer">
                                    <option value="All">All Subjects</option>
                                    {subjectHeaders.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            )}
                            <button onClick={() => setIsFilterModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-white text-[#5c297c] border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#5c297c] hover:text-white transition-all duration-300 ease-in-out shadow-sm shrink-0"><i className="bi bi-funnel-fill"></i> Filter</button>
                            <button onClick={() => setIsMetricModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-bold shadow-sm"><i className="bi bi-bar-chart-fill"></i> Change Metric</button>
                        </>
                    }
                    footerActions={
                        canManageData ? (
                            <button onClick={() => setIsAddModalOpen(true)} className="px-6 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-medium shadow-sm">Manage Scores</button>
                        ) : null
                    }
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase">
                            <SortableHeader label="Student ID" sortKey="student_number" currentSort={sort} currentDirection={direction} onSort={handleSort} className="sticky left-0 bg-[#5c297c] z-20 w-[150px]" />
                            <SortableHeader label="Student Name" sortKey="name" currentSort={sort} currentDirection={direction} onSort={handleSort} className="sticky left-[150px] bg-[#5c297c] z-20 w-[250px] shadow-md" />
                            {visibleSubjects.map((header, i) => <th key={i} className="py-3 px-6 text-center whitespace-nowrap min-w-[150px]">{header}</th>)}
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {records.map((student, i) => (
                            <tr key={student.batch_id} className={`border-b hover:bg-purple-50 transition-all ${i % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}>
                                <td className="py-3 px-6 sticky left-0 z-10 bg-inherit">
                                    {canManageData ? (
                                        <Link href={route('mock.scores.entry', { batch_id: student.batch_id, exam_period: currentExamPeriod })} className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold text-center">{student.student_number}</Link>
                                    ) : (
                                        <span className="inline-block px-4 py-1.5 rounded-[6px] bg-gray-400 text-white font-bold text-center shadow-sm">{student.student_number}</span>
                                    )}
                                </td>
                                <td className="py-3 px-6 text-gray-800 uppercase font-bold sticky left-[150px] z-10 bg-inherit shadow-md">{student.name}</td>
                                {visibleSubjects.map((header, idx) => (
                                    <td key={idx} className="py-3 px-6 text-center">
                                        {student.scores[header] !== undefined && student.scores[header] !== null 
                                            ? <span className={`font-bold ${student.scores[header] < 75 ? 'text-red-500' : 'text-[#5c297c]'}`}>{student.scores[header]}%</span> 
                                            : "-"}
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