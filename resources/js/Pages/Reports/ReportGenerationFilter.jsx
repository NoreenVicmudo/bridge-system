import { useState, useEffect, useMemo } from "react";
import { usePage, router } from "@inertiajs/react";
import axios from "axios";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CustomSelectGroup from "@/Components/SelectGroup";

export default function ReportGenerationFilter({ dbColleges = [], dbPrograms = [] }) {
    const { auth } = usePage().props;
    const user = auth.user;

    const isCollegeRestricted = !!user?.college_id;
    const isProgramRestricted = !!user?.program_id;

    const [values, setValues] = useState({
        college: "",
        program: "",
        year_start: "", 
        year_end: "",  
    });

    const [combinations, setCombinations] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- 1. FETCH ACTUAL DATABASE COMBINATIONS ---
    useEffect(() => {
        axios.get(route('program.filter-options')) 
            .then(res => {
                setCombinations(res.data.combinations || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    // --- 2. APPLY RESTRICTIONS ON MOUNT ---
    useEffect(() => {
        let initial = { ...values };
        if (isCollegeRestricted) initial.college = user.college_id.toString();
        if (isProgramRestricted) initial.program = user.program_id.toString();
        setValues(prev => ({ ...prev, ...initial }));
    }, [user, isCollegeRestricted, isProgramRestricted]);

    // --- 3. DYNAMIC CASCADING DROPDOWNS ---
    const collegeOptions = useMemo(() => {
        return dbColleges.map(c => ({
            value: (c.college_id || c.value).toString(),
            label: c.name || c.label || "Unknown College"
        }));
    }, [dbColleges]);

    const programOptions = useMemo(() => {
        if (!values.college) return [];
        return dbPrograms
            .filter(p => p.college_id && p.college_id.toString() === values.college)
            .map(p => ({ 
                value: p.program_id ? p.program_id.toString() : "", 
                label: p.name || "Unknown Program" 
            }));
    }, [values.college, dbPrograms]);

    // Base available years for the selected program
    const yearOptions = useMemo(() => {
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
                { value: (currentYear - 1).toString(), label: (currentYear - 1).toString() }
            ];
        }

        return Array.from(activeYears)
            .sort((a, b) => b - a) // Sort descending (newest first)
            .map(y => ({ value: y, label: y }));
    }, [values.program, combinations]);

    // End Year Options (Must be >= Start Year)
    const yearEndOptions = useMemo(() => {
        if (!values.year_start) return yearOptions;
        return yearOptions.filter(y => parseInt(y.value) >= parseInt(values.year_start));
    }, [yearOptions, values.year_start]);

    // --- 4. HANDLERS ---
    const handleChange = (field, value) => {
        let newValues = { ...values, [field]: value };

        // Cascading resets
        if (field === "college") {
            newValues.program = isProgramRestricted ? user.program_id.toString() : "";
            newValues.year_start = "";
            newValues.year_end = "";
        } else if (field === "program") {
            newValues.year_start = "";
            newValues.year_end = "";
        } else if (field === "year_start") {
            // If the new start year is greater than the current end year, reset the end year
            if (newValues.year_end && parseInt(value) > parseInt(newValues.year_end)) {
                newValues.year_end = "";
            }
        }

        setValues(newValues);
    };

    const handleClear = () => {
        let resetValues = { college: "", program: "", year_start: "", year_end: "" };
        if (isCollegeRestricted) resetValues.college = user.college_id.toString();
        if (isProgramRestricted) resetValues.program = user.program_id.toString();
        setValues(resetValues);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const collegeName = collegeOptions.find(c => c.value === values.college)?.label;
        const programName = programOptions.find(p => p.value === values.program)?.label;
        
        const filterData = { 
            ...values, 
            college_name: collegeName, 
            program_name: programName 
        };

        router.get(route('report.index'), filterData);
    };

    const isFormComplete = values.college && values.program && values.year_start && values.year_end;

    if (loading) return (
        <AuthenticatedLayout>
            <div className="flex justify-center items-center h-screen text-[#5c297c] font-bold">
                Loading Report Data...
            </div>
        </AuthenticatedLayout>
    );

    return (
        <AuthenticatedLayout>
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-[700px] bg-white rounded-[10px] shadow-[0_6px_25px_rgba(0,0,0,0.1)] p-6 md:p-8 flex flex-col animate-fade-in-up">
                    <form onSubmit={handleSubmit}>
                        
                        {/* Title Header matches OLD design */}
                        <h2 className="text-center text-2xl md:text-[28px] font-bold text-[#5c297c] mb-6">
                            Generate Reports Filter
                        </h2>

                        <div className="animate-fade-in">
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

                            {/* Section Header matches OLD design */}
                            <div className="mt-6 mb-3 border-t border-gray-200 pt-4">
                                <h3 className="text-[#5c297c] font-bold text-sm uppercase tracking-wider mb-3">
                                    Batch Year Range
                                </h3>
                            </div>

                            <div className="space-y-0">
                                <CustomSelectGroup
                                    label="Start Year"
                                    value={values.year_start}
                                    onChange={(e) => handleChange("year_start", e.target.value)}
                                    options={yearOptions}
                                    disabled={!values.program}
                                    placeholder={!values.program ? "Select Program first" : "Select Start Year"}
                                />
                                
                                <CustomSelectGroup
                                    label="End Year"
                                    value={values.year_end}
                                    onChange={(e) => handleChange("year_end", e.target.value)}
                                    options={yearEndOptions}
                                    disabled={!values.year_start}
                                    placeholder={!values.year_start ? "Select Start Year first" : "Select End Year"}
                                />
                            </div>
                        </div>

                        {/* Buttons match OLD design exactly */}
                        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3 w-full">
                            <button
                                type="button"
                                onClick={handleClear}
                                className="px-6 py-3 bg-white text-gray-600 border border-gray-300 font-medium rounded-md hover:bg-[#ffb736] hover:text-white hover:border-[#ffb736] transition-all duration-300 text-base shadow-sm"
                            >
                                Clear
                            </button>

                            <button
                                type="submit"
                                disabled={!isFormComplete}
                                className={`px-6 py-3 font-medium rounded-md transition-all duration-300 text-base
                                    ${isFormComplete 
                                        ? "bg-[#5c297c] text-white hover:bg-[#ffb736] cursor-pointer shadow-md" 
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    }`}
                            >
                                Generate Report
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}