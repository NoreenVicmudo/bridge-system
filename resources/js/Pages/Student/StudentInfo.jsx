import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { router, Head, Link, usePage } from "@inertiajs/react";
import { TableContainer, SortableHeader } from "@/Components/ReusableTable";
import { useMockInertia, MOCK_STUDENTS } from "@/Hooks/useMockInertia";
import AddStudentModal from "@/Components/Modals/AddStudentModal";
import RemoveStudentModal from "@/Components/Modals/RemoveStudentModal";
import FilterStudentModal from "@/Components/Modals/FilterStudentModal"; // The new modal
import FilterInfoCard from "@/Components/FilterInfoCard"; // The new card

/*/ --- SORTABLE HEADER COMPONENT ---
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
};*/

export default function StudentInformation({ students, filters = {}, dbColleges = [], dbPrograms = [] }) {
    const isBackendReady = !!students;
    const mock = useMockInertia(MOCK_STUDENTS);

    const { auth } = usePage().props;
    const user = auth.user;

    const data = isBackendReady ? students : mock.data;
    const search = isBackendReady ? "" : mock.search;
    const handleSearch = isBackendReady ? () => {} : mock.setSearch;
    const handlePageChange = isBackendReady ? null : mock.setPage;
    const sortColumn = isBackendReady ? null : mock.sortColumn;
    const sortDirection = isBackendReady ? null : mock.sortDirection;
    const handleSort = isBackendReady ? () => {} : mock.handleSort;

    const studentList = Array.isArray(data) 
        ? data 
        : (Array.isArray(data?.data) 
            ? data.data 
            : (Array.isArray(data?.data?.data) ? data.data.data : []));

    const [isRemoveMode, setIsRemoveMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState(filters || {});
    const [filterMode, setFilterMode] = useState(filters?.mode || "section");

    useEffect(() => {
        console.log('filters changed:', filters);
        if (filters?.mode) {
            setFilterMode(filters.mode);
        }
    }, [filters]);

    // --- HANDLERS ---
    const handleApplyFilter = (newFilters, mode) => {
        setActiveFilters(newFilters);
        setFilterMode(mode);
        // Here you would also trigger a backend reload via router.get()
        router.get('/student-info', newFilters, { preserveState: true, preserveScroll: true });
    };

    const toggleSelection = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id); else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = (e) => {
        if (e.target.checked) setSelectedIds(new Set([...selectedIds, ...data.data.map(s => s.id)]));
        else setSelectedIds(new Set());
    };

    return (
        <AuthenticatedLayout>
            <Head title="Student Information" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="Student Information"
                    search={search}
                    onSearch={handleSearch}
                    paginationData={data?.links ? data : { data: studentList, links: [] }}
                    onPageChange={handlePageChange}
                    exportEndpoint="/students/export/csv"
                    filterDisplay={<FilterInfoCard filters={activeFilters} mode={filterMode} />}
                    headerActions={
                        <button onClick={() => setIsFilterModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-white text-[#5c297c] border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#5c297c] hover:text-white transition-all duration-300 ease-in-out shadow-sm shrink-0">
                            <i className="bi bi-funnel-fill leading-none"></i><span className="leading-none">Filter</span>
                        </button>
                    }
                    footerActions={
                        !isRemoveMode ? (
                            <>
                                <button onClick={() => setIsAddModalOpen(true)} className="px-6 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#4a1f63] transition-all duration-300 ease-in-out shadow-sm">Add Student</button>
                                <button onClick={() => setIsRemoveMode(true)} className="px-6 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#ed1c24] transition-all duration-300 ease-in-out shadow-sm">Remove Student</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => { setIsRemoveMode(false); setSelectedIds(new Set()); }} className="px-6 h-[40px] bg-white text-gray-600 border border-gray-300 rounded-[5px] text-sm font-medium hover:bg-gray-100 transition-all duration-300 ease-in-out shadow-sm">Cancel</button>
                                <button onClick={() => setIsRemoveModalOpen(true)} disabled={selectedIds.size === 0} className={`px-6 h-[40px] rounded-[5px] text-sm font-medium transition-all duration-300 ease-in-out shadow-sm ${selectedIds.size > 0 ? "bg-[#ed1c24] text-white hover:bg-[#c4151c]" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}>
                                    {selectedIds.size > 0 ? `Remove (${selectedIds.size})` : "Remove Student"}
                                </button>
                            </>
                        )
                    }
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase leading-normal">
                            {isRemoveMode && <th className="py-3 px-6 text-center w-[50px]"><input type="checkbox" onChange={toggleSelectAll} className="accent-[#5c297c] cursor-pointer w-4 h-4 transition-all duration-300 ease-in-out" /></th>}
                            <SortableHeader label="Student ID" sortKey="student_number" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="Student Name" sortKey="name" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="College" sortKey="college" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="Program" sortKey="program" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="Age" sortKey="age" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-center" />
                            <SortableHeader label="Sex" sortKey="sex" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-center" />
                            <SortableHeader label="Socioeconomic" sortKey="socioeconomic" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                            <th className="py-3 px-6 font-bold">Address</th>
                            <th className="py-3 px-6 font-bold">Living</th>
                            <th className="py-3 px-6 font-bold">Work Status</th>
                            <th className="py-3 px-6 font-bold">Scholarship</th>
                            <th className="py-3 px-6 font-bold">Language</th>
                            <th className="py-3 px-6 font-bold">Last School</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {data.data.length > 0 ? data.data.map((student, i) => (
                            <tr key={student.id} className={`border-b border-gray-100 hover:bg-purple-50 transition-all duration-300 ease-in-out ${i % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}>
                                {isRemoveMode && <td className="py-3 px-6 text-center"><input type="checkbox" checked={selectedIds.has(student.id)} onChange={() => toggleSelection(student.id)} className="accent-[#5c297c] cursor-pointer w-4 h-4 transition-all duration-300 ease-in-out" /></td>}
                                <td className="py-3 px-6"><Link href={`#edit/${student.id}`} className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold hover:bg-[#e0a800] hover:scale-105 hover:shadow-md transition-all duration-300 ease-in-out min-w-[100px] text-center">{student.student_number}</Link></td>
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

                <AddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} filterMode={filterMode} currentFilters={activeFilters} />
                <RemoveStudentModal isOpen={isRemoveModalOpen} onClose={() => setIsRemoveModalOpen(false)} selectedStudents={data.data.filter(s => selectedIds.has(s.id))} />
                <FilterStudentModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} currentFilters={activeFilters} onApply={handleApplyFilter} dbColleges={dbColleges} dbPrograms={dbPrograms} user={user} />
            </div>
        </AuthenticatedLayout>
    );
}