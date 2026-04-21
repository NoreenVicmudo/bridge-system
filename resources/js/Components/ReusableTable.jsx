import React, { useState, useEffect, useRef } from "react";
import { Link, router } from "@inertiajs/react";
import ExportButton from "@/Components/ExportButton";

export const SortableHeader = ({
    label,
    sortKey,
    className = "",
    // Fallbacks for older pages
    currentSort,
    currentDirection,
    onSort,
}) => {
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const activeSort = currentSort !== undefined ? currentSort : urlParams.get('sort');
    const activeDir = currentDirection !== undefined ? currentDirection : urlParams.get('direction');

    const isActive = activeSort === sortKey;

    const handleSortClick = () => {
        if (onSort) return onSort(sortKey);

        let nextDir = 'asc';
        let nextSort = sortKey;

        if (activeSort === sortKey) {
            if (activeDir === 'asc') {
                nextDir = 'desc';
            } else {
                nextSort = null;
            }
        }

        if (nextSort) {
            urlParams.set('sort', nextSort);
            urlParams.set('direction', nextDir);
        } else {
            urlParams.delete('sort');
            urlParams.delete('direction');
        }
        urlParams.delete('page');

        router.get(window.location.pathname, Object.fromEntries(urlParams.entries()), {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    return (
        <th
            onClick={handleSortClick}
            className={`py-3 px-6 font-bold cursor-pointer hover:bg-[#4a1f63] transition-all duration-300 ease-in-out select-none group ${className}`}
        >
            <div className="flex items-center gap-2">
                {label}
                <div className="flex flex-col text-[10px] leading-none text-white/50 group-hover:text-white transition-colors duration-300 ease-in-out">
                    <i className={`bi bi-caret-up-fill ${isActive && activeDir === "asc" ? "text-[#ffb736]" : ""}`}></i>
                    <i className={`bi bi-caret-down-fill ${isActive && activeDir === "desc" ? "text-[#ffb736]" : ""}`}></i>
                </div>
            </div>
        </th>
    );
};

export function TableContainer({
    title,
    paginationData,
    headerActions,
    footerActions,
    children,
    filterDisplay,
    showEditNote = true,
    exportEndpoint,
    search,
    onSearch,
}) {
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const urlSearch = urlParams.get('search') || '';

    const [localSearch, setLocalSearch] = useState(search !== undefined ? search : urlSearch);
    
    const searchTimeout = useRef(null);

    useEffect(() => {
        if (search === undefined) setLocalSearch(urlSearch);
    }, [urlSearch, search]);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setLocalSearch(val); 

        if (onSearch) {
            onSearch(val);
            return;
        }

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        searchTimeout.current = setTimeout(() => {
            const currentParams = new URLSearchParams(window.location.search);
            
            if (val) {
                currentParams.set('search', val);
            } else {
                currentParams.delete('search');
            }
            currentParams.delete('page');

            router.get(window.location.pathname, Object.fromEntries(currentParams.entries()), {
                preserveState: true,
                preserveScroll: true,
                replace: true
            });
        }, 300);
    };

    const getVisibleLinks = (links) => {
        if (!links || links.length <= 5) return links;

        const prev = links[0];
        const next = links[links.length - 1];
        
        const numberLinks = links.slice(1, -1).filter(l => l.label !== '...');
        
        if (numberLinks.length <= 5) return links;

        const activeIndex = numberLinks.findIndex(l => l.active);
        const lastIndex = numberLinks.length - 1;
        const delta = 1; 

        const result = [];
        let lastAdded = -1;

        numberLinks.forEach((link, index) => {
            if (
                index === 0 || 
                index === lastIndex || 
                (index >= activeIndex - delta && index <= activeIndex + delta)
            ) {
                if (lastAdded !== -1 && index - lastAdded > 1) {
                    result.push({ label: "...", url: null, active: false });
                }
                result.push(link);
                lastAdded = index;
            }
        });

        return [prev, ...result, next];
    };

    return (
        <>
            <style>{`
                .scrollbar-purple::-webkit-scrollbar { height: 8px; }
                .scrollbar-purple::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
                .scrollbar-purple::-webkit-scrollbar-thumb { background: #5c297c; border-radius: 4px; transition: background 0.3s ease; }
                .scrollbar-purple::-webkit-scrollbar-thumb:hover { background: #ffb736; }
                .scrollbar-purple { scrollbar-width: thin; scrollbar-color: #5c297c #f1f1f1; }
            `}</style>

            <div className="bg-white rounded-[10px] shadow-[0_6px_25px_rgba(0,0,0,0.1)] flex flex-col w-full font-['Montserrat'] animate-fade-in relative">
                <div className="p-6 border-b border-gray-100 flex flex-col gap-6 rounded-t-[10px]">
                    <h2 className="text-[24px] md:text-[28px] font-bold text-[#5c297c] text-center w-full">
                        {title}
                    </h2>

                    {filterDisplay && (
                        <div className="w-full animate-fade-in-up">
                            {filterDisplay}
                        </div>
                    )}

                    {/* 🧠 FIXED: Header actions container layout */}
                    <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4 w-full">
                        <div className="w-full md:w-auto">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={localSearch}
                                onChange={handleSearchChange}
                                className="w-full md:w-[300px] h-[40px] px-4 border border-[#5c297c] rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#ffb736] transition-all duration-300 ease-in-out"
                            />
                        </div>
                        
                        {/* Added flex-wrap and responsive justification */}
                        <div className="flex flex-wrap justify-center md:justify-end gap-2 items-center w-full md:w-auto">
                            {exportEndpoint && <ExportButton endpoint={exportEndpoint} />}
                            {headerActions}
                        </div>
                    </div>
                </div>

                <div className="w-full overflow-x-auto scrollbar-purple">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        {children}
                    </table>
                </div>

                {(paginationData || footerActions || showEditNote) && (
                    <div className="p-4 bg-[#f8f9fa] border-t border-gray-200 rounded-b-[10px]">
                        {paginationData && (
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                                <div className="text-sm text-gray-600 font-medium">
                                    Showing {paginationData.from || 0} to {paginationData.to || 0} of {paginationData.total || 0} entries
                                </div>
                                <div className="flex flex-wrap justify-center gap-1">
                                    {getVisibleLinks(paginationData.links).map((link, i) => {
                                        const isEllipsis = link.label === '...';
                                        
                                        const className = isEllipsis
                                            ? "px-2 py-1.5 text-gray-500 font-bold flex items-end"
                                            : `px-3 py-1.5 rounded text-sm font-medium transition-all duration-300 ease-in-out ${
                                                link.active ? "bg-[#ffb736] text-white shadow-sm" : "bg-[#5c297c] text-white hover:bg-[#4a1f63]"
                                            } ${!link.url ? "opacity-50 cursor-not-allowed bg-gray-400" : ""}`;

                                        return link.url ? (
                                            <Link 
                                                key={i} 
                                                href={link.url} 
                                                preserveState 
                                                preserveScroll 
                                                className={className} 
                                                dangerouslySetInnerHTML={{ __html: link.label }} 
                                            />
                                        ) : (
                                            <span key={i} className={className} dangerouslySetInnerHTML={{ __html: link.label }} />
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {showEditNote && (
                            <div className="flex-1 mb-4">
                                <p className="text-[#ed1c24] text-xs md:text-sm font-medium italic">
                                    Note: Click on the ID/Username to edit the information.
                                </p>
                            </div>
                        )}
                        
                        {footerActions && (
                            <>
                                {(paginationData || showEditNote) && <hr className="border-gray-300 mb-4" />}
                                <div className="flex gap-3 min-h-[42px] items-center">
                                    {footerActions}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}