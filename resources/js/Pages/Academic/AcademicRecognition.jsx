import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { TableContainer, SortableHeader } from "@/Components/ReusableTable";
import AcademicFilterModal from "@/Components/Modals/Academic/AcademicFilterModal";
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";
import FilterInfoCard from "@/Components/FilterInfoCard";
import RecognitionAddStudentModal from "@/Components/Modals/Academic/RecognitionAddStudentModal";

export default function AcademicRecognitionPage({ students, filter, search = "", sort = "", direction = "asc" }) {
    const records = students?.data || [];
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const handleSearch = (val) => router.get(route('academic.recognition'), { ...filter, search: val, sort, direction }, { preserveState: true });
    
    const handleSort = (key) => {
        const dbKey = key === 'student_number' ? 'student_info.student_number' : (key === 'name' ? 'student_info.student_lname' : 'award_count');
        const dir = sort === dbKey && direction === 'asc' ? 'desc' : 'asc';
        router.get(route('academic.recognition'), { ...filter, search, sort: dbKey, direction: dir }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Academic Recognition" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="Academic Recognition"
                    search={search} onSearch={handleSearch}
                    paginationData={students}
                    exportEndpoint={route('academic.recognition.export', filter)}
                    filterDisplay={<FilterInfoCard filters={filter} mode="academic" />}
                    headerActions={
                        <>
                            <button onClick={() => setIsFilterModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-white text-[#5c297c] border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#5c297c] hover:text-white transition-all shadow-sm shrink-0">
                                <i className="bi bi-funnel-fill"></i> Filter Program
                            </button>
                            <button onClick={() => setIsMetricModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-[#5c297c] text-white border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#4a1f63] transition-all shadow-sm shrink-0">
                                <i className="bi bi-bar-chart-fill"></i> Change Metric
                            </button>
                        </>
                    }
                    footerActions={<button onClick={() => setIsAddModalOpen(true)} className="px-6 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#4a1f63] transition-all shadow-sm">Add Student</button>}
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase leading-normal">
                            <SortableHeader label="Student ID" sortKey="student_number" currentSort={sort} currentDirection={direction} onSort={handleSort} />
                            <SortableHeader label="Student Name" sortKey="name" currentSort={sort} currentDirection={direction} onSort={handleSort} />
                            <SortableHeader label="Dean's List" sortKey="recognition_count" currentSort={sort} currentDirection={direction} onSort={handleSort} className="text-center" />
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {records.length > 0 ? records.map((student, i) => (
                            <tr key={student.id} className={`border-b border-gray-100 hover:bg-purple-50 transition-all ${i % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}>
                                <td className="py-3 px-6">
                                    <Link href={route('academic.recognition.entry', { student_id: student.id })} className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold hover:bg-[#e0a800] transition-all text-center">{student.student_number}</Link>
                                </td>
                                <td className="py-3 px-6 text-gray-800 uppercase font-bold">{student.name}</td>
                                <td className="py-3 px-6 text-center"><span className="text-gray-700 font-bold text-base">{student.recognition_count > 0 ? student.recognition_count : "-"}</span></td>
                            </tr>
                        )) : (
                            <tr><td colSpan={3} className="py-8 text-center text-gray-500 italic">No records found.</td></tr>
                        )}
                    </tbody>
                </TableContainer>

                <AcademicFilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} currentFilters={filter} onApply={(v) => router.get(route('academic.recognition'), v)} />
                <ChangeMetricModal isOpen={isMetricModalOpen} onClose={() => setIsMetricModalOpen(false)} currentMetric="Academic Recognition" filterData={filter} />
                <RecognitionAddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} currentFilter={filter} />
            </div>
        </AuthenticatedLayout>
    );
}