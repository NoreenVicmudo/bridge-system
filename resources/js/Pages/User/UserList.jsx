import React, { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { TableContainer } from "@/Components/ReusableTable";
import { useMockInertia, MOCK_USERS } from "@/Hooks/useMockInertia"; // Needs to be added to useMockInertia.js
import RemoveUserModal from "@/Components/Modals/RemoveUserModal"; // We will create this

// --- SORTABLE HEADER COMPONENT ---
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

export default function UserList({ users }) {
    // --- INERTIA / MOCK SETUP ---
    const isBackendReady = !!users;
    const mock = useMockInertia(MOCK_USERS);

    const data = isBackendReady ? users : mock.data;
    const search = isBackendReady ? "" : mock.search;
    const handleSearch = isBackendReady ? (val) => {} : mock.setSearch;
    const handlePageChange = isBackendReady ? null : mock.setPage;

    // Sorting State
    const sortColumn = isBackendReady ? null : mock.sortColumn;
    const sortDirection = isBackendReady ? null : mock.sortDirection;
    const handleSort = isBackendReady ? (col) => {} : mock.handleSort;

    // --- STATES ---
    const [isRemoveMode, setIsRemoveMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

    // --- HANDLERS ---
    const toggleSelection = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = data.data.map((u) => u.id);
            setSelectedIds(new Set([...selectedIds, ...allIds]));
        } else {
            const newSelected = new Set(selectedIds);
            data.data.forEach((u) => newSelected.delete(u.id));
            setSelectedIds(newSelected);
        }
    };

    const cancelRemoveMode = () => {
        setIsRemoveMode(false);
        setSelectedIds(new Set());
    };

    const getSelectedUsers = () => {
        return data.data.filter((user) => selectedIds.has(user.id));
    };

    // --- FOOTER BUTTONS ---
    const renderFooterButtons = () => {
        if (!isRemoveMode) {
            return (
                <button
                    onClick={() => setIsRemoveMode(true)}
                    className="px-6 py-2 bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#ed1c24] transition-all duration-300 ease-in-out shadow-sm"
                >
                    Remove User
                </button>
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
                            : "Remove User"}
                    </button>
                </>
            );
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="List of Users" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="List of Users"
                    search={search}
                    onSearch={handleSearch}
                    paginationData={data}
                    onPageChange={handlePageChange}
                    showEditNote={true} // User IDs should be clickable
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
                            <SortableHeader
                                label="Username"
                                sortKey="username"
                                currentSort={sortColumn}
                                currentDirection={sortDirection}
                                onSort={handleSort}
                            />
                            <SortableHeader
                                label="Full Name"
                                sortKey="name"
                                currentSort={sortColumn}
                                currentDirection={sortDirection}
                                onSort={handleSort}
                            />
                            <SortableHeader
                                label="Email"
                                sortKey="email"
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
                                label="Position"
                                sortKey="position"
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
                                label="Date Registered"
                                sortKey="date_registered"
                                currentSort={sortColumn}
                                currentDirection={sortDirection}
                                onSort={handleSort}
                            />
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {data.data.length > 0 ? (
                            data.data.map((user, index) => (
                                <tr
                                    key={user.id}
                                    className={`border-b border-gray-100 hover:bg-purple-50 transition-all duration-300 ease-in-out ${index % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}
                                >
                                    {isRemoveMode && (
                                        <td className="py-3 px-6 text-center animate-fade-in">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(
                                                    user.id,
                                                )}
                                                onChange={() =>
                                                    toggleSelection(user.id)
                                                }
                                                className="accent-[#5c297c] cursor-pointer w-4 h-4 transition-all duration-300 ease-in-out"
                                            />
                                        </td>
                                    )}
                                    <td className="py-3 px-6">
                                        <Link
                                            href={`#edit/${user.id}`}
                                            className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold hover:bg-[#e0a800] hover:scale-105 hover:shadow-md transition-all duration-300 ease-in-out text-center min-w-[100px]"
                                        >
                                            {user.username}
                                        </Link>
                                    </td>
                                    <td className="py-3 px-6 text-gray-800 uppercase font-bold">
                                        {user.name}
                                    </td>
                                    <td className="py-3 px-6 text-[#5c297c] font-semibold">
                                        {user.email}
                                    </td>
                                    <td className="py-3 px-6 uppercase">
                                        {user.college}
                                    </td>
                                    <td className="py-3 px-6 uppercase">
                                        {user.position}
                                    </td>
                                    <td className="py-3 px-6 uppercase">
                                        {user.program}
                                    </td>
                                    <td className="py-3 px-6">
                                        {user.date_registered}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={isRemoveMode ? 8 : 7}
                                    className="py-8 text-center text-gray-500 italic"
                                >
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </TableContainer>

                <RemoveUserModal
                    isOpen={isRemoveModalOpen}
                    onClose={() => setIsRemoveModalOpen(false)}
                    selectedUsers={getSelectedUsers()}
                    onSuccess={() => {
                        setIsRemoveModalOpen(false);
                        cancelRemoveMode();
                    }}
                />
            </div>
        </AuthenticatedLayout>
    );
}
