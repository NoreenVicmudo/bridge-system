import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CustomSelectGroup from "@/Components/SelectGroup";
import { Link, router } from "@inertiajs/react";

// [BACKEND] This component expects a prop called 'serverOptions' containing all dropdown data.
export default function StudentInfoFilter({ serverOptions = null }) {
    // --- 1. USE SERVER DATA OR FALLBACK TO EMPTY ---
    // If backend hasn't connected yet, we use empty arrays to prevent crashes.
    // The backend dev can uncomment the 'mockData' at the bottom of this file
    // and pass it in to test the UI.
    const options = serverOptions || {
        academicYears: [],
        colleges: [],
        programs: {}, // { "COLLEGE_CODE": [{ label, value }] }
        years: {}, // { "PROGRAM_CODE": 4 }
        sections: {}, // { "PROGRAM-YEAR": [{ label, value }] }
        semesters: [],
        batches: [],
    };

    const [filterMode, setFilterMode] = useState("section");

    const initialValues = {
        academic_year: "",
        college: "",
        program: "",
        year_level: "",
        semester: "",
        section: "",
        batch_college: "",
        batch_program: "",
        batch_year: "",
        board_batch: "",
    };

    const [values, setValues] = useState(initialValues);

    // --- DYNAMIC OPTIONS STATE ---
    const [programOptions, setProgramOptions] = useState([]);
    const [yearOptions, setYearOptions] = useState([]);
    const [sectionOptions, setSectionOptions] = useState([]);

    // --- CASCADING LOGIC ---
    const handleChange = (field, value) => {
        const newValues = { ...values, [field]: value };

        // [BACKEND NOTE]: This logic assumes 'options.programs' is an object
        // mapped by College Code. If you prefer to fetch data via API
        // (e.g. axios.get('/api/programs?college=...')), replace this logic.

        if (filterMode === "section") {
            if (field === "college") {
                // Reset downstream
                newValues.program = "";
                newValues.year_level = "";
                newValues.section = "";

                // Load Programs for this College
                setProgramOptions(options.programs[value] || []);
                setYearOptions([]);
                setSectionOptions([]);
            } else if (field === "program") {
                newValues.year_level = "";
                newValues.section = "";

                // Generate Year Levels (1 to N)
                const maxYears = options.years[value] || 4;
                setYearOptions(
                    Array.from({ length: maxYears }, (_, i) => ({
                        value: (i + 1).toString(),
                        label: (i + 1).toString(),
                    })),
                );
                setSectionOptions([]);
            } else if (field === "year_level") {
                newValues.section = "";

                // Load Sections for Program + Year
                const key = `${newValues.program}-${value}`;
                setSectionOptions(options.sections[key] || []);
            }
        } else if (filterMode === "batch") {
            if (field === "batch_college") {
                newValues.batch_program = "";
                setProgramOptions(options.programs[value] || []);
            }
        }

        setValues(newValues);
    };

    const handleClear = () => {
        setValues(initialValues);
        setProgramOptions([]);
        setYearOptions([]);
        setSectionOptions([]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // [BACKEND] Connect this to your route
        // router.get(route('student.filter.submit'), values);
        console.log("Submitting Values:", values);
    };

    // Validation
    const isSectionComplete =
        values.academic_year &&
        values.college &&
        values.program &&
        values.year_level &&
        values.semester &&
        values.section;
    const isBatchComplete =
        values.batch_college &&
        values.batch_program &&
        values.batch_year &&
        values.board_batch;
    const isFormComplete =
        filterMode === "section" ? isSectionComplete : isBatchComplete;

    return (
        <AuthenticatedLayout>
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-[700px] bg-white rounded-[10px] shadow-[0_6px_25px_rgba(0,0,0,0.1)] p-6 md:p-8 flex flex-col animate-fade-in-up">
                    <form onSubmit={handleSubmit}>
                        <h2 className="text-center text-2xl md:text-[28px] font-bold text-[#5c297c] mb-6">
                            Student Information Filter
                        </h2>

                        <div className="flex justify-end mb-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setFilterMode(
                                        filterMode === "section"
                                            ? "batch"
                                            : "section",
                                    );
                                    handleClear();
                                }}
                                className="inline-flex items-center gap-2 bg-white text-[#5c297c] border border-[#5c297c] rounded-full px-4 py-1.5 font-semibold text-sm hover:bg-[#5c297c] hover:text-white transition-all duration-300 shadow-sm group"
                            >
                                <i className="bi bi-arrow-left-right transition-transform group-hover:rotate-180"></i>
                                <span>
                                    {filterMode === "section"
                                        ? "Switch to Batch Filter"
                                        : "Switch to Section Filter"}
                                </span>
                            </button>
                        </div>

                        {filterMode === "section" && (
                            <div className="animate-fade-in">
                                <CustomSelectGroup
                                    label="Academic Year"
                                    value={values.academic_year}
                                    onChange={(e) =>
                                        handleChange(
                                            "academic_year",
                                            e.target.value,
                                        )
                                    }
                                    options={options.academicYears}
                                />
                                <CustomSelectGroup
                                    label="College"
                                    value={values.college}
                                    onChange={(e) =>
                                        handleChange("college", e.target.value)
                                    }
                                    options={options.colleges}
                                />
                                <CustomSelectGroup
                                    label="Program"
                                    value={values.program}
                                    onChange={(e) =>
                                        handleChange("program", e.target.value)
                                    }
                                    options={programOptions}
                                    disabled={!values.college}
                                    placeholder={
                                        !values.college
                                            ? "Select College first"
                                            : "Select Program"
                                    }
                                />
                                <CustomSelectGroup
                                    label="Year Level"
                                    value={values.year_level}
                                    onChange={(e) =>
                                        handleChange(
                                            "year_level",
                                            e.target.value,
                                        )
                                    }
                                    options={yearOptions}
                                    disabled={!values.program}
                                    placeholder={
                                        !values.program
                                            ? "Select Program first"
                                            : "Select Year"
                                    }
                                />
                                <CustomSelectGroup
                                    label="Semester"
                                    value={values.semester}
                                    onChange={(e) =>
                                        handleChange("semester", e.target.value)
                                    }
                                    options={options.semesters}
                                    disabled={!values.year_level}
                                />
                                <CustomSelectGroup
                                    label="Section"
                                    value={values.section}
                                    onChange={(e) =>
                                        handleChange("section", e.target.value)
                                    }
                                    options={sectionOptions}
                                    disabled={!values.semester}
                                    placeholder={
                                        !values.semester
                                            ? "Select Semester first"
                                            : "Select Section"
                                    }
                                />
                            </div>
                        )}

                        {filterMode === "batch" && (
                            <div className="animate-fade-in">
                                <CustomSelectGroup
                                    label="College"
                                    value={values.batch_college}
                                    onChange={(e) =>
                                        handleChange(
                                            "batch_college",
                                            e.target.value,
                                        )
                                    }
                                    options={options.colleges}
                                />
                                <CustomSelectGroup
                                    label="Program"
                                    value={values.batch_program}
                                    onChange={(e) =>
                                        handleChange(
                                            "batch_program",
                                            e.target.value,
                                        )
                                    }
                                    options={programOptions}
                                    disabled={!values.batch_college}
                                    placeholder={
                                        !values.batch_college
                                            ? "Select College first"
                                            : "Select Program"
                                    }
                                />
                                <CustomSelectGroup
                                    label="Year"
                                    value={values.batch_year}
                                    onChange={(e) =>
                                        handleChange(
                                            "batch_year",
                                            e.target.value,
                                        )
                                    }
                                    options={options.batches}
                                />
                                <CustomSelectGroup
                                    label="Board Exam Batch"
                                    value={values.board_batch}
                                    onChange={(e) =>
                                        handleChange(
                                            "board_batch",
                                            e.target.value,
                                        )
                                    }
                                    options={[
                                        { value: "1", label: "Batch 1" },
                                        { value: "2", label: "Batch 2" },
                                    ]}
                                />
                            </div>
                        )}

                        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3 w-full">
                            <Link
                                href="student-masterlist"
                                className="inline-flex justify-center items-center px-6 py-3 bg-[#5c297c] text-white font-medium rounded-md hover:bg-[#ffb736] hover:text-white transition-all duration-300 text-center text-base"
                            >
                                View Masterlist
                            </Link>
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
                                    Filter Students
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
   If you pass this structure from the Controller, the frontend logic will work automatically.
   
   const mockData = {
        academicYears: [
            { value: "2023-2024", label: "2023-2024" },
            { value: "2024-2025", label: "2024-2025" }
        ],
        semesters: [
            { value: "1ST", label: "1st Semester" },
            { value: "2ND", label: "2nd Semester" }
        ],
        batches: [
             { value: "2026", label: "2026" },
             { value: "2027", label: "2027" }
        ],
        colleges: [
            { value: "CAST", label: "College of Arts and Sciences" },
            { value: "CON", label: "College of Nursing" }
        ],
        // Programs are mapped by College Value
        programs: {
            "CAST": [
                { value: "BSIT", label: "BS Information Technology" },
                { value: "BSCS", label: "BS Computer Science" }
            ],
            "CON": [
                { value: "BSN", label: "BS Nursing" }
            ]
        },
        // Program duration (max years) mapped by Program Value
        years: {
            "BSIT": 4, 
            "BSCS": 4,
            "BSN": 4
        },
        // Sections mapped by "PROGRAM-YEAR" key
        sections: {
            "BSIT-1": [{ value: "1A", label: "1A" }, { value: "1B", label: "1B" }],
            "BSIT-4": [{ value: "4A", label: "4A" }],
            "BSN-4": [{ value: "4A", label: "4A (Nursing)" }]
        }
   };
   ==========================================================================
*/
