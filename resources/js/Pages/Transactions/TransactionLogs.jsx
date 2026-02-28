import React, { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { TableContainer } from "@/Components/ReusableTable";
import { useMockInertia, MOCK_TRANSACTIONS } from "@/Hooks/useMockInertia"; // You will need to create this mock data
import FilterTransactionModal from "@/Components/Modals/FilterTransactionModal"; // We will create this below
import FilterInfoCard from "@/Components/FilterInfoCard";

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

export default function TransactionLogs({ transactions }) {
    // --- INERTIA / MOCK SETUP ---
    const isBackendReady = !!transactions;
    const mock = useMockInertia(MOCK_TRANSACTIONS);

    const data = isBackendReady ? transactions : mock.data;
    const search = isBackendReady ? "" : mock.search;
    const handleSearch = isBackendReady ? (val) => {} : mock.setSearch;
    const handlePageChange = isBackendReady ? null : mock.setPage;

    const sortColumn = isBackendReady ? null : mock.sortColumn;
    const sortDirection = isBackendReady ? null : mock.sortDirection;
    const handleSort = isBackendReady ? (col) => {} : mock.handleSort;

    // --- FILTER STATES ---
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState({
        college: "ALL",
        action: "ALL",
    });

    const handleApplyFilter = (newFilters) => {
        setActiveFilters(newFilters);
        // Trigger Inertia visit here when backend is ready
    };

    // --- EXPORT DROPDOWN ---
    const ExportDropdown = () => {
        const [isOpen, setIsOpen] = useState(false);
        const dropdownRef = useRef(null);
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
            document.addEventListener("mousedown", handleClickOutside);
            return () =>
                document.removeEventListener("mousedown", handleClickOutside);
        }, []);

        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 px-5 py-2 border rounded-[5px] text-sm font-bold transition-all duration-300 shadow-sm ${isOpen ? "bg-[#5c297c] text-white border-[#5c297c]" : "bg-white text-[#5c297c] border-[#5c297c] hover:bg-[#5c297c] hover:text-white"}`}
                >
                    <i className="bi bi-download text-lg"></i>
                    <span>Export</span>
                    <i
                        className={`bi bi-chevron-down transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    ></i>
                </button>
                <div
                    className={`absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-[999] transition-all duration-300 origin-top-right ${isOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"}`}
                >
                    <div className="p-1 flex flex-col">
                        <a
                            href={`/export/transaction/csv${queryParams}`}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-purple-50 hover:text-[#5c297c] transition-colors rounded-md group"
                        >
                            <i className="bi bi-filetype-csv text-lg text-gray-400 group-hover:text-[#5c297c]"></i>
                            <span className="font-medium">Export to CSV</span>
                        </a>
                        <a
                            href={`/export/transaction/excel${queryParams}`}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-purple-50 hover:text-[#5c297c] transition-colors rounded-md group"
                        >
                            <i className="bi bi-file-earmark-excel text-lg text-gray-400 group-hover:text-[#5c297c]"></i>
                            <span className="font-medium">Export to Excel</span>
                        </a>
                        <a
                            href={`/export/transaction/pdf${queryParams}`}
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
                    filterDisplay={
                        <FilterInfoCard
                            filters={activeFilters}
                            mode="transaction" // Custom mode for the FilterInfoCard
                        />
                    }
                    headerActions={
                        <>
                            <button
                                onClick={() => setIsFilterModalOpen(true)}
                                className="flex items-center gap-2 px-5 py-2 bg-[#5c297c] text-white border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#4a1f63] transition-all duration-300 shadow-sm"
                            >
                                <i className="bi bi-funnel-fill"></i>
                                <span>Filter</span>
                            </button>
                            <ExportDropdown />
                        </>
                    }
                >
                    <thead>
                        <tr className="bg-[#5c297c] text-white text-sm uppercase leading-normal">
                            <SortableHeader
                                label="Log ID"
                                sortKey="log_id"
                                currentSort={sortColumn}
                                currentDirection={sortDirection}
                                onSort={handleSort}
                            />
                            <SortableHeader
                                label="User"
                                sortKey="user"
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
                                label="Role"
                                sortKey="role"
                                currentSort={sortColumn}
                                currentDirection={sortDirection}
                                onSort={handleSort}
                            />
                            <SortableHeader
                                label="Action"
                                sortKey="action"
                                currentSort={sortColumn}
                                currentDirection={sortDirection}
                                onSort={handleSort}
                            />
                            <SortableHeader
                                label="Target Entity"
                                sortKey="target_entity"
                                currentSort={sortColumn}
                                currentDirection={sortDirection}
                                onSort={handleSort}
                            />
                            <th className="py-3 px-6 font-bold">Remarks</th>
                            <SortableHeader
                                label="Date and Time"
                                sortKey="created_at"
                                currentSort={sortColumn}
                                currentDirection={sortDirection}
                                onSort={handleSort}
                            />
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-medium">
                        {data.data.length > 0 ? (
                            data.data.map((log, index) => (
                                <tr
                                    key={log.id}
                                    className={`border-b border-gray-100 hover:bg-purple-50 transition-all duration-300 ${index % 2 === 0 ? "bg-white" : "bg-[#efeded]"}`}
                                >
                                    <td className="py-3 px-6 font-bold text-[#5c297c]">
                                        {log.log_id}
                                    </td>
                                    <td className="py-3 px-6 uppercase">
                                        {log.user}
                                    </td>
                                    <td className="py-3 px-6 uppercase">
                                        {log.college}
                                    </td>
                                    <td className="py-3 px-6 uppercase">
                                        {log.role}
                                    </td>
                                    <td className="py-3 px-6 uppercase">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-bold ${log.action === "DELETE" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}
                                        >
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6 uppercase">
                                        {log.target_entity}
                                    </td>
                                    <td
                                        className="py-3 px-6 italic text-gray-500 max-w-xs truncate"
                                        title={log.remarks}
                                    >
                                        {log.remarks}
                                    </td>
                                    <td className="py-3 px-6 whitespace-nowrap">
                                        {log.created_at}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="8"
                                    className="py-8 text-center text-gray-500 italic"
                                >
                                    No transaction logs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </TableContainer>

                <FilterTransactionModal
                    isOpen={isFilterModalOpen}
                    onClose={() => setIsFilterModalOpen(false)}
                    currentFilters={activeFilters}
                    onApply={handleApplyFilter}
                />
            </div>
        </AuthenticatedLayout>
    );
}
