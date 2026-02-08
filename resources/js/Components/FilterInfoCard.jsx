import React from "react";

export default function FilterInfoCard({ filters, mode = "section" }) {
    if (!filters) return null;

    return (
        <div className="bg-white border border-gray-200 border-l-4 border-l-[#5c297c] rounded-r-lg shadow-sm p-5 w-full max-w-5xl mx-auto mb-6 font-['Montserrat'] animate-fade-in">
            
            {/* --- SECTION MODE --- */}
            {mode === "section" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                    
                    {/* Column 1: Timeline */}
                    <div className="flex flex-col gap-3">
                        <InfoItem label="Academic Year" value={filters.academic_year} icon="bi-calendar-event" />
                        <InfoItem label="Semester" value={filters.semester} icon="bi-clock-history" />
                    </div>

                    {/* Column 2: Department (Spans wider if needed) */}
                    <div className="flex flex-col gap-3">
                        <InfoItem label="College" value={filters.college} icon="bi-building" />
                        <InfoItem label="Program" value={filters.program} icon="bi-book" />
                    </div>

                    {/* Column 3: Specifics */}
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-4">
                            <InfoItem label="Year Level" value={filters.year_level} icon="bi-bar-chart" />
                            <InfoItem label="Section" value={filters.section} icon="bi-people" />
                        </div>
                    </div>
                </div>
            )}

            {/* --- BATCH MODE --- */}
            {mode === "batch" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                    <div className="flex flex-col gap-3">
                        <InfoItem label="Year" value={filters.batch_year} icon="bi-calendar3" />
                        <InfoItem label="Board Batch" value={filters.board_batch} icon="bi-award" />
                    </div>
                    
                    <div className="flex flex-col gap-3 md:col-span-2">
                        <InfoItem label="College" value={filters.batch_college} icon="bi-building" />
                        <InfoItem label="Program" value={filters.batch_program} icon="bi-book" />
                    </div>
                </div>
            )}
        </div>
    );
}

// Compact Sub-component
const InfoItem = ({ label, value, icon }) => (
    <div className="flex flex-col">
        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1 mb-0.5">
            {icon && <i className={`bi ${icon} text-[#5c297c]`}></i>}
            {label}
        </span>
        <span className="text-sm font-bold text-gray-800 truncate" title={value}>
            {value || "—"}
        </span>
    </div>
);