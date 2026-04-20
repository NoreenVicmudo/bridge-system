import React, { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { TableContainer, SortableHeader } from "@/Components/ReusableTable";
import AcademicFilterModal from "@/Components/Modals/Academic/AcademicFilterModal";
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";
import FilterInfoCard from "@/Components/FilterInfoCard";
import RetakesAddStudentModal from "@/Components/Modals/Academic/RetakesAddStudentModal"; // 🧠 FIXED IMPORT

export default function RetakesInfo({ students, subjects = [], filter, search = "", sort = "", direction = "asc" }) {
    const { auth } = usePage().props;
    const isAcademicAffairs = ["Admin", "Academic Affairs"].includes(auth.user?.position);
    const canManageData = !isAcademicAffairs;

    const records = students?.data || [];
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState("All");
    const [searchQuery, setSearchQuery] = useState(search);
    const initialRender = useRef(true);

    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            router.get(route('retakes.info'), { ...filter, search: searchQuery, sort, direction }, { preserveState: true, preserveScroll: true, replace: true });
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSearch = (val) => {
        const text = typeof val === 'string' ? val : val?.target?.value || "";
        setSearchQuery(text);
    };

    const handleSort = (key) => {
        const dbKey = key === 'student_number' ? 'student_info.student_number' : 'student_info.student_lname';
        const dir = sort === dbKey && direction === 'asc' ? 'desc' : 'asc';
        router.get(route('retakes.info'), { ...filter, search: searchQuery, sort: dbKey, direction: dir }, { preserveState: true, preserveScroll: true });
    };

    const visibleSubjects = selectedSubject === "All" ? subjects : subjects.filter(s => s === selectedSubject);

    return (
        <AuthenticatedLayout>
            <Head title="Back Subjects & Retakes" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="Back Subjects & Retakes"
                    search={searchQuery} onSearch={handleSearch}
                    paginationData={students}
                    exportEndpoint={route('retakes.export', filter)} // 🧠 FIXED ENDPOINT
                    filterDisplay={<FilterInfoCard filters={filter} mode="academic" />}
                    headerActions={
                        <>
                            {/* 🧠 NEW: Subject Dropdown */}
                            {subjects.length > 0 && (
                                <select 
                                    value={selectedSubject} 
                                    onChange={(e) => setSelectedSubject(e.target.value)} 
                                    className="px-4 h-[40px] border border-[#5c297c] text-[#5c297c] bg-white rounded-[5px] text-sm font-bold focus:ring-[#5c297c] outline-none shadow-sm cursor-pointer shrink-0"
                                >
                                    <option value="All">All Subjects</option>
                                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            )}
                            
                            <button onClick={() => setIsFilterModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-white text-[#5c297c] border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#5c297c] hover:text-white transition-all shadow-sm">
                                <i className="bi bi-funnel-fill"></i> Filter 
                            </button>
                            <button onClick={() => setIsMetricModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-[#5c297c] text-white border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#4a1f63] transition-all shadow-sm">
                                <i className="bi bi-bar-chart-fill"></i> Change Metric
                            </button>
                        </>
                    }
                    footerActions={
                        canManageData ? (
                            <button onClick={() => setIsAddModalOpen(true)} className="px-6 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#4a1f63] transition-all">Add Student</button>
                        ) : null
                    }
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase">
                            <SortableHeader label="Student ID" sortKey="student_number" currentSort={sort} currentDirection={direction} onSort={handleSort} className="sticky left-0 bg-[#5c297c] z-20 w-[150px]" />
                            <SortableHeader label="Student Name" sortKey="name" currentSort={sort} currentDirection={direction} onSort={handleSort} className="sticky left-[150px] bg-[#5c297c] z-20 w-[250px] shadow-md" />
                            {/* 🧠 FIXED: Dynamically map the subjects */}
                            {visibleSubjects.map((sub, i) => (
                                <th key={i} className="py-3 px-6 text-center whitespace-nowrap min-w-[120px]">{sub}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {records.length > 0 ? records.map((student, i) => (
                            <tr key={student.id} className={`border-b hover:bg-purple-50 transition-all ${i % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}>
                                <td className="py-3 px-6 sticky left-0 bg-inherit z-10">
                                    {canManageData ? (
                                        <Link href={route('retakes.entry', { student_id: student.id })} className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold hover:bg-[#e0a800] transition-all text-center">{student.student_number}</Link>
                                    ) : (
                                        <span className="inline-block px-4 py-1.5 rounded-[6px] bg-gray-400 text-white font-bold text-center shadow-sm">{student.student_number}</span>
                                    )}
                                </td>
                                <td className="py-3 px-6 text-gray-800 uppercase font-bold sticky left-[150px] bg-inherit z-10 shadow-md">{student.name}</td>
                                
                                {/* 🧠 FIXED: Map the dynamic retake counts */}
                                {visibleSubjects.map((sub, idx) => {
                                    const count = student.grades[sub];
                                    return (
                                        <td key={idx} className="py-3 px-6 text-center">
                                            <span className={`font-bold ${count > 0 ? "text-red-500" : "text-gray-400"}`}>
                                                {count !== undefined && count !== null ? count : "-"}
                                            </span>
                                        </td>
                                    );
                                })}
                            </tr>
                        )) : (
                            <tr><td colSpan={visibleSubjects.length + 2} className="py-8 text-center text-gray-500 italic">No records found.</td></tr>
                        )}
                    </tbody>
                </TableContainer>

                <AcademicFilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} currentFilters={filter} onApply={(v) => router.get(route('retakes.info'), v)} />
                <ChangeMetricModal isOpen={isMetricModalOpen} onClose={() => setIsMetricModalOpen(false)} currentMetric="Retakes / Back Subjects" filterData={filter} />
                {canManageData && <RetakesAddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} currentFilter={filter} subjectHeaders={subjects} />}
            </div>
        </AuthenticatedLayout>
    );
}