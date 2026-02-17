import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CustomSelectGroup from "@/Components/SelectGroup";
import { Link, router } from "@inertiajs/react";

export default function StudentInfoFilter({ serverOptions = null }) {
    const options = serverOptions || {
        academicYears: [],
        colleges: [],
        programs: {}, 
        years: {}, 
        sections: {}, 
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
    const [programOptions, setProgramOptions] = useState([]);
    const [yearOptions, setYearOptions] = useState([]);
    const [sectionOptions, setSectionOptions] = useState([]);

    const handleChange = (field, value) => {
        const newValues = { ...values, [field]: value };

        if (filterMode === "section") {
            if (field === "college") {
                newValues.program = "";
                newValues.year_level = "";
                newValues.section = "";
                setProgramOptions(options.programs[value] || []);
                setYearOptions([]);
                setSectionOptions([]);
            } else if (field === "program") {
                newValues.year_level = "";
                newValues.section = "";
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
        console.log("Submitting Values:", values);
    };

    // Validation logic
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
                                    setFilterMode(filterMode === "section" ? "batch" : "section");
                                    handleClear();
                                }}
                                className="inline-flex items-center gap-2 bg-white text-[#5c297c] border border-[#5c297c] rounded-full px-4 py-1.5 font-semibold text-sm hover:bg-[#5c297c] hover:text-white transition-all duration-300 shadow-sm group"
                            >
                                <i className="bi bi-arrow-left-right transition-transform group-hover:rotate-180"></i>
                                <span>
                                    {filterMode === "section" ? "Switch to Batch Filter" : "Switch to Section Filter"}
                                </span>
                            </button>
                        </div>

                        {filterMode === "section" ? (
                            <div className="animate-fade-in">
                                <CustomSelectGroup
                                    label="Academic Year"
                                    value={values.academic_year}
                                    onChange={(e) => handleChange("academic_year", e.target.value)}
                                    options={options.academicYears}
                                />
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
                                    label="Year Level"
                                    value={values.year_level}
                                    onChange={(e) => handleChange("year_level", e.target.value)}
                                    options={yearOptions}
                                    disabled={!values.program}
                                    placeholder={!values.program ? "Select Program first" : "Select Year"}
                                />
                                <CustomSelectGroup
                                    label="Semester"
                                    value={values.semester}
                                    onChange={(e) => handleChange("semester", e.target.value)}
                                    options={options.semesters}
                                    disabled={!values.year_level}
                                />
                                <CustomSelectGroup
                                    label="Section"
                                    value={values.section}
                                    onChange={(e) => handleChange("section", e.target.value)}
                                    options={sectionOptions}
                                    disabled={!values.semester}
                                    placeholder={!values.semester ? "Select Semester first" : "Select Section"}
                                />
                            </div>
                        ) : (
                            <div className="animate-fade-in">
                                <CustomSelectGroup
                                    label="College"
                                    value={values.batch_college}
                                    onChange={(e) => handleChange("batch_college", e.target.value)}
                                    options={options.colleges}
                                />
                                <CustomSelectGroup
                                    label="Program"
                                    value={values.batch_program}
                                    onChange={(e) => handleChange("batch_program", e.target.value)}
                                    options={programOptions}
                                    disabled={!values.batch_college}
                                    placeholder={!values.batch_college ? "Select College first" : "Select Program"}
                                />
                                <CustomSelectGroup
                                    label="Year"
                                    value={values.batch_year}
                                    onChange={(e) => handleChange("batch_year", e.target.value)}
                                    options={options.batches}
                                />
                                <CustomSelectGroup
                                    label="Board Exam Batch"
                                    value={values.board_batch}
                                    onChange={(e) => handleChange("board_batch", e.target.value)}
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
                            
                            {/* THE MODIFIED BUTTON: Now always renders but uses 'disabled' prop */}
                            <button
                                type="submit"
                                disabled={!isFormComplete}
                                className={`px-6 py-3 font-medium rounded-md transition-all duration-300 text-base
                                    ${isFormComplete 
                                        ? "bg-[#5c297c] text-white hover:bg-[#ffb736] cursor-pointer" 
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    }`}
                            >
                                Filter Students
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}