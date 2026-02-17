import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CustomSelectGroup from "@/Components/SelectGroup";
import { Link } from "@inertiajs/react";

export default function ProgramMetricsFilter({ serverOptions = null }) {
    // --- 1. USE SERVER DATA OR FALLBACK TO EMPTY ---
    const options = serverOptions || {
        colleges: [],
        programs: {},
        years: {},
        boardBatches: [],
    };

    // --- 2. INITIAL STATE ---
    const initialValues = {
        college: "",
        program: "",
        year: "",
        board_batch: "",
    };

    const [values, setValues] = useState(initialValues);
    const [programOptions, setProgramOptions] = useState([]);
    const [yearOptions, setYearOptions] = useState([]);

    // --- CASCADING LOGIC ---
    const handleChange = (field, value) => {
        const newValues = { ...values, [field]: value };

        if (field === "college") {
            newValues.program = "";
            newValues.year = "";
            newValues.board_batch = "";

            setProgramOptions(options.programs[value] || []);
            setYearOptions([]);
        } else if (field === "program") {
            newValues.year = "";
            newValues.board_batch = "";

            const maxYears = options.years[value] || 4;
            setYearOptions(
                Array.from({ length: maxYears }, (_, i) => ({
                    value: (i + 1).toString(),
                    label: (i + 1).toString(),
                })),
            );
        } else if (field === "year") {
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
        console.log("Submitting Values:", values);
    };

    // Validation: Check if all fields are filled
    const isFormComplete =
        values.college && values.program && values.year && values.board_batch;

    return (
        <AuthenticatedLayout>
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-[700px] bg-white rounded-[10px] shadow-[0_6px_25px_rgba(0,0,0,0.1)] p-6 md:p-8 flex flex-col animate-fade-in-up">
                    <form onSubmit={handleSubmit}>
                        <h2 className="text-center text-2xl md:text-[28px] font-bold text-[#5c297c] mb-6">
                            Program Metrics Filter
                        </h2>

                        <div className="animate-fade-in">
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
                                label="Year"
                                value={values.year}
                                onChange={(e) =>
                                    handleChange("year", e.target.value)
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
                                label="Board Exam Batch"
                                value={values.board_batch}
                                onChange={(e) =>
                                    handleChange("board_batch", e.target.value)
                                }
                                options={options.boardBatches}
                                disabled={!values.year}
                                placeholder={
                                    !values.year
                                        ? "Select Year first"
                                        : "Select Batch"
                                }
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

                            {/* ALWAYS VISIBLE BUTTON: Disabled if form is incomplete */}
                            <button
                                type="submit"
                                disabled={!isFormComplete}
                                className={`px-6 py-3 font-medium rounded-md transition-all duration-300 text-base
                                    ${
                                        isFormComplete
                                            ? "bg-[#5c297c] text-white hover:bg-[#ffb736] cursor-pointer"
                                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    }`}
                            >
                                Filter Metrics
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
