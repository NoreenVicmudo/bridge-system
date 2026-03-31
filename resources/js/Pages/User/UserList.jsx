import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { TableContainer, SortableHeader } from "@/Components/ReusableTable";
import { useMockInertia, MOCK_USERS } from "@/Hooks/useMockInertia";
import RemoveUserModal from "@/Components/Modals/RemoveUserModal";

export default function UserList({ users }) {
    const isBackendReady = !!users;
    const mock = useMockInertia(MOCK_USERS);

    const data = isBackendReady ? users : mock.data;
    const search = isBackendReady ? "" : mock.search;
    const handleSearch = isBackendReady ? () => {} : mock.setSearch;
    const handlePageChange = isBackendReady ? null : mock.setPage;
    const sortColumn = isBackendReady ? null : mock.sortColumn;
    const sortDirection = isBackendReady ? null : mock.sortDirection;
    const handleSort = isBackendReady ? () => {} : mock.handleSort;

    const [isRemoveMode, setIsRemoveMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

    const toggleSelection = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id); else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = (e) => {
        if (e.target.checked) setSelectedIds(new Set([...selectedIds, ...data.data.map(u => u.id)]));
        else setSelectedIds(new Set());
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
                    showEditNote={true}
                    // No exportEndpoint means it naturally doesn't render an Export button!
                    footerActions={
                        !isRemoveMode ? (
                            <button onClick={() => setIsRemoveMode(true)} className="px-6 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#ed1c24] transition-all duration-300 ease-in-out shadow-sm">Remove User</button>
                        ) : (
                            <>
                                <button onClick={() => { setIsRemoveMode(false); setSelectedIds(new Set()); }} className="px-6 h-[40px] bg-white text-gray-600 border border-gray-300 rounded-[5px] text-sm font-medium hover:bg-gray-100 transition-all duration-300 ease-in-out shadow-sm">Cancel</button>
                                <button onClick={() => setIsRemoveModalOpen(true)} disabled={selectedIds.size === 0} className={`px-6 h-[40px] rounded-[5px] text-sm font-medium transition-all duration-300 ease-in-out shadow-sm ${selectedIds.size > 0 ? "bg-[#ed1c24] text-white hover:bg-[#c4151c]" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}>
                                    {selectedIds.size > 0 ? `Remove (${selectedIds.size})` : "Remove User"}
                                </button>
                            </>
                        )
                    }
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase leading-normal">
                            {isRemoveMode && <th className="py-3 px-6 text-center w-[50px]"><input type="checkbox" onChange={toggleSelectAll} className="accent-[#5c297c] cursor-pointer w-4 h-4 transition-all duration-300 ease-in-out" /></th>}
                            <SortableHeader label="Username" sortKey="username" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="Full Name" sortKey="name" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="Email" sortKey="email" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="College" sortKey="college" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="Position" sortKey="position" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="Program" sortKey="program" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="Date Registered" sortKey="date_registered" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {data.data.length > 0 ? data.data.map((user, i) => (
                            <tr key={user.id} className={`border-b border-gray-100 hover:bg-purple-50 transition-all duration-300 ease-in-out ${i % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}>
                                {isRemoveMode && <td className="py-3 px-6 text-center"><input type="checkbox" checked={selectedIds.has(user.id)} onChange={() => toggleSelection(user.id)} className="accent-[#5c297c] cursor-pointer w-4 h-4 transition-all duration-300 ease-in-out" /></td>}
                                <td className="py-3 px-6"><Link href={`#edit/${user.id}`} className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold hover:bg-[#e0a800] hover:scale-105 hover:shadow-md transition-all duration-300 ease-in-out min-w-[100px] text-center">{user.username}</Link></td>
                                <td className="py-3 px-6 text-gray-800 uppercase font-bold">{user.name}</td>
                                <td className="py-3 px-6 text-[#5c297c] font-semibold">{user.email}</td>
                                <td className="py-3 px-6 uppercase">{user.college}</td>
                                <td className="py-3 px-6 uppercase">{user.position}</td>
                                <td className="py-3 px-6 uppercase">{user.program}</td>
                                <td className="py-3 px-6">{user.date_registered}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={isRemoveMode ? 8 : 7} className="py-8 text-center text-gray-500 italic">No users found.</td></tr>
                        )}
                    </tbody>
                </TableContainer>

                <RemoveUserModal isOpen={isRemoveModalOpen} onClose={() => setIsRemoveModalOpen(false)} selectedUsers={data.data.filter(u => selectedIds.has(u.id))} onSuccess={() => { setIsRemoveModalOpen(false); setIsRemoveMode(false); setSelectedIds(new Set()); }} />
            </div>
        </AuthenticatedLayout>
    );
}