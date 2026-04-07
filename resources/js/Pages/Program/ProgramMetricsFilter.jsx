import { useState, useEffect, useMemo } from "react";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CustomSelectGroup from "@/Components/SelectGroup";
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";

export default function ProgramMetricsFilter({ dbColleges = [] }) {
    const { auth } = usePage().props;
    const user = auth.user;

    // --- 1. STATE & SECURITY ---
    const isCollegeRestricted = !!user?.college_id;
    const isProgramRestricted = !!user?.program_id;

    const [values, setValues] = useState({
        college: "",
        program: "",
        calendar_year: "", // Literal year: 2025
        batch_number: "",  // Batch: 1 or 2
    });

    // 2. Initialize options with the props so they are not empty on start
    const [options, setOptions] = useState({
        colleges: dbColleges,
        programs: {},
        programYears: {}, // Program duration (e.g. 4)
        calendarYears: [], // Database years
        batchNumbers: [],  // Database batches
    });
    const [loading, setLoading] = useState(true);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);

    // --- 2. FETCH OPTIONS & APPLY RESTRICTIONS ---
    useEffect(() => {
        if (isCollegeRestricted || isProgramRestricted) {
            setValues(prev => ({
                ...prev,
                college: isCollegeRestricted ? user.college_id.toString() : prev.college,
                program: isProgramRestricted ? user.program_id.toString() : prev.program,
            }));
        }

        // Updated route name to match the new Controller location
        axios.get(route('program.filter-options')) 
            .then(res => {
                setOptions(res.data);
                
                setValues(prev => ({
                    ...prev,
                    college: isCollegeRestricted ? user.college_id.toString() : "",
                    program: isProgramRestricted ? user.program_id.toString() : "",
                }));
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    // --- 3. DYNAMIC DROPDOWNS ---
    const programOptions = useMemo(() => {
        if (!values.college) return [];
        return options.programs[values.college] || [];
    }, [values.college, options.programs]);

    const yearOptions = useMemo(() => {
        if (!values.program) return [];
        const maxYears = options.years[values.program] || 4;
        return Array.from({ length: maxYears }, (_, i) => ({
            value: (i + 1).toString(),
            label: `Year ${i + 1}`,
        }));
    }, [values.program, options.years]);

    // --- 4. HANDLERS ---
    const handleChange = (field, value) => {
        let newValues = { ...values, [field]: value };

        if (field === "college") {
            newValues.program = isProgramRestricted ? user.program_id.toString() : "";
            newValues.year = "";
            newValues.board_batch = "";
        } else if (field === "program") {
            newValues.year = "";
            newValues.board_batch = "";
        } else if (field === "calendar_year") {
            newValues.batch_number = "";
        }

        setValues(newValues);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Inject names for the InfoCards on the next pages
        const collegeName = options.colleges.find(c => c.value.toString() === values.college)?.label;
        const programName = programOptions.find(p => p.value.toString() === values.program)?.label;
        
        const filterWithNames = { 
            ...values, 
            college_name: collegeName, 
            program_name: programName 
        };

        localStorage.setItem("programFilterData", JSON.stringify(filterWithNames));
        setIsMetricModalOpen(true);
    };

    const isFormComplete = values.college && values.program && values.year && values.board_batch;

    if (loading) return (
        <AuthenticatedLayout>
            <div className="flex justify-center items-center h-screen text-[#5c297c] font-bold">
                Loading Program Options...
            </div>
        </AuthenticatedLayout>
    );

    return (
        <AuthenticatedLayout>
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-[700px] bg-white rounded-[10px] shadow-[0_6px_25px_rgba(0,0,0,0.1)] p-6 md:p-8 animate-fade-in-up">
                    <form onSubmit={handleSubmit}>
                        <h2 className="text-center text-2xl md:text-[28px] font-bold text-[#5c297c] mb-6">
                            Program Metrics Filter
                        </h2>

                        <div className="space-y-4">
                            <CustomSelectGroup
                                label="College"
                                value={values.college}
                                onChange={(e) => handleChange("college", e.target.value)}
                                options={options.colleges}
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
                                options={options.calendarYears}
                                disabled={!values.program}
                                placeholder="Select Year"
                            />

                            <CustomSelectGroup
                                label="Board Exam Batch"
                                value={values.batch_number}
                                onChange={(e) => handleChange("batch_number", e.target.value)}
                                options={options.batchNumbers}
                                disabled={!values.calendar_year}
                                placeholder="Select Batch"
                            />
                        </div>

                        <div className="mt-8 flex justify-center gap-3 w-full">
                            <button
                                type="button"
                                onClick={() => setValues({
                                    college: isCollegeRestricted ? user.college_id.toString() : "",
                                    program: isProgramRestricted ? user.program_id.toString() : "",
                                    year: "",
                                    board_batch: ""
                                })}
                                className="px-10 py-3 bg-white text-gray-600 border border-gray-300 font-bold rounded-md hover:bg-[#ffb736] hover:text-white hover:border-[#ffb736] transition-all shadow-sm"
                            >
                                Clear
                            </button>

                            <button
                                type="submit"
                                disabled={!isFormComplete}
                                className={`px-10 py-3 font-bold rounded-md transition-all shadow-md
                                    ${isFormComplete 
                                        ? "bg-[#5c297c] text-white hover:bg-[#ffb736]" 
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
                            >
                                View Metrics
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <ChangeMetricModal
                isOpen={isMetricModalOpen}
                onClose={() => setIsMetricModalOpen(false)}
                currentMetric=""
                type="program"
                filterData={values}
            />
        </AuthenticatedLayout>
    );
}