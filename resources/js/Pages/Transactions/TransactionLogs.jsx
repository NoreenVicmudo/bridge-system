import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { TableContainer, SortableHeader } from "@/Components/ReusableTable";
import { useMockInertia, MOCK_TRANSACTIONS } from "@/Hooks/useMockInertia";
import FilterTransactionModal from "@/Components/Modals/FilterTransactionModal";
import FilterInfoCard from "@/Components/FilterInfoCard";

export default function TransactionLogs({ transactions }) {
    const isBackendReady = !!transactions;
    const mock = useMockInertia(MOCK_TRANSACTIONS);

    const data = isBackendReady ? transactions : mock.data;
    const search = isBackendReady ? "" : mock.search;
    const handleSearch = isBackendReady ? () => {} : mock.setSearch;
    const handlePageChange = isBackendReady ? null : mock.setPage;
    const sortColumn = isBackendReady ? null : mock.sortColumn;
    const sortDirection = isBackendReady ? null : mock.sortDirection;
    const handleSort = isBackendReady ? () => {} : mock.handleSort;

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState({ college: "ALL", action: "ALL" });

    return (
        <AuthenticatedLayout>
            <Head title="Transaction Logs" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <TableContainer
                    title="Transaction Logs"
                    search={search}
                    onSearch={handleSearch}
                    paginationData={data}
                    onPageChange={handlePageChange}
                    showEditNote={false}
                    exportEndpoint="/transactions/export/csv"
                    filterDisplay={<FilterInfoCard filters={activeFilters} mode="transaction" />}
                    headerActions={
                        <button onClick={() => setIsFilterModalOpen(true)} className="flex items-center justify-center gap-2 px-5 h-[40px] bg-[#5c297c] text-white border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#4a1f63] transition-all duration-300 ease-in-out shadow-sm shrink-0">
                            <i className="bi bi-funnel-fill leading-none"></i><span className="leading-none">Filter</span>
                        </button>
                    }
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase leading-normal">
                            <SortableHeader label="Log ID" sortKey="log_id" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="User" sortKey="user" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="College" sortKey="college" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="Role" sortKey="role" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="Action" sortKey="action" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="Target Entity" sortKey="target_entity" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                            <th className="py-3 px-6 font-bold">Remarks</th>
                            <SortableHeader label="Date and Time" sortKey="created_at" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {data.data.length > 0 ? data.data.map((log, i) => (
                            <tr key={log.id} className={`border-b border-gray-100 hover:bg-purple-50 transition-all duration-300 ease-in-out ${i % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}>
                                <td className="py-3 px-6 font-bold text-[#5c297c]">{log.log_id}</td>
                                <td className="py-3 px-6 uppercase">{log.user}</td>
                                <td className="py-3 px-6 uppercase">{log.college}</td>
                                <td className="py-3 px-6 uppercase">{log.role}</td>
                                <td className="py-3 px-6 uppercase"><span className={`px-3 py-1 rounded-full text-xs font-bold ${log.action === "DELETE" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>{log.action}</span></td>
                                <td className="py-3 px-6 uppercase">{log.target_entity}</td>
                                <td className="py-3 px-6 italic text-gray-500 max-w-xs truncate" title={log.remarks}>{log.remarks}</td>
                                <td className="py-3 px-6 whitespace-nowrap">{log.created_at}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan="8" className="py-8 text-center text-gray-500 italic">No transaction logs found.</td></tr>
                        )}
                    </tbody>
                </TableContainer>

                <FilterTransactionModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} currentFilters={activeFilters} onApply={setActiveFilters} />
            </div>
        </AuthenticatedLayout>
    );
}