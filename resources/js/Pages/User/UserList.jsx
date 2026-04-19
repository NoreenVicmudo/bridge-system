import React, { useState, useCallback, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { TableContainer, SortableHeader } from "@/Components/ReusableTable";
import RemoveUserModal from "@/Components/Modals/RemoveUserModal";

export default function UserList({ users, queryParams = {} }) {
    const params = Array.isArray(queryParams) ? {} : queryParams;

    // Inertia state tracking
    const [search, setSearch] = useState(params.search || "");
    const [sortColumn, setSortColumn] = useState(params.sort || "date_registered");
    const [sortDirection, setSortDirection] = useState(params.direction || "desc");

    // Modal and selection state
    const [isRemoveMode, setIsRemoveMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

    // 1. Add the debounce ref
    const initialRender = useRef(true);

    const fetchUsers = useCallback((overrides = {}) => {
        router.get(route('users.index'), {
            search: overrides.search ?? search,
            sort: overrides.sort ?? sortColumn,
            direction: overrides.direction ?? sortDirection,
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    }, [search, sortColumn, sortDirection]);

    // 2. Add the Debounce Effect
    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            fetchUsers({ search: search });
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [search]); // ONLY watch 'search'

    // 3. Make handleSearch ONLY update the local React state instantly
    const handleSearch = (e) => {
        const val = e?.target ? e.target.value : e;
        setSearch(val);
    };

    const handleSort = (column) => {
        const isAsc = sortColumn === column && sortDirection === "asc";
        const newDirection = isAsc ? "desc" : "asc";
        setSortColumn(column);
        setSortDirection(newDirection);
        fetchUsers({ sort: column, direction: newDirection });
    };

    const handlePageChange = (url) => {
        if (!url) return;
        router.get(url, {}, { preserveState: true, preserveScroll: true });
    };

    const toggleSelection = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id); else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = (e) => {
        if (e.target.checked) setSelectedIds(new Set([...selectedIds, ...dataList.map(u => u.id)]));
        else setSelectedIds(new Set());
    };

    // Accept the reasonData and a callback to stop the modal's loading spinner
    const handleBulkDelete = (reasonData, stopLoading) => {
        
        // Combine the selected IDs with the reasons from the modal
        const payload = {
            ids: Array.from(selectedIds),
            ...reasonData
        };

        router.post(route('users.bulk-destroy'), payload, {
            onSuccess: () => {
                setIsRemoveModalOpen(false);
                setIsRemoveMode(false);
                setSelectedIds(new Set());
            },
            onFinish: () => {
                // Stop the spinning loading wheel in the modal when backend finishes
                if (stopLoading) stopLoading(); 
            }
        });
    };

    const dataList = users?.data || [];

    return (
        <AuthenticatedLayout>
            <Head title="List of Users" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="List of Users"
                    search={search}
                    onSearch={handleSearch}
                    paginationData={users}
                    onPageChange={handlePageChange}
                    showEditNote={true}
                    footerActions={
                        !isRemoveMode ? (
                            <div className="flex gap-3">
                                <Link href={route('users.create')} className="flex items-center justify-center px-6 h-[40px] bg-[#ffb736] text-white rounded-[5px] text-sm font-bold hover:bg-[#e0a800] transition-all shadow-sm">
                                    <i className="bi bi-person-plus-fill mr-2"></i> Add User
                                </Link>
                                <button onClick={() => setIsRemoveMode(true)} className="px-6 h-[40px] bg-[#5c297c] text-white rounded-[5px] text-sm font-medium hover:bg-[#ed1c24] transition-all shadow-sm">
                                    Remove User
                                </button>
                            </div>
                        ) : (
                            <>
                                <button onClick={() => { setIsRemoveMode(false); setSelectedIds(new Set()); }} className="px-6 h-[40px] bg-white text-gray-600 border border-gray-300 rounded-[5px] text-sm font-medium hover:bg-gray-100 transition-all shadow-sm">Cancel</button>
                                <button onClick={() => setIsRemoveModalOpen(true)} disabled={selectedIds.size === 0} className={`px-6 h-[40px] rounded-[5px] text-sm font-medium transition-all shadow-sm ${selectedIds.size > 0 ? "bg-[#ed1c24] text-white hover:bg-[#c4151c]" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}>
                                    {selectedIds.size > 0 ? `Remove (${selectedIds.size})` : "Remove User"}
                                </button>
                            </>
                        )
                    }
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase leading-normal">
                            {isRemoveMode && <th className="py-3 px-6 text-center w-[50px]"><input type="checkbox" onChange={toggleSelectAll} className="accent-[#5c297c] cursor-pointer w-4 h-4" /></th>}
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
                        {dataList.length > 0 ? dataList.map((user, i) => (
                            <tr key={user.id} className={`border-b border-gray-100 hover:bg-purple-50 transition-all ${i % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}>
                                {isRemoveMode && <td className="py-3 px-6 text-center"><input type="checkbox" checked={selectedIds.has(user.id)} onChange={() => toggleSelection(user.id)} className="accent-[#5c297c] cursor-pointer w-4 h-4" /></td>}
                                <td className="py-3 px-6">
                                    <Link href={route('users.edit', user.id)} className="inline-block px-4 py-1.5 rounded-[6px] bg-[#ffb736] text-white font-bold hover:bg-[#e0a800] hover:scale-105 hover:shadow-md transition-all min-w-[100px] text-center">
                                        {user.username}
                                    </Link>
                                </td>
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

                <RemoveUserModal 
                    isOpen={isRemoveModalOpen} 
                    onClose={() => setIsRemoveModalOpen(false)} 
                    selectedUsers={dataList.filter(u => selectedIds.has(u.id))} 
                    onSuccess={handleBulkDelete} 
                />
            </div>
        </AuthenticatedLayout>
    );
}