import React, { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { TableContainer, SortableHeader } from "@/Components/ReusableTable";
import FilterTransactionModal from "@/Components/Modals/FilterTransactionModal";
import FilterInfoCard from "@/Components/FilterInfoCard";

export default function TransactionLogs({ transactions, queryParams = {}, dbColleges = [], dbPrograms = [], sort = "", direction = "" }) {
    const params = Array.isArray(queryParams) ? {} : queryParams;

    const [activeFilters, setActiveFilters] = useState({ 
        college: params.college || "ALL", 
        program: params.program || "ALL",
        action: params.action || "ALL" 
    });
    
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // 🧠 1. Read directly from URL to prevent arrows from getting stuck
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const actualSort = urlParams.get('sort') || sort || ""; 
    const actualDirection = urlParams.get('direction') || direction || "desc";

    // 🧠 2. Setup local state and debounce ref for the search bar
    const [searchQuery, setSearchQuery] = useState(params.search || "");
    const initialRender = useRef(true);

    // 🧠 3. The Debounce Effect
    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            const query = { ...activeFilters, search: searchQuery };
            if (actualSort) { query.sort = actualSort; query.direction = actualDirection; }
            router.get(route('transactions.index'), query, { preserveState: true, preserveScroll: true, replace: true });
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // 🧠 4. Handlers using searchQuery
    const handleSearch = (e) => {
        const val = typeof e === 'string' ? e : e.target.value;
        setSearchQuery(val);
    };

    // 🧠 5. Handle 3-State Sorting (Asc -> Desc -> None)
    const handleSort = (column) => {
        let nextDir = 'asc';
        let nextSort = column;

        if (actualSort === column) {
            if (actualDirection === 'asc') {
                nextDir = 'desc';
            } else {
                nextDir = null;
                nextSort = null;
            }
        }

        const query = { ...activeFilters, search: searchQuery };
        if (nextSort) {
            query.sort = nextSort;
            query.direction = nextDir;
        }
        router.get(route('transactions.index'), query, { preserveState: true, preserveScroll: true });
    };

    const handleApplyFilters = (newFilters) => {
        setActiveFilters(newFilters);
        const query = { ...newFilters, search: searchQuery };
        if (actualSort) { query.sort = actualSort; query.direction = actualDirection; }
        router.get(route('transactions.index'), query, { preserveState: true, preserveScroll: true });
    };

    const handlePageChange = (url) => {
        if (!url) return;
        const query = { ...activeFilters, search: searchQuery };
        if (actualSort) { query.sort = actualSort; query.direction = actualDirection; }
        router.get(url, query, { preserveState: true, preserveScroll: true });
    };

    const logs = transactions?.data || [];

    return (
        <AuthenticatedLayout>
            <Head title="Transaction Logs" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="Transaction Logs"
                    search={searchQuery}
                    onSearch={handleSearch}
                    paginationData={transactions}
                    onPageChange={handlePageChange}
                    showEditNote={false}
                    // 🧠 FIXED: Removed exportEndpoint to hide the Export button
                    filterDisplay={<FilterInfoCard filters={activeFilters} mode="transaction" />}
                    headerActions={
                        <button onClick={() => setIsFilterModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-[#5c297c] text-white border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#4a1f63] shadow-sm shrink-0">
                            <i className="bi bi-funnel-fill leading-none"></i><span className="leading-none">Filter</span>
                        </button>
                    }
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase leading-normal">
                            <SortableHeader label="Log ID" sortKey="log_id" currentSort={actualSort} currentDirection={actualDirection} onSort={handleSort} />
                            <SortableHeader label="User" sortKey="user" currentSort={actualSort} currentDirection={actualDirection} onSort={handleSort} />
                            <SortableHeader label="College" sortKey="college" currentSort={actualSort} currentDirection={actualDirection} onSort={handleSort} />
                            <SortableHeader label="Role" sortKey="role" currentSort={actualSort} currentDirection={actualDirection} onSort={handleSort} />
                            <SortableHeader label="Action" sortKey="action" currentSort={actualSort} currentDirection={actualDirection} onSort={handleSort} />
                            <SortableHeader label="Target Entity" sortKey="target_entity" currentSort={actualSort} currentDirection={actualDirection} onSort={handleSort} />
                            <th className="py-3 px-6 font-bold">Remarks</th>
                            <SortableHeader label="Date and Time" sortKey="created_at" currentSort={actualSort} currentDirection={actualDirection} onSort={handleSort} />
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {logs.length > 0 ? logs.map((log, i) => (
                            <tr 
                                key={`${log.action}-${log.log_id}-${i}`} 
                                className={`border-b border-gray-100 hover:bg-purple-50 ${i % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}
                            >
                                <td className="py-3 px-6 font-bold text-[#5c297c]">{log.log_id}</td>
                                <td className="py-3 px-6 uppercase">{log.user}</td>
                                <td className="py-3 px-6 uppercase">{log.college}</td>
                                <td className="py-3 px-6 uppercase">{log.role}</td>
                                <td className="py-3 px-6 uppercase">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${["REMOVE STUDENT", "DELETE"].includes(log.action) ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="py-3 px-6 uppercase">{log.target_entity}</td>
                                <td className="py-3 px-6 italic text-gray-500 max-w-xs truncate" title={log.remarks}>{log.remarks}</td>
                                <td className="py-3 px-6 whitespace-nowrap">{log.created_at}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan="8" className="py-8 text-center text-gray-500 italic">No transaction logs found.</td></tr>
                        )}
                    </tbody>
                </TableContainer>

                <FilterTransactionModal 
                    isOpen={isFilterModalOpen} 
                    onClose={() => setIsFilterModalOpen(false)} 
                    currentFilters={activeFilters} 
                    onApply={handleApplyFilters}
                    dbColleges={dbColleges}
                    dbPrograms={dbPrograms}
                />
            </div>
        </AuthenticatedLayout>
    );
}