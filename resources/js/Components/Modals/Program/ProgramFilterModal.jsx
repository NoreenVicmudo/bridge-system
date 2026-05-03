import React, { useState, useEffect, useMemo } from "react";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import CustomSelectGroup from "@/Components/SelectGroup";

export default function ProgramFilterModal({ 
    isOpen, 
    onClose, 
    currentFilters, 
    onApply, 
    dbColleges = [], 
    dbPrograms = [] 
}) {
    const { auth } = usePage().props;
    const user = auth.user;

    const isCollegeRestricted = !!user?.college_id;
    const isProgramRestricted = !!user?.program_id;

    const [values, setValues] = useState({
        college: "",
        program: "",
        calendar_year: "", 
        batch_number: "",  
    });

    const [combinations, setCombinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [animate, setAnimate] = useState(false);

    // 🧠 FIXED: Added background scrolling lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"; // Prevent body scroll
        } else {
            document.body.style.overflow = "unset"; // Restore body scroll
        }

        // Cleanup
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // --- 1. FETCH DATABASE COMBINATIONS & SET INITIAL VALUES ---
    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
            
            // Apply current filters, falling back to restricted user access
            setValues({
                college: currentFilters?.college?.toString() || (isCollegeRestricted ? user.college_id.toString() : ""),
                program: currentFilters?.program?.toString() || (isProgramRestricted ? user.program_id.toString() : ""),
                calendar_year: currentFilters?.calendar_year?.toString() || "",
                batch_number: currentFilters?.batch_number?.toString() || "",
            });

            // Fetch active combinations if we haven't yet
            if (combinations.length === 0) {
                setLoading(true);
                axios.get(route('program.filter-options')) 
                    .then(res => {
                        setCombinations(res.data.combinations || []);
                        setLoading(false);
                    })
                    .catch(err => {
                        console.error(err);
                        setLoading(false);
                    });
            }
        } else {
            setAnimate(false);
        }
    }, [isOpen, currentFilters, isCollegeRestricted, isProgramRestricted, user, combinations.length]);

    // --- 2. DYNAMIC CASCADING DROPDOWNS ---
    const collegeOptions = useMemo(() => {
        return dbColleges.map(c => ({
            value: (c.college_id || c.value).toString(), // Safe fallback
            label: c.name || c.label                     // Safe fallback
        }));
    }, [dbColleges]);

    const programOptions = useMemo(() => {
        if (!values.college) return [];
        return dbPrograms
            .filter(p => p.college_id.toString() === values.college)
            .map(p => ({ value: p.program_id.toString(), label: p.name }));
    }, [values.college, dbPrograms]);

    const calendarYearOptions = useMemo(() => {
        if (!values.program) return [];
        const activeYears = new Set(
            combinations
                .filter(c => c.program_id.toString() === values.program)
                .map(c => c.year.toString())
        );

        if (activeYears.size === 0) {
            const currentYear = new Date().getFullYear();
            return [
                { value: currentYear.toString(), label: currentYear.toString() },
                { value: (currentYear + 1).toString(), label: (currentYear + 1).toString() }
            ];
        }

        return Array.from(activeYears)
            .sort((a, b) => b - a) 
            .map(y => ({ value: y, label: y }));
    }, [values.program, combinations]);

    const batchNumberOptions = useMemo(() => {
        if (!values.calendar_year) return [];
        const activeBatches = new Set(
            combinations
                .filter(c => c.program_id.toString() === values.program && c.year.toString() === values.calendar_year)
                .map(c => c.batch_number.toString())
        );

        if (activeBatches.size === 0) {
            return [
                { value: "1", label: "Batch 1" },
                { value: "2", label: "Batch 2" }
            ];
        }

        return Array.from(activeBatches)
            .sort((a, b) => a - b)
            .map(b => ({ value: b, label: `Batch ${b}` }));
    }, [values.program, values.calendar_year, combinations]);

    // --- 3. HANDLERS ---
    const handleChange = (field, value) => {
        let newValues = { ...values, [field]: value };

        if (field === "college") {
            newValues.program = isProgramRestricted ? user.program_id.toString() : "";
            newValues.calendar_year = "";
            newValues.batch_number = "";
        } else if (field === "program") {
            newValues.calendar_year = "";
            newValues.batch_number = "";
        } else if (field === "calendar_year") {
            newValues.batch_number = "";
        }

        setValues(newValues);
    };

    const handleApply = () => {
        if (!values.college || !values.program || !values.calendar_year || !values.batch_number) return;

        const collegeName = collegeOptions.find(c => c.value === values.college)?.label || "";
        const programName = programOptions.find(p => p.value === values.program)?.label || "";

        onApply({ 
            ...values, 
            college_name: collegeName, 
            program_name: programName 
        });
        closeModal();
    };

    const closeModal = () => {
        setAnimate(false);
        setTimeout(onClose, 300);
    };

    if (!isOpen) return null;

    return (
        // 🧠 FIXED: Increased z-index to 9999
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${animate ? "bg-gray-900/60 backdrop-blur-sm" : "bg-transparent backdrop-blur-none pointer-events-none"}`}>
            <div className={`bg-white rounded-2xl w-[90%] max-w-[700px] shadow-2xl relative flex flex-col transition-all duration-300 transform ${animate ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
                <div className="bg-[#5c297c] p-6 text-center relative rounded-t-2xl shrink-0">
                    <h2 className="text-2xl font-bold text-white">Filter Students (Program Batch)</h2>
                    <button onClick={closeModal} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
                        <i className="bi bi-x-lg text-xl"></i>
                    </button>
                </div>

                <div className="p-8 overflow-y-auto max-h-[80vh] flex-1">
                    {loading ? (
                        <div className="text-center py-8 font-medium text-[#5c297c]">Loading batch data...</div>
                    ) : (
                        <div className="space-y-4">
                            <CustomSelectGroup
                                label="College"
                                value={values.college}
                                onChange={(e) => handleChange("college", e.target.value)}
                                options={collegeOptions}
                                disabled={isCollegeRestricted}
                            />

                            <CustomSelectGroup
                                label="Program"
                                value={values.program}
                                onChange={(e) => handleChange("program", e.target.value)}
                                options={programOptions}
                                disabled={!values.college || isProgramRestricted}
                                placeholder={!values.college ? "Select College first" : "Select Program"}
                            />

                            <CustomSelectGroup
                                label="Calendar Year"
                                value={values.calendar_year}
                                onChange={(e) => handleChange("calendar_year", e.target.value)}
                                options={calendarYearOptions}
                                disabled={!values.program}
                                placeholder={!values.program ? "Select Program first" : "Select Year"}
                            />

                            <CustomSelectGroup
                                label="Board Exam Batch"
                                value={values.batch_number}
                                onChange={(e) => handleChange("batch_number", e.target.value)}
                                options={batchNumberOptions}
                                disabled={!values.calendar_year}
                                placeholder={!values.calendar_year ? "Select Year first" : "Select Batch"}
                            />
                        </div>
                    )}

                    <div className="mt-8 flex justify-center gap-4">
                        <button onClick={closeModal} className="px-6 py-3 bg-white text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition shadow-sm">
                            Cancel
                        </button>
                        <button
                            onClick={handleApply}
                            disabled={!values.college || !values.program || !values.calendar_year || !values.batch_number}
                            className={`px-6 py-3 rounded-md transition shadow-md ${
                                values.college && values.program && values.calendar_year && values.batch_number
                                    ? "bg-[#5c297c] text-white hover:bg-[#ffb736] cursor-pointer"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
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