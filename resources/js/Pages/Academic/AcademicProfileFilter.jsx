import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CustomSelectGroup from "@/Components/SelectGroup";
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";

export default function AcademicProfileFilter({ serverOptions = null }) {
    // --- 1. USE SERVER DATA OR FALLBACK TO EMPTY ---
    const options = serverOptions || {
        academicYears: [],
        colleges: [],
        programs: {},
        years: {},
        sections: {},
        semesters: [],
    };

    // --- 2. INITIAL STATE ---
    const initialValues = {
        academic_year: "",
        college: "",
        program: "",
        year_level: "",
        semester: "",
        section: "",
    };

    const [values, setValues] = useState(initialValues);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);

    // --- DYNAMIC OPTIONS STATE ---
    const [programOptions, setProgramOptions] = useState([]);
    const [yearOptions, setYearOptions] = useState([]);
    const [sectionOptions, setSectionOptions] = useState([]);

    // --- CASCADING LOGIC ---
    const handleChange = (field, value) => {
        const newValues = { ...values, [field]: value };

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
        localStorage.setItem("studentFilterData", JSON.stringify(values));
        setIsMetricModalOpen(true);
    };

    // Validation Logic
    const isFormComplete =
        values.academic_year &&
        values.college &&
        values.program &&
        values.year_level &&
        values.semester &&
        values.section;

    return (
        <AuthenticatedLayout>
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-[700px] bg-white rounded-[10px] shadow-[0_6px_25px_rgba(0,0,0,0.1)] p-6 md:p-8 flex flex-col animate-fade-in-up">
                    <form onSubmit={handleSubmit}>
                        <h2 className="text-center text-2xl md:text-[28px] font-bold text-[#5c297c] mb-6">
                            Academic Profile Filter
                        </h2>

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

            <ChangeMetricModal
                isOpen={isMetricModalOpen}
                onClose={() => setIsMetricModalOpen(false)}
                currentMetric=""
            />
        </AuthenticatedLayout>
    );
}