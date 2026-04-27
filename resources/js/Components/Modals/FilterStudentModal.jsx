import React, { useState, useEffect, useMemo } from "react";
import CustomSelectGroup from "@/Components/SelectGroup";

export default function FilterStudentModal({
    isOpen,
    onClose,
    currentFilters,
    onApply,
    allowBatch = true,
    allowSection = true,
    defaultMode = "section",
    user = null,
    dbColleges = [],
    dbPrograms = []
}) {
    const [mode, setMode] = useState(defaultMode);
    const [animate, setAnimate] = useState(false);
    const [modalKey, setModalKey] = useState(0);
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

    const collegeOptions = dbColleges.map((college) => ({
        value: college.college_id.toString(),
        label: college.name,
    }));

    const mockSemesters = [
        { value: "1st", label: "1st Semester" },
        { value: "2nd", label: "2nd Semester" }
    ];

    const currentYear = new Date().getFullYear();
    const dynamicAcademicYears = Array.from({ length: currentYear - 2000 + 1 }, (_, i) => {
        const startYear = currentYear - i;
        const endYear = startYear + 1;
        return { value: `${startYear}-${endYear}`, label: `${startYear}-${endYear}` };
    });

    const dynamicBatches = Array.from({ length: currentYear - 2000 + 5 }, (_, i) => {
        const year = currentYear + 4 - i;
        return { value: year.toString(), label: `Batch ${year}` };
    });

    // Compute program options based on selected college (synchronous)
    const programOptions = useMemo(() => {
        if (mode !== "section" || !values.college) return [];
        return dbPrograms
            .filter((p) => p.college_id.toString() === values.college)
            .map((p) => ({ value: p.program_id.toString(), label: p.name }));
    }, [values.college, dbPrograms, mode]);

    // Compute year options based on selected program (synchronous)
    const yearOptions = useMemo(() => {
        if (mode !== "section" || !values.program) return [];
        const selectedDbProgram = dbPrograms.find((p) => p.program_id.toString() === values.program);
        const maxYears = selectedDbProgram ? selectedDbProgram.years : 4;
        return Array.from({ length: maxYears }, (_, i) => ({
            value: (i + 1).toString(),
            label: `Year ${i + 1}`,
        }));
    }, [values.program, dbPrograms, mode]);

    // Compute section options based on year level (synchronous)
    const sectionOptions = useMemo(() => {
        if (mode !== "section" || !values.year_level) return [];
        return Array.from({ length: 20 }, (_, i) => ({
            value: `${values.year_level}-${i + 1}`,
            label: `Section ${i + 1}`,
        }));
    }, [values.year_level, mode]);

    // Compute batch program options (synchronous)
    const batchProgramOptions = useMemo(() => {
        if (mode !== "batch" || !values.batch_college) return [];
        return dbPrograms
            .filter((p) => p.college_id.toString() === values.batch_college)
            .map((p) => ({ value: p.program_id.toString(), label: p.name }));
    }, [values.batch_college, dbPrograms, mode]);

    // 🧠 FIXED: Lock background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"; // Prevent body scroll
        } else {
            document.body.style.overflow = "unset"; // Restore body scroll
        }

        // Cleanup function to ensure scroll is restored if component unmounts
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setAnimate(false);
            return;
        }

        setModalKey(prev => prev + 1);
        setAnimate(true);

        // Use mode from currentFilters if available, otherwise default
        let newMode = defaultMode;
        if (currentFilters?.mode && (allowSection || allowBatch)) {
            // Only switch if the mode is allowed
            if (currentFilters.mode === 'section' && allowSection) newMode = 'section';
            if (currentFilters.mode === 'batch' && allowBatch) newMode = 'batch';
        }
        setMode(newMode);

        let initial = currentFilters ? { ...currentFilters } : {};

        // Override with user restrictions
        if (user && user.college_id) {
            const userCollegeId = user.college_id.toString();
            initial.college = userCollegeId;
            initial.batch_college = userCollegeId;
            if (user.program_id) {
                initial.program = user.program_id.toString();
                initial.batch_program = user.program_id.toString();
            }
        }

        // Clear invalid year_level
        if (initial.program && initial.year_level) {
            const years = Array.from({ length: 4 }, (_, i) => (i + 1).toString());
            if (!years.includes(initial.year_level)) {
                initial.year_level = "";
            }
        }

        setValues(initial);
    }, [isOpen, currentFilters, user, allowSection, allowBatch, defaultMode]);

    const closeModal = () => {
        setAnimate(false);
        setTimeout(onClose, 300);
    };

    const handleChange = (field, value) => {
        setValues(prev => ({ ...prev, [field]: value }));
    };

    const isFormValid = () => {
        if (mode === "section") {
            return values.academic_year && values.semester && values.college && values.program && values.year_level && values.section;
        } else {
            return values.batch_college && values.batch_program && values.batch_year && values.board_batch;
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[1000] flex items-center justify-center transition-all duration-300 ${animate ? "bg-gray-900/60 backdrop-blur-sm" : "bg-transparent backdrop-blur-none pointer-events-none"}`}>
            <div className={`bg-white rounded-2xl w-[90%] max-w-[500px] shadow-2xl relative flex flex-col transition-all duration-300 transform overflow-visible ${animate ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
                <div className="bg-[#5c297c] p-6 text-center relative rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-white tracking-wide">Filter Students</h2>
                    {allowBatch && allowSection && (
                        <button
                            onClick={() => setMode(mode === "section" ? "batch" : "section")}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white border border-white/30 text-sm hover:bg-white/20 transition-all font-medium"
                        >
                            <i className="bi bi-arrow-repeat"></i>
                            <span>Switch to {mode === "section" ? "Batch" : "Section"} Filter</span>
                        </button>
                    )}
                    <button onClick={closeModal} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
                        <i className="bi bi-x-lg text-xl"></i>
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
                    {mode === "section" && allowSection && (
                        <div key={modalKey} className="flex flex-col animate-fade-in relative z-20">
                            <CustomSelectGroup
                                label="A.Y."
                                value={values.academic_year}
                                onChange={(e) => handleChange("academic_year", e.target.value)}
                                options={dynamicAcademicYears}
                                placeholder="Select A.Y."
                            />
                            <CustomSelectGroup
                                label="Semester"
                                value={values.semester}
                                onChange={(e) => handleChange("semester", e.target.value)}
                                options={mockSemesters}
                                placeholder="Select Semester"
                            />
                            <CustomSelectGroup
                                label="College"
                                value={values.college}
                                onChange={(e) => handleChange("college", e.target.value)}
                                options={collegeOptions}
                                disabled={!!(user && user.college_id)}
                                placeholder="Select College"
                            />
                            <CustomSelectGroup
                                label="Program"
                                value={values.program}
                                onChange={(e) => handleChange("program", e.target.value)}
                                options={programOptions}
                                disabled={!values.college || !!(user && user.program_id)}
                                placeholder={!values.college ? "Select College First" : "Select Program"}
                            />
                            <CustomSelectGroup
                                label="Year Level"
                                value={values.year_level}
                                onChange={(e) => handleChange("year_level", e.target.value)}
                                options={yearOptions}
                                disabled={!values.program}
                                placeholder={!values.program ? "Select Program First" : "Select Level"}
                            />
                            <CustomSelectGroup
                                label="Section"
                                value={values.section}
                                onChange={(e) => handleChange("section", e.target.value)}
                                options={sectionOptions}
                                disabled={!values.year_level}
                                placeholder={!values.year_level ? "Select Year First" : "Select Section"}
                            />
                        </div>
                    )}
                    {mode === "batch" && allowBatch && (
                        <div key={`batch-${modalKey}`} className="flex flex-col animate-fade-in">
                            <CustomSelectGroup
                                label="College"
                                value={values.batch_college}
                                onChange={(e) => handleChange("batch_college", e.target.value)}
                                options={collegeOptions}
                                disabled={!!(user && user.college_id)}
                                placeholder="Select College"
                            />
                            <CustomSelectGroup
                                label="Program"
                                value={values.batch_program}
                                onChange={(e) => handleChange("batch_program", e.target.value)}
                                options={batchProgramOptions}
                                disabled={!values.batch_college || !!(user && user.program_id)}
                                placeholder={!values.batch_college ? "Select College First" : "Select Program"}
                            />
                            <CustomSelectGroup
                                label="Year"
                                value={values.batch_year}
                                onChange={(e) => handleChange("batch_year", e.target.value)}
                                options={dynamicBatches}
                                placeholder="Select Year"
                            />
                            <CustomSelectGroup
                                label="Board Exam Batch"
                                value={values.board_batch}
                                onChange={(e) => handleChange("board_batch", e.target.value)}
                                options={[
                                    { value: "1", label: "Batch 1" },
                                    { value: "2", label: "Batch 2" },
                                ]}
                                placeholder="Select Batch"
                            />
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl relative z-10 shrink-0">
                    <button onClick={closeModal} className="px-5 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-all">Cancel</button>
                    <button
                        onClick={() => {
                            if (isFormValid()) {
                                let payload = {};
                                if (mode === "section") {
                                    payload = {
                                        academic_year: values.academic_year,
                                        semester: values.semester,
                                        college: values.college,
                                        program: values.program,
                                        year_level: values.year_level,
                                        section: values.section,
                                    };
                                } else {
                                    payload = {
                                        batch_college: values.batch_college,
                                        batch_program: values.batch_program,
                                        batch_year: values.batch_year,
                                        board_batch: values.board_batch,
                                    };
                                }
                                onApply(payload, mode);
                                closeModal();
                            }
                        }}
                        disabled={!isFormValid()}
                        className={`px-5 py-2 text-sm font-bold text-white rounded-lg shadow-md transition-all duration-300 ${isFormValid() ? "bg-[#5c297c] hover:bg-[#4a1f63] cursor-pointer" : "bg-gray-400 cursor-not-allowed opacity-60"}`}
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
}