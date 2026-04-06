import React, { useState, useEffect } from "react";
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
    const { auth } = usePage().props;
    const user = auth.user;

    // Data source
    const data = isBackendReady ? students : mock.data;
    const handlePageChange = isBackendReady ? null : mock.setPage;

    // Extract student list (handles paginated or flat array)
    const studentList = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.data?.data) ? data.data.data : [];

    // URL params (only for backend mode)
    const urlParams = new URLSearchParams(window.location.search);
    const currentSearch = urlParams.get('search') || '';
    const currentSortParam = urlParams.get('sort') || '';
    const currentDirectionParam = urlParams.get('direction') || 'asc';

    // Mock mode uses its own sort state; backend uses URL params
    const activeSortColumn = isBackendReady ? currentSortParam : mock.sortColumn;
    const activeSortDirection = isBackendReady ? currentDirectionParam : mock.sortDirection;

    // Map frontend sort keys to database columns
    const sortKeyMap = {
        student_number: 'student_info.student_number',
        name: 'student_info.student_lname',
        college: 'student_info.college_id',
        program: 'student_info.program_id',
        age: 'student_info.student_birthdate',
        sex: 'student_info.student_sex',
        socioeconomic: 'student_info.student_socioeconomic',
    };

    const reverseSortKeyMap = {
        'student_info.student_number': 'student_number',
        'student_info.student_lname': 'name',
        'student_info.college_id': 'college',
        'student_info.program_id': 'program',
        'student_info.student_birthdate': 'age',
        'student_info.student_sex': 'sex',
        'student_info.student_socioeconomic': 'socioeconomic',
    };

    const currentFrontendSort = reverseSortKeyMap[activeSortColumn] || '';

    // Handlers
    const handleSearch = (value) => {
        const params = { ...activeFilters, search: value };
        router.get('/student-info', params, { preserveState: true, preserveScroll: true });
    };

    const handleSort = (sortKey) => {
        if (!isBackendReady) {
            mock.handleSort(sortKey);
            return;
        }
        const dbColumn = sortKeyMap[sortKey] || 'student_info.student_id';
        const newDirection = activeSortColumn === dbColumn && activeSortDirection === 'asc' ? 'desc' : 'asc';
        const params = { ...activeFilters, sort: dbColumn, direction: newDirection };
        router.get('/student-info', params, { preserveState: true, preserveScroll: true });
    };

    // State
    const [isRemoveMode, setIsRemoveMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState(filters || {});
    const [filterMode, setFilterMode] = useState(filters?.mode || "section");

    // Sync activeFilters when filters prop changes
    useEffect(() => {
        setActiveFilters(filters);
        if (filters?.mode) setFilterMode(filters.mode);
    }, [filters]);

    const handleApplyFilter = (newFilters, mode) => {
        const params = { ...newFilters, search: currentSearch };
        router.get('/student-info', params, { preserveState: true, preserveScroll: true });
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
                    search={currentSearch}
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
                            <tr key={student.id} className={`border-b border-gray-100 hover:bg-purple-50 transition-all duration-300 ease-in-out ${i % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}>
                                {isRemoveMode && <td className="py-3 px-6 text-center"><input type="checkbox" checked={selectedIds.has(student.id)} onChange={() => toggleSelection(student.id)} className="accent-[#5c297c] cursor-pointer w-4 h-4 transition-all duration-300 ease-in-out" /></td>}
                                <td className="py-3 px-6"><Link href={route('students.edit', student.id)} className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold hover:bg-[#e0a800] hover:scale-105 hover:shadow-md transition-all duration-300 ease-in-out min-w-[100px] text-center">{student.student_number}</Link></td>
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
                <RemoveStudentModal isOpen={isRemoveModalOpen} onClose={() => setIsRemoveModalOpen(false)} selectedStudents={studentList.filter(s => selectedIds.has(s.id))} />
                <FilterStudentModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} currentFilters={activeFilters} onApply={handleApplyFilter} dbColleges={dbColleges} dbPrograms={dbPrograms} user={user} />
            </div>
        </AuthenticatedLayout>
    );
}