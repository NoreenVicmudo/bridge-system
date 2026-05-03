import React from "react";

export default function FilterInfoCard({ filters, mode = "section" }) {
    if (!filters || Object.keys(filters).length === 0) return null;

    // --- ACADEMIC MODE (for GWA, etc.) ---
    if (mode === "academic") {
        const items = [];
        if (filters.academic_year) items.push({ label: "A.Y.", value: filters.academic_year, icon: "bi-calendar-event" });
        if (filters.semester) items.push({ label: "Semester", value: filters.semester, icon: "bi-clock-history" });
        if (filters.college_name) items.push({ label: "College", value: filters.college_name, icon: "bi-building" });
        else if (filters.college) items.push({ label: "College ID", value: filters.college, icon: "bi-building" });
        if (filters.program_name) items.push({ label: "Program", value: filters.program_name, icon: "bi-book" });
        else if (filters.program) items.push({ label: "Program ID", value: filters.program, icon: "bi-book" });
        if (filters.year_level) items.push({ label: "Year Level", value: filters.year_level, icon: "bi-bar-chart" });
        if (filters.section) items.push({ label: "Section", value: filters.section, icon: "bi-people" });

        return (
            <div className="bg-white border border-gray-200 border-l-4 border-l-[#5c297c] rounded-r-lg shadow-sm p-5 w-full max-w-5xl mx-auto mb-6 font-['Montserrat'] animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                    {items.map((item, idx) => (
                        <InfoItem key={idx} label={item.label} value={item.value} icon={item.icon} />
                    ))}
                </div>
            </div>
        );
    }

    // --- SECTION MODE (existing student info) ---
    if (mode === "section") {
        return (
            <div className="bg-white border border-gray-200 border-l-4 border-l-[#5c297c] rounded-r-lg shadow-sm p-5 w-full max-w-5xl mx-auto mb-6 font-['Montserrat'] animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                    <div className="flex flex-col gap-3">
                        <InfoItem label="Academic Year" value={filters.academic_year} icon="bi-calendar-event" />
                        <InfoItem label="Semester" value={filters.semester} icon="bi-clock-history" />
                    </div>
                    <div className="flex flex-col gap-3">
                        <InfoItem label="College" value={filters.college_name} icon="bi-building" />
                        <InfoItem label="Program" value={filters.program_name} icon="bi-book" />
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-4">
                            <InfoItem label="Year Level" value={filters.year_level} icon="bi-bar-chart" />
                            <InfoItem label="Section" value={filters.section} icon="bi-people" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- BATCH MODE (existing student info & program metrics) ---
    if (mode === "batch") {
        return (
            <div className="bg-white border border-gray-200 border-l-4 border-l-[#5c297c] rounded-r-lg shadow-sm p-5 w-full max-w-5xl mx-auto mb-6 font-['Montserrat'] animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                    <div className="flex flex-col gap-3">
                        <InfoItem label="Year" value={filters.batch_year || filters.calendar_year} icon="bi-calendar3" />
                        <InfoItem label="Board Batch" value={filters.board_batch || filters.batch_number} icon="bi-award" />
                    </div>
                    <div className="flex flex-col gap-3 md:col-span-2">
                        <InfoItem label="College" value={filters.batch_college_name || filters.college_name || filters.batch_college || filters.college} icon="bi-building" />
                        <InfoItem label="Program" value={filters.batch_program_name || filters.program_name || filters.batch_program || filters.program} icon="bi-book" />
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

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