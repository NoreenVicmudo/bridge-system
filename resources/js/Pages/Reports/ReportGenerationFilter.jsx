import { useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CustomSelectGroup from "@/Components/SelectGroup";

// [BACKEND] Expects 'serverOptions' prop with dropdown data
export default function ReportsFilter({ serverOptions = null }) {
    
    // --- 1. USE SERVER DATA OR FALLBACK TO EMPTY ---
    const options = serverOptions || {
        colleges: [],
        programs: {},    // { "COLLEGE_CODE": [{ label, value }] }
        batchYears: [],  // [{value: "2020", label: "2020"}, ...]
        statYears: []    
    };

    const [filterMode, setFilterMode] = useState("batch_reports"); 

    const initialValues = {
        college: "",
        program: "",
        start_year: "",
        end_year: "",
        stat_year: ""
    };

    const [values, setValues] = useState(initialValues);
    const [programOptions, setProgramOptions] = useState([]);

    // --- 2. FRONTEND LOGIC: Filter End Years ---
    // This creates a new list for "End Year" that only contains years >= Start Year
    const filteredEndYears = useMemo(() => {
        if (!values.start_year) return options.batchYears;
        
        return options.batchYears.filter(year => 
            parseInt(year.value) >= parseInt(values.start_year)
        );
    }, [values.start_year, options.batchYears]);

    // --- CASCADING LOGIC ---
    const handleChange = (field, value) => {
        const newValues = { ...values, [field]: value };

        if (filterMode === "batch_reports") {
            if (field === "college") {
                newValues.program = "";
                newValues.start_year = "";
                newValues.end_year = "";
                setProgramOptions(options.programs[value] || []);
            } 
            else if (field === "program") {
                newValues.start_year = "";
                newValues.end_year = "";
            }
            else if (field === "start_year") {
                // If the new start year is greater than the current end year, clear the end year
                if (newValues.end_year && parseInt(value) > parseInt(newValues.end_year)) {
                    newValues.end_year = "";
                }
            }
        }

        setValues(newValues);
    };

    const handleClear = () => {
        setValues(initialValues);
        setProgramOptions([]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(`Submitting [${filterMode}]:`, values);
    };

    // Validation
    const isBatchReportsComplete = values.college && values.program && values.start_year && values.end_year;
    const isProgramStatsComplete = values.stat_year;
    const isFormComplete = filterMode === "batch_reports" ? isBatchReportsComplete : isProgramStatsComplete;

    return (
        <AuthenticatedLayout>
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-[700px] bg-white rounded-[10px] shadow-[0_6px_25px_rgba(0,0,0,0.1)] p-6 md:p-8 flex flex-col animate-fade-in-up">
                    <form onSubmit={handleSubmit}>
                        
                        <h2 className="text-center text-2xl md:text-[28px] font-bold text-[#5c297c] mb-6">
                            Generate Reports Filter
                        </h2>

                        <div className="flex justify-end mb-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setFilterMode(filterMode === "batch_reports" ? "program_stats" : "batch_reports");
                                    handleClear();
                                }}
                                className="inline-flex items-center gap-2 bg-white text-[#5c297c] border border-[#5c297c] rounded-full px-4 py-1.5 font-semibold text-sm hover:bg-[#5c297c] hover:text-white transition-all duration-300 shadow-sm group"
                            >
                                <i className="bi bi-arrow-left-right transition-transform group-hover:rotate-180"></i>
                                <span>{filterMode === "batch_reports" ? "Switch to Program Statistics" : "Switch to Batch Reports"}</span>
                            </button>
                        </div>

                        {filterMode === "batch_reports" && (
                            <div className="animate-fade-in">
                                <CustomSelectGroup
                                    label="College"
                                    value={values.college}
                                    onChange={(e) => handleChange("college", e.target.value)}
                                    options={options.colleges}
                                />

                                <CustomSelectGroup
                                    label="Program"
                                    value={values.program}
                                    onChange={(e) => handleChange("program", e.target.value)}
                                    options={programOptions}
                                    disabled={!values.college}
                                    placeholder={!values.college ? "Select College first" : "Select Program"}
                                />

                                <div className="mt-6 mb-3 border-t border-gray-200 pt-4">
                                    <h3 className="text-[#5c297c] font-bold text-sm uppercase tracking-wider mb-3">
                                        Batch Year Range
                                    </h3>
                                </div>

                                <div className="space-y-0">
                                    <CustomSelectGroup
                                        label="Start Year"
                                        value={values.start_year}
                                        onChange={(e) => handleChange("start_year", e.target.value)}
                                        options={options.batchYears}
                                        disabled={!values.program}
                                        placeholder={!values.program ? "Select Program first" : "Select Start Year"}
                                    />
                                    
                                    <CustomSelectGroup
                                        label="End Year"
                                        value={values.end_year}
                                        onChange={(e) => handleChange("end_year", e.target.value)}
                                        options={filteredEndYears} // <--- USING FILTERED LIST HERE
                                        disabled={!values.start_year}
                                        placeholder={!values.start_year ? "Select Start Year first" : "Select End Year"}
                                    />
                                </div>
                            </div>
                        )}

                        {filterMode === "program_stats" && (
                            <div className="animate-fade-in">
                                <CustomSelectGroup
                                    label="Year"
                                    value={values.stat_year}
                                    onChange={(e) => handleChange("stat_year", e.target.value)}
                                    options={options.statYears}
                                />
                            </div>
                        )}

                        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3 w-full">
                            <button
                                type="button"
                                onClick={handleClear}
                                className="px-6 py-3 bg-white text-gray-600 border border-gray-300 font-medium rounded-md hover:bg-[#ffb736] hover:text-white hover:border-[#ffb736] transition-all duration-300 text-base"
                            >
                                Clear
                            </button>

                            {isFormComplete && (
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-[#5c297c] text-white font-medium rounded-md hover:bg-[#ffb736] transition-all duration-300 text-base animate-fade-in"
                                >
                                    Generate Report
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

/* ==========================================================================
   [BACKEND DEVELOPER REFERENCE]
   
   const mockData = {
        colleges: [
            { value: "CAST", label: "College of Arts and Sciences" },
            { value: "CON", label: "College of Nursing" }
        ],
        programs: {
            "CAST": [
                { value: "BSIT", label: "BS Information Technology" },
                { value: "BSCS", label: "BS Computer Science" }
            ],
            "CON": [
                { value: "BSN", label: "BS Nursing" }
            ]
        },
        batchYears: [
             { value: "2020", label: "2020" },
             { value: "2021", label: "2021" },
             { value: "2022", label: "2022" },
             { value: "2023", label: "2023" },
             { value: "2024", label: "2024" }
        ],
        statYears: [
             { value: "2023", label: "2023" },
             { value: "2024", label: "2024" }
        ]
   };
*/