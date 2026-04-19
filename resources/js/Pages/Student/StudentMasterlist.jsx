import React, { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { TableContainer, SortableHeader } from "@/Components/ReusableTable";
import { useMockInertia, MOCK_STUDENTS } from "@/Hooks/useMockInertia";
import AddStudentModal from "@/Components/Modals/AddStudentModal";
import RemoveStudentModal from "@/Components/Modals/RemoveStudentModal";

export default function StudentMasterlist({ students }) {
    const isBackendReady = !!students;
    const mock = useMockInertia(MOCK_STUDENTS);

    // --- RBAC AUTHORIZATION ---
    const { auth } = usePage().props;
    const user = auth.user;
    
    // Academic Affairs / Admin are read-only
    const isAcademicAffairs = ["Admin", "Academic Affairs"].includes(user?.position);
    const canManageData = !isAcademicAffairs;

    const data = isBackendReady ? students : mock.data;
    const handlePageChange = isBackendReady ? null : mock.setPage;

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
        student_number: 'student_number',
        name: 'student_lname',
        college: 'college_id',
        program: 'program_id',
        age: 'student_birthdate',
        sex: 'student_sex',
        socioeconomic: 'student_socioeconomic',
        // NEW ADDITIONS
        address: 'student_address_city', 
        living: 'student_living',
        work_status: 'student_work',
        scholarship: 'student_scholarship',
        language: 'student_language',
        last_school: 'student_last_school',
    };

    const reverseSortKeyMap = {
        student_number: 'student_number',
        student_lname: 'name',
        college_id: 'college',
        program_id: 'program',
        student_birthdate: 'age',
        student_sex: 'sex',
        student_socioeconomic: 'socioeconomic',
        // NEW ADDITIONS
        student_address_city: 'address',
        student_living: 'living',
        student_work: 'work_status',
        student_scholarship: 'scholarship',
        student_language: 'language',
        student_last_school: 'last_school',
    };

    const currentFrontendSort = reverseSortKeyMap[activeSortColumn] || '';

    // 🧠 FIXED: Added local state and debounce ref for the search bar
    const [searchQuery, setSearchQuery] = useState(currentSearch);
    const [isRemoveMode, setIsRemoveMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const initialRender = useRef(true);

    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
            return;
        }
        
        const delayDebounceFn = setTimeout(() => {
            router.get(route('student.masterlist'), { 
                search: searchQuery,
                sort: activeSortColumn,
                direction: activeSortDirection
            }, { preserveState: true, preserveScroll: true, replace: true });
        }, 300);

        return () => clearTimeout(delayDebounceFn);
        
    }, [searchQuery]);

    const handleSearch = (value) => {
        // Handle both raw strings and input events
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
        let newDirection = 'asc'; // Default first click is always Ascending

        // 🧠 FIXED: 3-State Sort Logic (Ascending -> Descending -> None)
        if (activeSortColumn === dbColumn) {
            if (activeSortDirection === 'asc') {
                newDirection = 'desc';
            } else if (activeSortDirection === 'desc') {
                newColumn = ''; // Reset to None
                newDirection = ''; // Reset to None
            }
        }

        const params = { search: searchQuery };
        
        // Only attach sort params if we aren't in the "None" state
        if (newColumn) params.sort = newColumn;
        if (newDirection) params.direction = newDirection;

        router.get(route('student.masterlist'), params, { preserveState: true, preserveScroll: true });
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

    // 🧠 THE FIX: Catch the payload and send it via Inertia
    const handleBulkDelete = (reasonData, stopLoading) => {
        router.post(route('students.bulk-destroy'), reasonData, {
            onSuccess: () => {
                setIsRemoveModalOpen(false);
                setIsRemoveMode(false);
                setSelectedIds(new Set());
                // AuthenticatedLayout will automatically pop the Toast here!
            },
            onFinish: () => {
                if (stopLoading) stopLoading(); 
            }
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Student Masterlist" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="Student Masterlist"
                    search={searchQuery}
                    onSearch={handleSearch}
                    paginationData={data?.links ? data : { data: studentList, links: [] }}
                    onPageChange={handlePageChange}
                    exportEndpoint={route('students.export', { 
                        search: currentSearch,
                        sort: activeSortColumn,
                        direction: activeSortDirection
                    })}
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
                        ) : null
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
                            <SortableHeader label="Socioeconomic Status" sortKey="socioeconomic" currentSort={currentFrontendSort} currentDirection={activeSortDirection} onSort={handleSort} />
                            <SortableHeader label="Address" sortKey="address" currentSort={currentFrontendSort} currentDirection={activeSortDirection} onSort={handleSort} />
                            <SortableHeader label="Living" sortKey="living_arrangement" currentSort={currentFrontendSort} currentDirection={activeSortDirection} onSort={handleSort} />
                            <SortableHeader label="Work Status" sortKey="work_status" currentSort={currentFrontendSort} currentDirection={activeSortDirection} onSort={handleSort} />
                            <SortableHeader label="Scholarship" sortKey="scholarship" currentSort={currentFrontendSort} currentDirection={activeSortDirection} onSort={handleSort} />
                            <SortableHeader label="Language" sortKey="language" currentSort={currentFrontendSort} currentDirection={activeSortDirection} onSort={handleSort} />
                            <SortableHeader label="Last School" sortKey="last_school" currentSort={currentFrontendSort} currentDirection={activeSortDirection} onSort={handleSort} />
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
                        <AddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} filterMode="masterlist" />
                        <RemoveStudentModal isOpen={isRemoveModalOpen} onClose={() => setIsRemoveModalOpen(false)} selectedStudents={studentList.filter(s => selectedIds.has(s.id))} />
                    </>
                )}
            </div>
        </AuthenticatedLayout>
    );
}