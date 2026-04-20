import React, { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import { TableContainer } from "@/Components/ReusableTable";
import AcademicFilterModal from "@/Components/Modals/Academic/AcademicFilterModal";
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";
import GWAAddStudentModal from "@/Components/Modals/Academic/GWAAddStudentModal";
import FilterInfoCard from "@/Components/FilterInfoCard";

export default function GwaPage({ students: initialStudents, filter: initialFilter, maxYears }) {
    const { auth } = usePage().props;
    const isAcademicAffairs = ["Admin", "Academic Affairs"].includes(auth.user?.position);
    const canManageData = !isAcademicAffairs;

    const [students, setStudents] = useState(initialStudents || []);
    const [filter, setFilter] = useState(initialFilter || {});
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [showAllGwas, setShowAllGwas] = useState(false);
    const urlParams = new URLSearchParams(window.location.search);
    const [searchQuery, setSearchQuery] = useState(urlParams.get('search') || "");
    const initialRender = useRef(true);
    const exportUrl = route('gwa.export', filter);

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

    const fetchGwaData = (f, preserveState = false) => {
        router.get(route('gwa.info'), f, { 
            preserveState: preserveState, 
            preserveScroll: true, 
            onSuccess: (page) => setStudents(page.props.students) 
        });
    };

    // 🧠 3. Debounce Effect
    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            fetchGwaData({ ...filter, search: searchQuery }, true); // preserveState: true prevents typing interruption
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // 🧠 4. Search Handler
    const handleSearch = (val) => {
        const text = typeof val === 'string' ? val : val?.target?.value || "";
        setSearchQuery(text);
    };

    const handleApplyFilter = (newFilters) => {
        setFilter(newFilters);
        localStorage.setItem("academicFilterData", JSON.stringify(newFilters));
        // Include search when filtering
        fetchGwaData({ ...newFilters, search: searchQuery });
    };

    const handleEdit = (student) => router.get(route('gwa.entry'), { student_id: student.id });

    const gwaColumns = [];
    if (showAllGwas) {
        for (let y = 1; y <= maxYears; y++) {
            gwaColumns.push(`${y}Y-1S`, `${y}Y-2S`);
        }
    }
    const semesterLabel = filter.semester ? `GWA (${filter.semester})` : "GWA";

    return (
        <AuthenticatedLayout>
            <Head title="General Weighted Average" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="General Weighted Average"
                    search={searchQuery}
                    onSearch={handleSearch}
                    paginationData={students} 
                    onPageChange={(url) => router.get(url)}
                    exportEndpoint={exportUrl}
                    filterDisplay={<FilterInfoCard filters={filter} mode="academic" />}
                    headerActions={
                        <>
                            <button 
                                onClick={() => setShowAllGwas(!showAllGwas)} 
                                className={`flex items-center justify-center gap-2 px-5 h-[40px] border rounded-[5px] text-sm font-bold transition-all duration-300 ease-in-out shadow-sm shrink-0 
                                    ${showAllGwas 
                                        ? "bg-[#ffb736] text-white border-[#ffb736]" // Active state
                                        : "bg-white text-[#5c297c] border-[#5c297c] hover:bg-[#5c297c] hover:text-white" // Standard state matching filter
                                    }`}
                            >
                                <i className={`bi ${showAllGwas ? 'bi-eye-fill' : 'bi-eye-slash-fill'}`}></i>
                                <span>{showAllGwas ? "Hide All GWAs" : "Show All GWAs"}</span>
                            </button>

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
                        canManageData ? (
                            <button onClick={() => setIsAddModalOpen(true)} className="px-6 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#4a1f63] transition-all shadow-sm">Manage Records</button>
                        ) : null
                    }
                >
                    <thead className="min-w-full">
                        <tr className="bg-[#5c297c] text-white text-sm uppercase leading-normal">
                            <th className="py-3 px-6 font-bold text-left sticky left-0 bg-[#5c297c] z-20 w-[150px] min-w-[150px]">
                                Student ID
                            </th>
                            <th className="py-3 px-6 font-bold text-left sticky left-[150px] bg-[#5c297c] z-20 w-[250px] min-w-[250px] shadow-md">
                                Student Name
                            </th>
                            {!showAllGwas ? (
                                <th className="py-3 px-6 font-bold text-center min-w-[120px]">
                                    {semesterLabel}
                                </th>
                            ) : (
                                gwaColumns.map(col => (
                                    <th key={col} className="py-3 px-2 font-bold text-center w-[90px] min-w-[90px] text-[10px] whitespace-nowrap border-l border-white/10">
                                        {col}
                                    </th>
                                ))
                            )}
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {students.data?.map((student, idx) => (
                            <tr key={student.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"} hover:bg-purple-50 transition-all`}>
                                <td className="py-3 px-6 sticky left-0 bg-inherit z-10 font-bold">
                                    {canManageData ? (
                                        <button onClick={() => handleEdit(student)} className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold hover:bg-[#e0a800] transition-all text-xs text-center shadow-sm">
                                            {student.student_number}
                                        </button>
                                    ) : (
                                        <span className="inline-block px-4 py-1.5 rounded-[6px] bg-gray-400 text-white font-bold text-xs text-center shadow-sm">
                                            {student.student_number}
                                        </span>
                                    )}
                                </td>
                                <td className="py-3 px-6 sticky left-[150px] bg-inherit z-10 shadow-md whitespace-nowrap">
                                    {student.name}
                                </td>
                                
                                {!showAllGwas ? (
                                    <td className="py-3 px-6 text-center font-bold text-[#5c297c]">
                                        {student.gwa || <span className="text-gray-300">—</span>}
                                    </td>
                                ) : (
                                    gwaColumns.map(col => {
                                        const [year, sem] = col.split('Y-').map(s => s.replace('S', ''));
                                        const record = student.all_gwas.find(r => r.year_level == year && r.semester == sem);
                                        return (
                                            <td key={col} className="py-3 px-2 text-center text-[11px] border-l border-gray-100 font-semibold">
                                                {record ? record.gwa : <span className="text-gray-200">-</span>}
                                            </td>
                                        );
                                    })
                                )}
                            </tr>
                        ))}
                    </tbody>
                </TableContainer>

                <AcademicFilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} currentFilters={filter} onApply={handleApplyFilter} />
                <ChangeMetricModal isOpen={isMetricModalOpen} onClose={() => setIsMetricModalOpen(false)} currentMetric="GWA" type="academic" filterData={filter} />
                {canManageData && <GWAAddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} currentFilter={filter} maxYears={maxYears} onImportSuccess={() => fetchGwaData(filter)} />}
            </div>
        </AuthenticatedLayout>
    );
}