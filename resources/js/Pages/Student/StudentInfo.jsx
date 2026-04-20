import React, { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { router, Head, Link, usePage } from "@inertiajs/react";
import { TableContainer, SortableHeader } from "@/Components/ReusableTable";
import { useMockInertia, MOCK_STUDENTS } from "@/Hooks/useMockInertia";
import AddStudentModal from "@/Components/Modals/AddStudentModal";
import RemoveStudentModal from "@/Components/Modals/RemoveStudentModal";
import FilterStudentModal from "@/Components/Modals/FilterStudentModal";
import FilterInfoCard from "@/Components/FilterInfoCard";

export default function StudentInformation({ students, filters = {}, dbColleges = [], dbPrograms = [] }) {
    const isBackendReady = !!students;
    const mock = useMockInertia(MOCK_STUDENTS);
    
    // --- RBAC AUTHORIZATION ---
    const { auth } = usePage().props;
    const user = auth.user;
    
    // Academic Affairs / Admin are read-only. Everyone else can manage data.
    const isAcademicAffairs = ["Admin", "Academic Affairs"].includes(user?.position);
    const canManageData = !isAcademicAffairs;

    // Data source
    const data = isBackendReady ? students : mock.data;
    const handlePageChange = isBackendReady ? null : mock.setPage;

    // Extract student list
    const studentList = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.data?.data) ? data.data.data : [];

    const urlParams = new URLSearchParams(window.location.search);
    const currentSearch = urlParams.get('search') || '';
    const currentSortParam = urlParams.get('sort') || '';
    const currentDirectionParam = urlParams.get('direction') || 'asc';

    const activeSortColumn = isBackendReady ? currentSortParam : mock.sortColumn;
    const activeSortDirection = isBackendReady ? currentDirectionParam : mock.sortDirection;

    const sortKeyMap = {
        student_number: 'student_info.student_number',
        name: 'student_info.student_lname',
        college: 'colleges.name',
        program: 'programs.name',
        age: 'student_info.student_birthdate',
        sex: 'student_info.student_sex',
        socioeconomic: 'student_info.student_socioeconomic',
    };

    const reverseSortKeyMap = {
        'student_info.student_number': 'student_number',
        'student_info.student_lname': 'name',
        'colleges.name': 'college',
        'programs.name': 'program',
        'student_info.student_birthdate': 'age',
        'student_info.student_sex': 'sex',
        'student_info.student_socioeconomic': 'socioeconomic',
    };

    const currentFrontendSort = reverseSortKeyMap[activeSortColumn] || '';

    // 🧠 FIXED: Added local state and debounce ref for the search bar
    const [searchQuery, setSearchQuery] = useState(currentSearch);
    const [isRemoveMode, setIsRemoveMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState(filters || {});
    const [filterMode, setFilterMode] = useState(filters?.mode || "section");
    const initialRender = useRef(true);

    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            const params = { 
                ...activeFilters, 
                search: searchQuery,
                sort: activeSortColumn,
                direction: activeSortDirection
            };
            router.get(route('student.info'), params, { preserveState: true, preserveScroll: true, replace: true });
        }, 300);

        return () => clearTimeout(delayDebounceFn);
        // 🧠 FIXED: ONLY watch searchQuery! Do not watch filters or sort here to prevent loops!
    }, [searchQuery]);

    const handleSearch = (value) => {
        const text = typeof value === 'string' ? value : value.target.value;
        setSearchQuery(text);
    };

    const handleSort = (sortKey) => {
        if (!isBackendReady) {
            mock.handleSort(sortKey);
            return;
        }
        
        const dbColumn = sortKeyMap[sortKey] || 'student_info.student_id';
        
        let newColumn = dbColumn;
        let newDirection = 'asc';

        // 🧠 FIXED: 3-State Sort Logic (Ascending -> Descending -> None)
        if (activeSortColumn === dbColumn) {
            if (activeSortDirection === 'asc') {
                newDirection = 'desc';
            } else if (activeSortDirection === 'desc') {
                newColumn = ''; // Reset to None
                newDirection = ''; // Reset to None
            }
        }

        // Include activeFilters for this specific page
        const params = { ...activeFilters, search: searchQuery };
        
        if (newColumn) params.sort = newColumn;
        if (newDirection) params.direction = newDirection;

        router.get(route('student.info'), params, { preserveState: true, preserveScroll: true });
    };

    useEffect(() => {
        setActiveFilters(filters);
        if (filters?.mode) setFilterMode(filters.mode);
        
    }, [JSON.stringify(filters)]);

    const handleApplyFilter = (newFilters, mode) => {
        const params = { ...newFilters, search: currentSearch };
        router.get(route('student.info'), params, { preserveState: true, preserveScroll: true });
    };

    const toggleSelection = (id) => {
        const newSelected = new Set(selectedIds);
        newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(new Set([...selectedIds, ...studentList.map(s => s.id)]));
        } else {
            setSelectedIds(new Set());
        }
    };
    

    return (
        <AuthenticatedLayout>
            <Head title="Student Information" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="Student Information"
                    search={searchQuery}
                    onSearch={handleSearch}
                    paginationData={data?.links ? data : { data: studentList, links: [] }}
                    onPageChange={handlePageChange}
                    exportEndpoint={route('students.export', { 
                        ...activeFilters, 
                        search: currentSearch,
                        sort: activeSortColumn,
                        direction: activeSortDirection
                    })}
                    filterDisplay={<FilterInfoCard filters={activeFilters} mode={filterMode} />}
                    headerActions={
                        <button onClick={() => setIsFilterModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-white text-[#5c297c] border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#5c297c] hover:text-white transition-all duration-300 ease-in-out shadow-sm shrink-0">
                            <i className="bi bi-funnel-fill leading-none"></i><span className="leading-none">Filter</span>
                        </button>
                    }
                    // Conditionally render Footer Actions based on RBAC
                    footerActions={
                        canManageData ? (
                            !isRemoveMode ? (
                                <>
                                    <button onClick={() => setIsAddModalOpen(true)} className="px-6 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#4a1f63] transition-all shadow-sm">Add Student</button>
                                    <button onClick={() => setIsRemoveMode(true)} className="px-6 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#ed1c24] transition-all shadow-sm">Remove Student</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => { setIsRemoveMode(false); setSelectedIds(new Set()); }} className="px-6 h-[40px] bg-white text-gray-600 border border-gray-300 rounded-[5px] text-sm font-medium hover:bg-gray-100 transition-all shadow-sm">Cancel</button>
                                    <button onClick={() => setIsRemoveModalOpen(true)} disabled={selectedIds.size === 0} className={`px-6 h-[40px] rounded-[5px] text-sm font-medium transition-all shadow-sm ${selectedIds.size > 0 ? "bg-[#ed1c24] text-white hover:bg-[#c4151c]" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}>
                                        {selectedIds.size > 0 ? `Remove (${selectedIds.size})` : "Remove Student"}
                                    </button>
                                </>
                            )
                        ) : null // Return null if Academic Affairs to hide buttons entirely
                    }
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase leading-normal">
                            {isRemoveMode && <th className="py-3 px-6 text-center w-[50px]"><input type="checkbox" onChange={toggleSelectAll} className="accent-[#5c297c] cursor-pointer w-4 h-4" /></th>}
                            <SortableHeader label="Student ID" sortKey="student_number" currentSort={currentFrontendSort} currentDirection={activeSortDirection} onSort={handleSort} />
                            <SortableHeader label="Student Name" sortKey="name" currentSort={currentFrontendSort} currentDirection={activeSortDirection} onSort={handleSort} />
                            <SortableHeader label="College" sortKey="college" currentSort={currentFrontendSort} currentDirection={activeSortDirection} onSort={handleSort} />
                            <SortableHeader label="Program" sortKey="program" currentSort={currentFrontendSort} currentDirection={activeSortDirection} onSort={handleSort} />
                            <SortableHeader label="Age" sortKey="age" currentSort={currentFrontendSort} currentDirection={activeSortDirection} onSort={handleSort} className="text-center" />
                            <SortableHeader label="Sex" sortKey="sex" currentSort={currentFrontendSort} currentDirection={activeSortDirection} onSort={handleSort} className="text-center" />
                            <SortableHeader label="Socioeconomic" sortKey="socioeconomic" currentSort={currentFrontendSort} currentDirection={activeSortDirection} onSort={handleSort} />
                            <th className="py-3 px-6 font-bold">Address</th>
                            <th className="py-3 px-6 font-bold">Living</th>
                            <th className="py-3 px-6 font-bold">Work Status</th>
                            <th className="py-3 px-6 font-bold">Scholarship</th>
                            <th className="py-3 px-6 font-bold">Language</th>
                            <th className="py-3 px-6 font-bold">Last School</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {studentList.length > 0 ? studentList.map((student, i) => (
                            <tr key={student.id} className={`border-b border-gray-100 hover:bg-purple-50 transition-all ${i % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}>
                                {isRemoveMode && <td className="py-3 px-6 text-center"><input type="checkbox" checked={selectedIds.has(student.id)} onChange={() => toggleSelection(student.id)} className="accent-[#5c297c] cursor-pointer w-4 h-4" /></td>}
                                
                                <td className="py-3 px-6">
                                    {/* RBAC: Turn ID into a plain badge if they can't edit, otherwise make it a Link */}
                                    {canManageData ? (
                                        <Link href={route('students.edit', student.id)} className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold hover:bg-[#e0a800] hover:scale-105 hover:shadow-md transition-all min-w-[100px] text-center">
                                            {student.student_number}
                                        </Link>
                                    ) : (
                                        <span className="inline-block px-4 py-1.5 rounded-[6px] bg-gray-400 text-white font-bold min-w-[100px] text-center shadow-sm">
                                            {student.student_number}
                                        </span>
                                    )}
                                </td>

                                <td className="py-3 px-6 text-gray-800 uppercase">{student.name}</td>
                                <td className="py-3 px-6 uppercase">{student.college}</td>
                                <td className="py-3 px-6 uppercase">{student.program}</td>
                                <td className="py-3 px-6 text-center">{student.age}</td>
                                <td className="py-3 px-6 text-center uppercase">{student.sex}</td>
                                <td className="py-3 px-6 font-bold"><span className={student.socioeconomic === "POOR" ? "text-[#ed1c24]" : "text-gray-600"}>{student.socioeconomic}</span></td>
                                <td className="py-3 px-6 uppercase">{student.address}</td>
                                <td className="py-3 px-6 uppercase">{student.living_arrangement}</td>
                                <td className="py-3 px-6 uppercase">{student.work_status}</td>
                                <td className="py-3 px-6 uppercase">{student.scholarship}</td>
                                <td className="py-3 px-6 uppercase">{student.language}</td>
                                <td className="py-3 px-6 uppercase">{student.last_school}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={isRemoveMode ? 14 : 13} className="py-8 text-center text-gray-500 italic">No students found.</td></tr>
                        )}
                    </tbody>
                </TableContainer>

                {canManageData && (
                    <>
                        <AddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} filterMode={filterMode} currentFilters={activeFilters} />
                        <RemoveStudentModal isOpen={isRemoveModalOpen} onClose={() => setIsRemoveModalOpen(false)} selectedStudents={studentList.filter(s => selectedIds.has(s.id))} onSuccess={() => {
                            setIsRemoveMode(false);
                            setSelectedIds(new Set());
                        }}/>
                    </>
                )}
                <FilterStudentModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} currentFilters={activeFilters} onApply={handleApplyFilter} dbColleges={dbColleges} dbPrograms={dbPrograms} user={user} />
            </div>
        </AuthenticatedLayout>
    );
}