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
    // 1. ADD NEW PROPS HERE:
    user = null,
    dbColleges = [],
    dbPrograms = []
}) {
    const [mode, setMode] = useState(defaultMode);
    const [animate, setAnimate] = useState(false);

    // Dynamic Options States
    const [programOptions, setProgramOptions] = useState([]);
    const [yearOptions, setYearOptions] = useState([]);
    const [sectionOptions, setSectionOptions] = useState([]);

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

    // 2. Map Colleges dynamically from DB
    const collegeOptions = dbColleges.map((college) => ({
        value: college.college_id.toString(),
        label: college.name,
    }));

    // Static Options
    const mockSemesters = [{ value: "1st", label: "1st Semester" }, { value: "2nd", label: "2nd Semester" }];
    const mockYears = [{ value: "2025", label: "2025" }, { value: "2026", label: "2026" }];
    const mockBoardBatches = [{ value: "1", label: "Batch 1" }, { value: "2", label: "Batch 2" }];

    // 1. Get the current year dynamically (e.g., 2026)
    const currentYear = new Date().getFullYear(); 
    
    // 2. Generate Academic Years from the Current Year down to 2000
    const dynamicAcademicYears = Array.from(
        { length: currentYear - 2000 + 1 }, 
        (_, i) => {
            const startYear = currentYear - i;
            const endYear = startYear + 1;
            return {
                value: `${startYear}-${endYear}`,
                label: `${startYear}-${endYear}`
            };
        }
    );

    // 3. Generate standard Years for the "Batch" dropdown (Current Year down to 2000)
    // Adding +4 to the length so they can select future graduating batches!
    const dynamicBatches = Array.from(
        { length: currentYear - 2000 + 5 }, 
        (_, i) => {
            const year = currentYear + 4 - i; 
            return {
                value: year.toString(),
                label: `Batch ${year}` // Or just year.toString() for the modal
            };
        }
    );

    // 3. AUTO-LOCK AND PRE-FILL LOGIC
    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
            setMode(allowSection ? "section" : "batch");

            let initialValues = currentFilters ? { ...currentFilters } : { ...values };

            // Apply Security Locks if user is restricted
            if (user && user.college_id) {
                const userCollegeId = user.college_id.toString();
                initialValues.college = userCollegeId;
                initialValues.batch_college = userCollegeId;

                const filteredPrograms = dbPrograms
                    .filter((p) => p.college_id.toString() === userCollegeId)
                    .map((p) => ({ value: p.program_id.toString(), label: p.name }));
                setProgramOptions(filteredPrograms);

                if (user.program_id) {
                    const userProgramId = user.program_id.toString();
                    initialValues.program = userProgramId;
                    initialValues.batch_program = userProgramId;

                    const selectedDbProgram = dbPrograms.find((p) => p.program_id.toString() === userProgramId);
                    const maxYears = selectedDbProgram ? selectedDbProgram.years : 4;
                    
                    setYearOptions(
                        Array.from({ length: maxYears }, (_, i) => ({
                            value: (i + 1).toString(),
                            label: `Year ${i + 1}`,
                        }))
                    );
                }
            }

            // Pre-load options if filters are already set (like when reopening the modal)
            if (initialValues.college && (!user || !user.college_id)) {
                const filteredPrograms = dbPrograms
                    .filter((p) => p.college_id.toString() === initialValues.college)
                    .map((p) => ({ value: p.program_id.toString(), label: p.name }));
                setProgramOptions(filteredPrograms);
            }
            if (initialValues.program && (!user || !user.program_id)) {
                const selectedDbProgram = dbPrograms.find((p) => p.program_id.toString() === initialValues.program);
                const maxYears = selectedDbProgram ? selectedDbProgram.years : 4;
                setYearOptions(Array.from({ length: maxYears }, (_, i) => ({ value: (i + 1).toString(), label: `Year ${i + 1}` })));
            }
            if (initialValues.year_level) {
                setSectionOptions(Array.from({ length: 20 }, (_, i) => ({ value: `${initialValues.year_level}-${i + 1}`, label: `Section ${i + 1}` })));
            }

            setValues(initialValues);
        } else {
            setAnimate(false);
        }
    }, [isOpen, currentFilters, user, dbPrograms, dbColleges]);

    const closeModal = () => {
        setAnimate(false);
        setTimeout(onClose, 300);
    };

    // 4. DYNAMIC CHANGE HANDLER (Matches the main filter page perfectly)
    const handleChange = (field, value) => {
        let nextValues = { ...values, [field]: value };
        
        if (mode === "section") {
            if (field === "college") {
                nextValues.program = "";
                nextValues.year_level = "";
                nextValues.section = "";
                
                const filteredPrograms = dbPrograms
                    .filter((p) => p.college_id.toString() === value)
                    .map((p) => ({ value: p.program_id.toString(), label: p.name }));
                
                setProgramOptions(filteredPrograms);
                setYearOptions([]);
                setSectionOptions([]);
            } else if (field === "program") {
                nextValues.year_level = "";
                nextValues.section = "";
                
                const selectedDbProgram = dbPrograms.find((p) => p.program_id.toString() === value);
                const maxYears = selectedDbProgram ? selectedDbProgram.years : 4;
                
                setYearOptions(Array.from({ length: maxYears }, (_, i) => ({ value: (i + 1).toString(), label: `Year ${i + 1}` })));
                setSectionOptions([]);
            } else if (field === "year_level") {
                nextValues.section = "";
                setSectionOptions(Array.from({ length: 20 }, (_, i) => ({ value: `${value}-${i + 1}`, label: `Section ${i + 1}` })));
            }
        } else {
            if (field === "batch_college") {
                nextValues.batch_program = "";
                const filteredPrograms = dbPrograms
                    .filter((p) => p.college_id.toString() === value)
                    .map((p) => ({ value: p.program_id.toString(), label: p.name }));
                setProgramOptions(filteredPrograms);
            }
        }
        setValues(nextValues);
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

                <div className="p-6 flex flex-col gap-1">
                    {mode === "section" && allowSection && (
                        <div className="flex flex-col animate-fade-in relative z-20">
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
                            {/* LOCKED DROPDOWNS */}
                            <CustomSelectGroup
                                label="College"
                                value={values.college}
                                onChange={(e) => handleChange("college", e.target.value)}
                                options={collegeOptions}
                                disabled={user && user.college_id !== null}
                                placeholder="Select College"
                            />
                            <CustomSelectGroup
                                label="Program"
                                value={values.program}
                                onChange={(e) => handleChange("program", e.target.value)}
                                options={programOptions}
                                disabled={!values.college || (user && user.program_id !== null)}
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
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl relative z-10">
                    <button onClick={closeModal} className="px-5 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-all">Cancel</button>
                    <button
                        onClick={() => {
                            if (isFormValid()) {
                                onApply(values, mode);
                                // IMPORTANT: Use Inertia router to hit the controller just like the main page!
                                import('@inertiajs/react').then(({ router }) => {
                                    router.get('/student-info', values, { preserveState: true, preserveScroll: true });
                                });
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