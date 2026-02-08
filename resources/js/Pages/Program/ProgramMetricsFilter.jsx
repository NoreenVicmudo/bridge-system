import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CustomSelectGroup from "@/Components/SelectGroup";
// [BACKEND] router is needed for manual GET requests
// import { router } from "@inertiajs/react"; 

// [BACKEND] Expects 'serverOptions' prop with dropdown data
export default function ProgramMetricsFilter({ serverOptions = null }) {
    
    // --- 1. USE SERVER DATA OR FALLBACK TO EMPTY ---
    const options = serverOptions || {
        colleges: [],
        programs: {},    // { "COLLEGE_CODE": [{ label, value }] }
        years: {},       // { "PROGRAM_CODE": 4 } (Max years) or just an array if static
        boardBatches: []
    };

    // --- 2. INITIAL STATE ---
    const initialValues = {
        college: "",
        program: "",
        year: "",
        board_batch: ""
    };

    const [values, setValues] = useState(initialValues);

    // --- DYNAMIC OPTIONS STATE ---
    const [programOptions, setProgramOptions] = useState([]);
    const [yearOptions, setYearOptions] = useState([]);

    // --- CASCADING LOGIC ---
    const handleChange = (field, value) => {
        const newValues = { ...values, [field]: value };

        // [BACKEND NOTE]: This logic assumes 'options.programs' is an object 
        // mapped by College Code.
        if (field === "college") {
            // Reset downstream fields
            newValues.program = "";
            newValues.year = "";
            newValues.board_batch = "";
            
            // Load Programs for this College
            setProgramOptions(options.programs[value] || []);
            setYearOptions([]);
        } 
        else if (field === "program") {
            // Reset downstream fields
            newValues.year = "";
            newValues.board_batch = "";

            // Generate Year Levels (1 to N) based on program duration
            // [BACKEND] If you pass 'years' as a static array instead of a map, adjust this.
            const maxYears = options.years[value] || 4;
            setYearOptions(Array.from({ length: maxYears }, (_, i) => ({ 
                value: (i + 1).toString(), 
                label: (i + 1).toString() 
            })));
        }
        else if (field === "year") {
            // Reset downstream fields
            newValues.board_batch = "";
        }

        setValues(newValues);
    };

    const handleClear = () => {
        setValues(initialValues);
        setProgramOptions([]);
        setYearOptions([]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // [BACKEND] Connect this to your route
        // router.get(route('program.metrics.submit'), values);
        console.log("Submitting Values:", values);
    };

    // Validation: Check if all fields are filled
    const isFormComplete = values.college && values.program && values.year && values.board_batch;

    return (
        <AuthenticatedLayout>
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-[700px] bg-white rounded-[10px] shadow-[0_6px_25px_rgba(0,0,0,0.1)] p-6 md:p-8 flex flex-col animate-fade-in-up">
                    <form onSubmit={handleSubmit}>
                        
                        {/* Header */}
                        <h2 className="text-center text-2xl md:text-[28px] font-bold text-[#5c297c] mb-6">
                            Program Metrics Filter
                        </h2>

                        {/* ================= FILTER FORM ================= */}
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

                            <CustomSelectGroup
                                label="Year"
                                value={values.year}
                                onChange={(e) => handleChange("year", e.target.value)}
                                options={yearOptions}
                                disabled={!values.program}
                                placeholder={!values.program ? "Select Program first" : "Select Year"}
                            />

                            <CustomSelectGroup
                                label="Board Exam Batch"
                                value={values.board_batch}
                                onChange={(e) => handleChange("board_batch", e.target.value)}
                                options={options.boardBatches}
                                disabled={!values.year}
                                placeholder={!values.year ? "Select Year first" : "Select Batch"}
                            />

                        </div>

                        {/* ================= BUTTONS ================= */}
                        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3 w-full">
                            
                            <button
                                type="button"
                                onClick={handleClear}
                                className="px-6 py-3 bg-white text-gray-600 border border-gray-300 font-medium rounded-md hover:bg-[#ffb736] hover:text-white hover:border-[#ffb736] transition-all duration-300 text-base"
                            >
                                Clear
                            </button>

                            {/* FILTER BUTTON - Only shows when form is complete */}
                            {isFormComplete && (
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-[#5c297c] text-white font-medium rounded-md hover:bg-[#ffb736] transition-all duration-300 text-base animate-fade-in"
                                >
                                    Filter Metrics
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
   
   The component expects a prop `serverOptions` with this structure.
   
   const mockData = {
        colleges: [
            { value: "CAST", label: "College of Arts and Sciences" },
            { value: "CON", label: "College of Nursing" }
        ],
        // Programs mapped by College Code
        programs: {
            "CAST": [
                { value: "BSIT", label: "BS Information Technology" },
                { value: "BSCS", label: "BS Computer Science" }
            ],
            "CON": [
                { value: "BSN", label: "BS Nursing" }
            ]
        },
        // Program Duration / Max Years mapped by Program Code
        years: {
            "BSIT": 4, 
            "BSCS": 4,
            "BSN": 4
        },
        // Board Exam Batches
        boardBatches: [
            { value: "1", label: "Batch 1" },
            { value: "2", label: "Batch 2" }
        ]
   };
   ==========================================================================
*/