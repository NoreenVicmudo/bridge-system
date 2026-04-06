import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { TableContainer } from "@/Components/ReusableTable";
import AcademicFilterModal from "@/Components/Modals/Academic/AcademicFilterModal";
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";
import GWAAddStudentModal from "@/Components/Modals/Academic/GWAAddStudentModal";
import FilterInfoCard from "@/Components/FilterInfoCard";

export default function GwaPage({ students: initialStudents, filter: initialFilter, maxYears }) {
    const [students, setStudents] = useState(initialStudents || []);
    const [filter, setFilter] = useState(initialFilter || {});
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Load saved filter from localStorage if backend didn't provide one
    useEffect(() => {
        if (!initialFilter || Object.keys(initialFilter).length === 0) {
            const saved = localStorage.getItem("academicFilterData");
            if (saved) {
                const f = JSON.parse(saved);
                setFilter(f);
                fetchGwaData(f);
            }
        }
    }, []);

    const fetchGwaData = (f) => {
        router.get(route('gwa.info'), f, {
            preserveState: false,
            onSuccess: (page) => setStudents(page.props.students),
        });
    };

    const handleApplyFilter = (newFilters) => {
        setFilter(newFilters);
        localStorage.setItem("academicFilterData", JSON.stringify(newFilters));
        fetchGwaData(newFilters);
    };

    const handleEdit = (student) => {
        router.get(route('gwa.entry'), { student_id: student.id });
    };

    const semesterLabel = filter.semester ? `GWA (${filter.semester})` : "GWA";

    return (
        <AuthenticatedLayout>
            <Head title="General Weighted Average" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="General Weighted Average"
                    search=""
                    onSearch={() => {}}
                    paginationData={{ data: students, links: [] }}
                    onPageChange={null}
                    exportEndpoint="/academic/export/csv"
                    filterDisplay={<FilterInfoCard filters={filter} mode="academic" />}
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
                            <th className="py-3 px-6 font-bold text-left sticky left-0 bg-[#5c297c] z-20 w-[150px]">Student ID</th>
                            <th className="py-3 px-6 font-bold text-left sticky left-[150px] bg-[#5c297c] z-20 w-[250px] shadow-md">Student Name</th>
                            <th className="py-3 px-6 font-bold text-center min-w-[120px]">{semesterLabel}</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {students.length > 0 ? (
                            students.map((student, idx) => (
                                <tr key={student.id} className={`border-b border-gray-100 hover:bg-purple-50 transition-all duration-300 ease-in-out ${idx % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}>
                                    <td className="py-3 px-6 sticky left-0 bg-inherit z-10">
                                        <button onClick={() => handleEdit(student)} className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold hover:bg-[#e0a800] hover:scale-105 hover:shadow-md transition-all duration-300 ease-in-out text-center">
                                            {student.student_number}
                                        </button>
                                    </td>
                                    <td className="py-3 px-6 text-gray-800 uppercase font-bold sticky left-[150px] bg-inherit z-10 shadow-md">{student.name}</td>
                                    <td className="py-3 px-6 text-center font-bold">
                                        {student.gwa ? (
                                            <span className={student.gwa <= 3.0 ? "text-[#5c297c]" : "text-red-500"}>{student.gwa}</span>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="3" className="py-8 text-center text-gray-500 italic">No students found for the current filter.</td></tr>
                        )}
                    </tbody>
                </TableContainer>

                <AcademicFilterModal
                    isOpen={isFilterModalOpen}
                    onClose={() => setIsFilterModalOpen(false)}
                    currentFilters={filter}
                    onApply={handleApplyFilter}
                />

                <ChangeMetricModal
                    isOpen={isMetricModalOpen}
                    onClose={() => setIsMetricModalOpen(false)}
                    currentMetric="GWA"
                    type="academic"
                />

                <GWAAddStudentModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    currentFilter={filter}
                    maxYears={maxYears}
                    onImportSuccess={() => fetchGwaData(filter)}
                />
            </div>
        </AuthenticatedLayout>
    );
}