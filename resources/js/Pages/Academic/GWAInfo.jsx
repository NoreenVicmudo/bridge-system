import React, { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import { TableContainer, SortableHeader } from "@/Components/ReusableTable";
import AcademicFilterModal from "@/Components/Modals/Academic/AcademicFilterModal";
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";
import GWAAddStudentModal from "@/Components/Modals/Academic/GWAAddStudentModal";
import FilterInfoCard from "@/Components/FilterInfoCard";

export default function GwaPage({ students: initialStudents, filter: initialFilter, maxYears, search = "", sort = "student_info.student_id", direction = "desc" }) {
    const { auth } = usePage().props;
    const isAcademicAffairs = ["Admin", "Academic Affairs"].includes(auth.user?.position);
    const canManageData = !isAcademicAffairs;

    const [students, setStudents] = useState(initialStudents || []);
    const [filter, setFilter] = useState(initialFilter || {});
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [showAllGwas, setShowAllGwas] = useState(false);
    
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const actualSort = urlParams.get('sort') || sort || "student_info.student_id";
    const actualDirection = urlParams.get('direction') || direction || "desc";

    const reverseDbColumnMap = {
        'student_info.student_number': 'student_number',
        'student_info.student_lname': 'name',
        'gwa': 'gwa'
    };
    const activeFrontendSort = reverseDbColumnMap[actualSort] || actualSort;

    const [searchQuery, setSearchQuery] = useState(search);
    const initialRender = useRef(true);
    const exportUrl = route('gwa.export', { ...filter, search: searchQuery, sort: actualSort, direction: actualDirection, showAllGwas: showAllGwas ? 1 : 0 });

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
        const params = { ...f, search: searchQuery };
        if (actualSort) { params.sort = actualSort; params.direction = actualDirection; }
        
        router.get(route('gwa.info'), params, { 
            preserveState: preserveState, 
            preserveScroll: true, 
            onSuccess: (page) => setStudents(page.props.students) 
        });
    };

    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            fetchGwaData(filter, true); 
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSearch = (val) => {
        const text = typeof val === 'string' ? val : val?.target?.value || "";
        setSearchQuery(text);
    };

    const handleSort = (sortKey) => {
        const dbColumnMap = { 
            student_number: 'student_info.student_number', 
            name: 'student_info.student_lname',
            gwa: 'gwa' 
        };
        const dbColumn = dbColumnMap[sortKey] || sortKey; 
        
        let nextDir = 'asc';
        let nextSort = dbColumn;

        if (actualSort === dbColumn) {
            if (actualDirection === 'asc') {
                nextDir = 'desc';
            } else {
                nextDir = null;
                nextSort = null;
            }
        }
        
        const params = { ...filter, search: searchQuery };
        if (nextSort) {
            params.sort = nextSort;
            params.direction = nextDir;
        }

        router.get(route('gwa.info'), params, { 
            preserveState: true, 
            preserveScroll: true, 
            onSuccess: (page) => setStudents(page.props.students) 
        });
    };

    const handleApplyFilter = (newFilters) => {
        setFilter(newFilters);
        localStorage.setItem("academicFilterData", JSON.stringify(newFilters));
        const params = { ...newFilters, search: searchQuery };
        if (actualSort) { params.sort = actualSort; params.direction = actualDirection; }
        fetchGwaData(params);
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
                    onPageChange={(url) => {
                        if(url) {
                            const params = { ...filter, search: searchQuery };
                            if (actualSort) { params.sort = actualSort; params.direction = actualDirection; }
                            router.get(url, params, { preserveScroll: true, preserveState: true, onSuccess: (page) => setStudents(page.props.students) });
                        }
                    }}
                    exportEndpoint={exportUrl}
                    showEditNote={canManageData} // 🧠 FIXED: Linked note visibility to RBAC
                    filterDisplay={<FilterInfoCard filters={filter} mode="academic" />}
                    headerActions={
                        <>
                            <button 
                                onClick={() => setShowAllGwas(!showAllGwas)} 
                                className={`flex items-center justify-center gap-2 px-5 h-[40px] border rounded-[5px] text-sm font-bold transition-all duration-300 ease-in-out shadow-sm shrink-0 
                                    ${showAllGwas 
                                        ? "bg-[#ffb736] text-white border-[#ffb736]" 
                                        : "bg-white text-[#5c297c] border-[#5c297c] hover:bg-[#5c297c] hover:text-white" 
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
                            <SortableHeader 
                                label="Student ID" 
                                sortKey="student_number" 
                                currentSort={activeFrontendSort} 
                                currentDirection={actualDirection} 
                                onSort={handleSort} 
                                className="sticky left-0 bg-[#5c297c] z-20 w-[150px] min-w-[150px]" 
                            />
                            <SortableHeader 
                                label="Student Name" 
                                sortKey="name" 
                                currentSort={activeFrontendSort} 
                                currentDirection={actualDirection} 
                                onSort={handleSort} 
                                className="sticky left-[150px] bg-[#5c297c] z-20 w-[250px] min-w-[250px] shadow-md" 
                            />
                            {!showAllGwas ? (
                                <SortableHeader 
                                    label={semesterLabel} 
                                    sortKey="gwa" 
                                    currentSort={activeFrontendSort} 
                                    currentDirection={actualDirection} 
                                    onSort={handleSort} 
                                    className="bg-[#5c297c] text-center min-w-[120px] [&>div]:justify-center" 
                                />
                            ) : (
                                gwaColumns.map(col => (
                                    <SortableHeader 
                                        key={col} 
                                        label={col} 
                                        sortKey={col} 
                                        currentSort={activeFrontendSort} 
                                        currentDirection={actualDirection} 
                                        onSort={handleSort} 
                                        className="bg-[#5c297c] text-center min-w-[120px] [&>div]:justify-center" 
                                    />
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
                                <td className="py-3 px-6 text-gray-800 uppercase font-bold sticky left-[150px] bg-inherit z-10 shadow-md">
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
                                            <td key={col} className="py-3 px-6 text-center font-bold text-[#5c297c]">
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