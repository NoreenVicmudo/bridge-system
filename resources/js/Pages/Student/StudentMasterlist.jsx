import React, { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { TableContainer } from "@/Components/ReusableTable";
import { useMockInertia, MOCK_STUDENTS } from "@/Hooks/useMockInertia";
import AddStudentModal from "@/Components/Modals/AddStudentModal";
import RemoveStudentModal from "@/Components/Modals/RemoveStudentModal";

// --- NEW COMPONENT: Sortable Header ---
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
};

export default function StudentMasterlist({ students }) {
    const isBackendReady = !!students;
    const mock = useMockInertia(MOCK_STUDENTS);

    const data = isBackendReady ? students : mock.data;
    const search = isBackendReady ? "" : mock.search;
    const handleSearch = isBackendReady ? (val) => {} : mock.setSearch;
    const handlePageChange = isBackendReady ? null : mock.setPage;

    // SORTING HANDLER
    // If backend is ready, this would likely be: router.getWithQuery({ sort: col, dir: dir })
    const sortColumn = isBackendReady ? null : mock.sortColumn;
    const sortDirection = isBackendReady ? null : mock.sortDirection;
    const handleSort = isBackendReady
        ? (col) => console.log("Sort backend by", col)
        : mock.handleSort;

    // --- REMOVE MODE STATE ---
    const [isRemoveMode, setIsRemoveMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

    // ... (Existing toggleSelection, toggleSelectAll, cancelRemoveMode, ExportDropdown, renderFooterButtons functions remain exactly the same) ...
    // Assuming they are here for brevity.
    // ...

    // --- Helper Functions to keep code clean (Copy existing ones here) ---
    const toggleSelection = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = data.data.map((s) => s.id);
            setSelectedIds(new Set([...selectedIds, ...allIds]));
        } else {
            const newSelected = new Set(selectedIds);
            data.data.forEach((s) => newSelected.delete(s.id));
            setSelectedIds(newSelected);
        }
    };

    const cancelRemoveMode = () => {
        setIsRemoveMode(false);
        setSelectedIds(new Set());
    };

    const getSelectedStudents = () => {
        return data.data.filter((student) => selectedIds.has(student.id));
    };

    const ExportDropdown = () => {
        const [isOpen, setIsOpen] = useState(false);
        const dropdownRef = useRef(null);
        // Include sort params in export link!
        const queryParams =
            typeof window !== "undefined" ? window.location.search : "";

        useEffect(() => {
            function handleClickOutside(event) {
                if (
                    dropdownRef.current &&
                    !dropdownRef.current.contains(event.target)
                )
                    setIsOpen(false);
            }
            function handleScroll() {
                setIsOpen(false);
            }
            document.addEventListener("mousedown", handleClickOutside);
            window.addEventListener("scroll", handleScroll, true);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
                window.removeEventListener("scroll", handleScroll, true);
            };
        }, [dropdownRef]);

        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 px-5 py-2 border rounded-[5px] text-sm font-bold transition-all duration-300 ease-in-out shadow-sm ${isOpen ? "bg-[#5c297c] text-white border-[#5c297c]" : "bg-white text-[#5c297c] border-[#5c297c] hover:bg-[#5c297c] hover:text-white"}`}
                >
                    <i className="bi bi-download text-lg"></i>
                    <span>Export</span>
                    <i
                        className={`bi bi-chevron-down transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    ></i>
                </button>
                <div
                    className={`absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-100 overflow-hidden z-[999] transition-all duration-300 origin-top-right transform ${isOpen ? "opacity-100 scale-100 translate-y-0 visible" : "opacity-0 scale-95 -translate-y-2 invisible"}`}
                >
                    <div className="p-1 flex flex-col">
                        <a
                            href={`/students/export/csv${queryParams}`}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-purple-50 hover:text-[#5c297c] transition-colors rounded-md group"
                        >
                            <i className="bi bi-filetype-csv text-lg text-gray-400 group-hover:text-[#5c297c]"></i>
                            <span className="font-medium">Export to CSV</span>
                        </a>
                        <a
                            href={`/students/export/excel${queryParams}`}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-purple-50 hover:text-[#5c297c] transition-colors rounded-md group"
                        >
                            <i className="bi bi-file-earmark-excel text-lg text-gray-400 group-hover:text-[#5c297c]"></i>
                            <span className="font-medium">Export to Excel</span>
                        </a>
                        <a
                            href={`/students/export/pdf${queryParams}`}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-purple-50 hover:text-[#5c297c] transition-colors rounded-md group"
                        >
                            <i className="bi bi-file-earmark-pdf text-lg text-gray-400 group-hover:text-[#5c297c]"></i>
                            <span className="font-medium">Export to PDF</span>
                        </a>
                    </div>
                </div>
            </div>
        );
    };

    const renderFooterButtons = () => {
        if (!isRemoveMode) {
            return (
                <>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-6 py-2 bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#4a1f63] transition-all duration-300 ease-in-out shadow-sm"
                    >
                        Add Student
                    </button>
                    <button
                        onClick={() => setIsRemoveMode(true)}
                        className="px-6 py-2 bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#ed1c24] transition-all duration-300 ease-in-out shadow-sm"
                    >
                        Remove Student
                    </button>
                </>
            );
        } else {
            return (
                <>
                    <button
                        onClick={cancelRemoveMode}
                        className="px-6 py-2 bg-white text-gray-600 border border-gray-300 rounded-[5px] text-sm font-medium hover:bg-gray-100 transition-all duration-300 ease-in-out shadow-sm"
                    >
                        Cancel
                    </button>

                    {/* MODIFIED: Button is always visible, but disabled if selectedIds is empty */}
                    <button
                        onClick={() => setIsRemoveModalOpen(true)}
                        disabled={selectedIds.size === 0}
                        className={`px-6 py-2 rounded-[5px] text-sm font-medium transition-all duration-300 ease-in-out shadow-sm 
                            ${
                                selectedIds.size > 0
                                    ? "bg-[#ed1c24] text-white hover:bg-[#c4151c] cursor-pointer"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                    >
                        {selectedIds.size > 0
                            ? `Remove (${selectedIds.size})`
                            : "Remove Student"}
                    </button>
                </>
            );
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Student Masterlist" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="Student Masterlist"
                    search={search}
                    onSearch={handleSearch}
                    paginationData={data}
                    onPageChange={handlePageChange}
                    headerActions={<ExportDropdown />}
                    footerActions={renderFooterButtons()}
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase leading-normal">
                            {isRemoveMode && (
                                <th className="py-3 px-6 font-bold text-center w-[50px] animate-fade-in">
                                    <input
                                        type="checkbox"
                                        onChange={toggleSelectAll}
                                        className="accent-[#5c297c] cursor-pointer w-4 h-4 transition-all duration-300 ease-in-out"
                                    />
                                </th>
                            )}

                            {/* --- SORTABLE HEADERS --- */}
                            <SortableHeader
                                label="Student ID"
                                sortKey="student_number"
                                currentSort={sortColumn}
                                currentDirection={sortDirection}
                                onSort={handleSort}
                            />
                            <SortableHeader
                                label="Student Name"
                                sortKey="name"
                                currentSort={sortColumn}
                                currentDirection={sortDirection}
                                onSort={handleSort}
                            />
                            <SortableHeader
                                label="College"
                                sortKey="college"
                                currentSort={sortColumn}
                                currentDirection={sortDirection}
                                onSort={handleSort}
                            />
                            <SortableHeader
                                label="Program"
                                sortKey="program"
                                currentSort={sortColumn}
                                currentDirection={sortDirection}
                                onSort={handleSort}
                            />
                            <SortableHeader
                                label="Age"
                                sortKey="age"
                                currentSort={sortColumn}
                                currentDirection={sortDirection}
                                onSort={handleSort}
                                className="text-center"
                            />
                            <SortableHeader
                                label="Sex"
                                sortKey="sex"
                                currentSort={sortColumn}
                                currentDirection={sortDirection}
                                onSort={handleSort}
                                className="text-center"
                            />
                            <SortableHeader
                                label="Socioeconomic Status"
                                sortKey="socioeconomic"
                                currentSort={sortColumn}
                                currentDirection={sortDirection}
                                onSort={handleSort}
                            />

                            {/* --- NON-SORTABLE HEADERS (If you don't want to sort these, keep as normal <th>) --- */}
                            <th className="py-3 px-6 font-bold">
                                Permanent Address
                            </th>
                            <th className="py-3 px-6 font-bold">
                                Living Arrangement
                            </th>
                            <th className="py-3 px-6 font-bold">Work Status</th>
                            <th className="py-3 px-6 font-bold">Scholarship</th>
                            <th className="py-3 px-6 font-bold">Language</th>
                            <th className="py-3 px-6 font-bold">Last School</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {data.data.length > 0 ? (
                            data.data.map((student, index) => (
                                <tr
                                    key={student.id}
                                    className={`border-b border-gray-100 hover:bg-purple-50 transition-all duration-300 ease-in-out ${index % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}
                                >
                                    {isRemoveMode && (
                                        <td className="py-3 px-6 text-center animate-fade-in">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(
                                                    student.id,
                                                )}
                                                onChange={() =>
                                                    toggleSelection(student.id)
                                                }
                                                className="accent-[#5c297c] cursor-pointer w-4 h-4 transition-all duration-300 ease-in-out"
                                            />
                                        </td>
                                    )}
                                    <td className="py-3 px-6">
                                        <Link
                                            href={`#edit/${student.id}`}
                                            className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold hover:bg-[#e0a800] hover:scale-105 hover:shadow-md transition-all duration-300 ease-in-out text-center min-w-[100px]"
                                        >
                                            {student.student_number}
                                        </Link>
                                    </td>
                                    <td className="py-3 px-6 text-gray-800 uppercase">
                                        {student.name}
                                    </td>
                                    <td className="py-3 px-6 uppercase">
                                        {student.college}
                                    </td>
                                    <td className="py-3 px-6 uppercase">
                                        {student.program}
                                    </td>
                                    <td className="py-3 px-6 text-center">
                                        {student.age}
                                    </td>
                                    <td className="py-3 px-6 text-center uppercase">
                                        {student.sex}
                                    </td>
                                    <td className="py-3 px-6 font-bold">
                                        <span
                                            className={
                                                student.socioeconomic === "POOR"
                                                    ? "text-[#ed1c24]"
                                                    : "text-gray-600"
                                            }
                                        >
                                            {student.socioeconomic}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6 uppercase min-w-[300px]">
                                        {student.address}
                                    </td>
                                    <td className="py-3 px-6 uppercase">
                                        {student.living_arrangement}
                                    </td>
                                    <td className="py-3 px-6 uppercase">
                                        {student.work_status}
                                    </td>
                                    <td className="py-3 px-6 uppercase">
                                        {student.scholarship}
                                    </td>
                                    <td className="py-3 px-6 uppercase">
                                        {student.language}
                                    </td>
                                    <td className="py-3 px-6 uppercase">
                                        {student.last_school}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={isRemoveMode ? 15 : 14}
                                    className="py-8 text-center text-gray-500 italic"
                                >
                                    No students found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </TableContainer>

                <AddStudentModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                />
                <RemoveStudentModal
                    isOpen={isRemoveModalOpen}
                    onClose={() => setIsRemoveModalOpen(false)}
                    selectedStudents={getSelectedStudents()}
                />
            </div>
        </AuthenticatedLayout>
    );
}
