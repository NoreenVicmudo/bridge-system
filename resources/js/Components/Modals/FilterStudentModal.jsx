import React, { useState, useEffect } from "react";
import CustomSelectGroup from "@/Components/SelectGroup";

export default function FilterStudentModal({
    isOpen,
    onClose,
    currentFilters,
    onApply,
    allowBatch = true,
    allowSection = true, 
    defaultMode = "section", 
}) {
    const [mode, setMode] = useState(defaultMode);
    const [animate, setAnimate] = useState(false);

    const OPTIONS = {
        academic_years: [
            { value: "2025-2026", label: "2025-2026" },
            { value: "2024-2025", label: "2024-2025" },
        ],
        semesters: [
            { value: "1st Semester", label: "1st Semester" },
            { value: "2nd Semester", label: "2nd Semester" },
        ],
        colleges: [
            { value: "CAS", label: "College of Arts and Sciences" },
            { value: "CN", label: "College of Nursing" },
        ],
        programs: {
            CAS: [
                { value: "BS PSYCHOLOGY", label: "BS Psychology" },
                { value: "BS BIOLOGY", label: "BS Biology" },
            ],
            CN: [{ value: "BS NURSING", label: "BS Nursing" }],
        },
        year_levels: [
            { value: "1ST YEAR", label: "1st Year" },
            { value: "2ND YEAR", label: "2nd Year" },
        ],
        sections: {
            "1ST YEAR": [{ value: "1-1", label: "1-1" }],
            "2ND YEAR": [{ value: "2-1", label: "2-1" }],
        },
        years: [
            { value: "2025", label: "2025" },
            { value: "2026", label: "2026" },
        ],
        board_batches: [
            { value: "1", label: "Batch 1" },
            { value: "2", label: "Batch 2" },
        ],
    };

    const [values, setValues] = useState({
        academic_year: "",
        semester: "",
        college: "",
        program: "",
        year_level: "",
        section: "",
        batch_college: "",
        batch_program: "",
        batch_year: "",
        board_batch: "",
    });

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
            if (!allowSection) setMode("batch");
            else if (!allowBatch) setMode("section");
            else setMode(defaultMode);

            if (currentFilters)
                setValues((prev) => ({ ...prev, ...currentFilters }));
        } else {
            setAnimate(false);
        }
    }, [isOpen, currentFilters, allowSection, allowBatch, defaultMode]);

    const closeModal = () => {
        setAnimate(false);
        setTimeout(onClose, 300);
    };

    const handleChange = (field, value) => {
        let nextValues = { ...values, [field]: value };
        if (mode === "section") {
            if (field === "college") {
                nextValues.program = "";
                nextValues.year_level = "";
                nextValues.section = "";
            }
            if (field === "program") {
                nextValues.year_level = "";
                nextValues.section = "";
            }
            if (field === "year_level") {
                nextValues.section = "";
            }
        } else {
            if (field === "batch_college") nextValues.batch_program = "";
        }
        setValues(nextValues);
    };

    const getPrograms = (collegeValue) => OPTIONS.programs[collegeValue] || [];
    const getSections = (yearValue) => OPTIONS.sections[yearValue] || [];

    // Form validation logic
    const isFormValid = () => {
        if (mode === "section") {
            return (
                values.academic_year &&
                values.semester &&
                values.college &&
                values.program &&
                values.year_level &&
                values.section
            );
        } else {
            return (
                values.batch_college &&
                values.batch_program &&
                values.batch_year &&
                values.board_batch
            );
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-[1000] flex items-center justify-center transition-all duration-300 ${animate ? "bg-gray-900/60 backdrop-blur-sm" : "bg-transparent backdrop-blur-none pointer-events-none"}`}
        >
            <div
                className={`bg-white rounded-2xl w-[90%] max-w-[500px] shadow-2xl relative flex flex-col transition-all duration-300 transform overflow-visible ${animate ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
            >
                {/* Header */}
                <div className="bg-[#5c297c] p-6 text-center relative rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-white tracking-wide">
                        Filter Students
                    </h2>

                    {allowBatch && allowSection && (
                        <button
                            onClick={() =>
                                setMode(mode === "section" ? "batch" : "section")
                            }
                            className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white border border-white/30 text-sm hover:bg-white/20 transition-all font-medium"
                        >
                            <i className="bi bi-arrow-repeat"></i>
                            <span>
                                Switch to{" "}
                                {mode === "section" ? "Batch" : "Section"}{" "}
                                Filter
                            </span>
                        </button>
                    )}

                    <button
                        onClick={closeModal}
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                    >
                        <i className="bi bi-x-lg text-xl"></i>
                    </button>
                </div>

                {/* Form Body */}
                <div className="p-6 flex flex-col gap-1">
                    {mode === "section" && allowSection && (
                        <div className="flex flex-col animate-fade-in relative z-20">
                            <CustomSelectGroup
                                label="A.Y."
                                value={values.academic_year}
                                onChange={(e) => handleChange("academic_year", e.target.value)}
                                options={OPTIONS.academic_years}
                                placeholder="Select A.Y."
                            />
                            <CustomSelectGroup
                                label="Semester"
                                value={values.semester}
                                onChange={(e) => handleChange("semester", e.target.value)}
                                options={OPTIONS.semesters}
                                placeholder="Select Semester"
                            />
                            <CustomSelectGroup
                                label="College"
                                value={values.college}
                                onChange={(e) => handleChange("college", e.target.value)}
                                options={OPTIONS.colleges}
                                placeholder="Select College"
                            />
                            <CustomSelectGroup
                                label="Program"
                                value={values.program}
                                onChange={(e) => handleChange("program", e.target.value)}
                                options={getPrograms(values.college)}
                                disabled={!values.college}
                                placeholder={!values.college ? "Select College First" : "Select Program"}
                            />
                            <CustomSelectGroup
                                label="Year Level"
                                value={values.year_level}
                                onChange={(e) => handleChange("year_level", e.target.value)}
                                options={OPTIONS.year_levels}
                                disabled={!values.program}
                                placeholder={!values.program ? "Select Program First" : "Select Level"}
                            />
                            <CustomSelectGroup
                                label="Section"
                                value={values.section}
                                onChange={(e) => handleChange("section", e.target.value)}
                                options={getSections(values.year_level)}
                                disabled={!values.year_level}
                                placeholder={!values.year_level ? "Select Year First" : "Select Section"}
                            />
                        </div>
                    )}

                    {mode === "batch" && allowBatch && (
                        <div className="flex flex-col animate-fade-in relative z-20">
                            <CustomSelectGroup
                                label="College"
                                value={values.batch_college}
                                onChange={(e) => handleChange("batch_college", e.target.value)}
                                options={OPTIONS.colleges}
                                placeholder="Select College"
                            />
                            <CustomSelectGroup
                                label="Program"
                                value={values.batch_program}
                                onChange={(e) => handleChange("batch_program", e.target.value)}
                                options={getPrograms(values.batch_college)}
                                disabled={!values.batch_college}
                                placeholder={!values.batch_college ? "Select College First" : "Select Program"}
                            />
                            <CustomSelectGroup
                                label="Year"
                                value={values.batch_year}
                                onChange={(e) => handleChange("batch_year", e.target.value)}
                                options={OPTIONS.years}
                                placeholder="Select Year"
                            />
                            <CustomSelectGroup
                                label="Board Batch"
                                value={values.board_batch}
                                onChange={(e) => handleChange("board_batch", e.target.value)}
                                options={OPTIONS.board_batches}
                                placeholder="Select Batch"
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl relative z-10">
                    <button
                        onClick={closeModal}
                        className="px-5 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-all"
                    >
                        Cancel
                    </button>
                    
                    {/* APPLY BUTTON: Now always visible but dynamically disabled */}
                    <button
                        onClick={() => {
                            if (isFormValid()) {
                                onApply(values, mode);
                                closeModal();
                            }
                        }}
                        disabled={!isFormValid()}
                        className={`px-5 py-2 text-sm font-bold text-white rounded-lg shadow-md transition-all duration-300 
                            ${isFormValid() 
                                ? "bg-[#5c297c] hover:bg-[#4a1f63] cursor-pointer opacity-100" 
                                : "bg-gray-400 cursor-not-allowed opacity-60"
                            }`}
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
}