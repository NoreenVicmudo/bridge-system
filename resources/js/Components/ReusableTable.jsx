import React from "react";
import { Link } from "@inertiajs/react";

export function TableContainer({
    title,
    search,
    onSearch,
    headerActions,
    footerActions,
    children,
    paginationData,
    onPageChange,
    filterDisplay, // <--- NEW PROP for the "Student Information" card
}) {
    return (
        <>
            <style>{`
                .scrollbar-purple::-webkit-scrollbar { height: 8px; }
                .scrollbar-purple::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
                .scrollbar-purple::-webkit-scrollbar-thumb { background: #5c297c; border-radius: 4px; transition: background 0.3s ease; }
                .scrollbar-purple::-webkit-scrollbar-thumb:hover { background: #ffb736; }
                .scrollbar-purple { scrollbar-width: thin; scrollbar-color: #5c297c #f1f1f1; }
                input[type="checkbox"]:checked { background-color: #5c297c; border-color: #5c297c; accent-color: #5c297c; }
            `}</style>

            <div className="bg-white rounded-[10px] shadow-[0_6px_25px_rgba(0,0,0,0.1)] flex flex-col w-full font-['Montserrat'] animate-fade-in relative">
                
                {/* --- HEADER --- */}
                <div className="p-6 border-b border-gray-100 flex flex-col gap-6 rounded-t-[10px]">
                    <h2 className="text-[24px] md:text-[28px] font-bold text-[#5c297c] text-center w-full">
                        {title}
                    </h2>

                    {/* --- NEW: FILTER DISPLAY SLOT --- */}
                    {filterDisplay && (
                        <div className="w-full animate-fade-in-up">
                            {filterDisplay}
                        </div>
                    )}

                    {/* Controls Row */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full">
                        <div className="w-full md:w-auto">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => onSearch(e.target.value)}
                                className="w-full md:w-[300px] px-4 py-2 border border-[#5c297c] rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#ffb736] transition-all duration-300 ease-in-out"
                            />
                        </div>
                        {/* Actions (Fixed Width) */}
                        <div className="flex shrink-0 gap-2">
                            {headerActions}
                        </div>
                    </div>
                </div>

                {/* --- TABLE CONTENT --- */}
                <div className="w-full overflow-x-auto scrollbar-purple">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        {children}
                    </table>
                </div>

                {/* --- FOOTER --- */}
                <div className="p-4 bg-[#f8f9fa] border-t border-gray-200 rounded-b-[10px]">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                        <div className="text-sm text-gray-600 font-medium">
                            Showing {paginationData.from} to {paginationData.to} of {paginationData.total} entries
                        </div>
                        <div className="flex gap-1">
                            {paginationData.links.map((link, i) => {
                                const isSimulated = typeof onPageChange === "function";
                                const className = `px-3 py-1.5 rounded text-sm font-medium transition-all duration-300 ease-in-out ${
                                    link.active
                                        ? "bg-[#ffb736] text-white shadow-sm"
                                        : "bg-[#5c297c] text-white hover:bg-[#4a1f63]"
                                } ${!link.url ? "opacity-50 cursor-not-allowed bg-gray-400" : ""}`;

                                if (isSimulated) {
                                    return (
                                        <button key={i} disabled={!link.url} onClick={() => link.url && onPageChange(link.page)} className={className} dangerouslySetInnerHTML={{ __html: link.label }} />
                                    );
                                }
                                return link.url ? (
                                    <Link key={i} href={link.url} className={className} dangerouslySetInnerHTML={{ __html: link.label }} />
                                ) : (
                                    <span key={i} className={className} dangerouslySetInnerHTML={{ __html: link.label }} />
                                );
                            })}
                        </div>
                    </div>

                    <div className="mb-2">
                        <p className="text-[#ed1c24] text-xs md:text-sm font-medium italic">
                            Note: Click on the Student ID to edit the student information.
                        </p>
                    </div>
                    <hr className="border-gray-300 mb-4" />
                    <div className="flex gap-3 min-h-[42px] items-center">
                        {footerActions}
                    </div>
                </div>
            </div>
        </>
    );
}