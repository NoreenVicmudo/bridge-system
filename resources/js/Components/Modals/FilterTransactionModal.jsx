import React, { useState, useEffect, useMemo } from "react";
import { usePage } from "@inertiajs/react";
import CustomSelectGroup from "@/Components/SelectGroup";

export default function FilterTransactionModal({
    isOpen,
    onClose,
    currentFilters,
    onApply,
    dbColleges = [],
    dbPrograms = []
}) {
    // 1. GRAB USER FROM INERTIA
    const { auth } = usePage().props;
    const user = auth.user;

    // 2. DETERMINE RESTRICTIONS
    const isCollegeRestricted = !!user?.college_id;
    const isProgramRestricted = !!user?.program_id;

    const [animate, setAnimate] = useState(false);
    const [filters, setFilters] = useState({
        college: "ALL",
        program: "ALL",
        action: "ALL",
    });

    // 🧠 FIXED: Lock background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"; // Prevent body scroll
        } else {
            document.body.style.overflow = "unset"; // Restore body scroll
        }

        // Cleanup function to ensure scroll is restored if component unmounts
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Reset local state when modal opens, applying strict user fallbacks
    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
            setFilters({
                college: currentFilters?.college || (isCollegeRestricted ? user.college_id.toString() : "ALL"),
                program: currentFilters?.program || (isProgramRestricted ? user.program_id.toString() : "ALL"),
                action: currentFilters?.action || "ALL",
            });
        }
    }, [isOpen, currentFilters, isCollegeRestricted, isProgramRestricted, user]);

    // 3. BUILD DYNAMIC CASCADING OPTIONS
    const collegeOptions = useMemo(() => {
        const base = dbColleges.map(c => ({ value: c.college_id.toString(), label: c.name }));
        return [{ value: "ALL", label: "ALL" }, ...base];
    }, [dbColleges]);

    const programOptions = useMemo(() => {
        let filtered = dbPrograms;
        if (filters.college !== "ALL") {
            filtered = dbPrograms.filter(p => p.college_id.toString() === filters.college);
        }
        const base = filtered.map(p => ({ value: p.program_id.toString(), label: p.name }));
        return [{ value: "ALL", label: "ALL" }, ...base];
    }, [dbPrograms, filters.college]);

    // 4. CASCADE HANDLER
    const handleChange = (field, value) => {
        let newFilters = { ...filters, [field]: value };
        
        // If college changes, reset program (unless locked by user role)
        if (field === "college") {
            newFilters.program = isProgramRestricted ? user.program_id.toString() : "ALL";
        }
        
        setFilters(newFilters);
    };

    const handleClose = () => {
        setAnimate(false);
        setTimeout(() => onClose(), 300);
    };

    const handleApply = () => {
        if (!filters.college || !filters.program || !filters.action) return;
        setAnimate(false);
        setTimeout(() => {
            onApply(filters);
            onClose();
        }, 300);
    };

    const isValid = filters.college && filters.program && filters.action;

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[1000] flex items-center justify-center transition-all duration-300 ${animate ? "bg-gray-900/60 backdrop-blur-sm" : "bg-transparent backdrop-blur-none"}`}>
            <div className={`bg-white rounded-2xl w-[90%] max-w-[400px] p-0 shadow-2xl relative flex flex-col overflow-hidden transition-all duration-300 transform ${animate ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
                
                <div className="bg-[#5c297c] p-5 text-center relative">
                    <h2 className="text-xl font-bold text-white tracking-wide">Filter Transactions</h2>
                    <button onClick={handleClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-all">
                        <i className="bi bi-x-lg text-xl"></i>
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-4">
                    <CustomSelectGroup
                        label="College:"
                        value={filters.college}
                        onChange={(e) => handleChange("college", e.target.value)}
                        options={collegeOptions}
                        disabled={isCollegeRestricted}
                        vertical={true}
                    />

                    <CustomSelectGroup
                        label="Program:"
                        value={filters.program}
                        onChange={(e) => handleChange("program", e.target.value)}
                        options={programOptions}
                        disabled={filters.college === "ALL" || isProgramRestricted}
                        vertical={true}
                    />

                    <CustomSelectGroup
                        label="Action:"
                        value={filters.action}
                        onChange={(e) => handleChange("action", e.target.value)}
                        options={[
                            { value: "ALL", label: "ALL" },
                            { value: "ACTIVITY LOG", label: "ACTIVITY LOG" },
                            { value: "ADD STUDENT", label: "ADD STUDENT" },
                            { value: "UPDATE STUDENT", label: "UPDATE STUDENT" },
                            { value: "REMOVE STUDENT", label: "REMOVE STUDENT" },
                            { value: "ACADEMIC PROFILE", label: "ACADEMIC PROFILE" },
                            { value: "PROGRAM METRICS", label: "PROGRAM METRICS" },
                            { value: "REPORT GENERATION", label: "REPORT GENERATION" },
                            { value: "ADDITIONAL ENTRY", label: "ADDITIONAL ENTRY" },
                        ]}
                        vertical={true}
                    />

                    <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-gray-100">
                        <button onClick={handleClose} className="px-5 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all">
                            Cancel
                        </button>
                        <button
                            onClick={handleApply}
                            disabled={!isValid}
                            className={`px-5 py-2 text-sm font-bold rounded-lg shadow-md transition-all ${
                                isValid ? "text-white bg-[#5c297c] hover:bg-[#ffb736] cursor-pointer" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                        >
                            Apply Filter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}