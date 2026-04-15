import { useState, useEffect } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CustomSelectGroup from "@/Components/SelectGroup";

// 1. Accept the database arrays from Laravel
export default function StudentInfoFilter({ dbColleges = [], dbPrograms = [] }) {
    // 2. Grab the logged-in user to check if we should lock the college dropdown
    const { auth } = usePage().props;
    const user = auth.user;

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

    // 3. Map the database colleges to the { value, label } format your CustomSelectGroup needs
    const collegeOptions = dbColleges.map((college) => ({
        value: college.college_id.toString(),
        label: college.name,
    }));

    // 4. AUTO-LOCK SECURITY: Lock College AND Program if the user is restricted!
    useEffect(() => {
        if (user && user.college_id) {
            const userCollegeId = user.college_id.toString();
            
            let newValues = {
                college: userCollegeId,
                batch_college: userCollegeId,
            };

            // If the user is an Assistant (locked to a specific program)
            if (user.program_id) {
                const userProgramId = user.program_id.toString();
                newValues.program = userProgramId;
                newValues.batch_program = userProgramId;

                // Auto-load the years for their specific program
                const selectedDbProgram = dbPrograms.find((p) => p.program_id.toString() === userProgramId);
                const maxYears = selectedDbProgram ? selectedDbProgram.years : 4;
                
                setYearOptions(
                    Array.from({ length: maxYears }, (_, i) => ({
                        value: (i + 1).toString(),
                        label: `Year ${i + 1}`,
                    }))
                );
            }

            // Update state with the locked values
            setValues((prev) => ({ ...prev, ...newValues }));

            // Auto-load the programs for their specific college
            const filteredPrograms = dbPrograms
                .filter((p) => p.college_id.toString() === userCollegeId)
                .map((p) => ({ value: p.program_id.toString(), label: p.name }));
            
            setProgramOptions(filteredPrograms);
        }
    }, [user, dbPrograms]);

    const handleChange = (field, value) => {
        const newValues = { ...values, [field]: value };

        if (filterMode === "section") {
            if (field === "college") {
                newValues.program = "";
                newValues.year_level = "";
                newValues.section = "";
                
                // 5. Filter real programs from the database based on the selected college
                const filteredPrograms = dbPrograms
                    .filter((p) => p.college_id.toString() === value)
                    .map((p) => ({ value: p.program_id.toString(), label: p.name }));
                
                setProgramOptions(filteredPrograms);
                setYearOptions([]);
                setSectionOptions([]);
            } else if (field === "program") {
                newValues.year_level = "";
                newValues.section = "";
                
                // Find the selected program in the database to get its max years (e.g., Dentistry has 6!)
                const selectedDbProgram = dbPrograms.find((p) => p.program_id.toString() === value);
                const maxYears = selectedDbProgram ? selectedDbProgram.years : 4;
                
                setYearOptions(
                    Array.from({ length: maxYears }, (_, i) => ({
                        value: (i + 1).toString(),
                        label: `Year ${i + 1}`,
                    }))
                );
                setSectionOptions([]);
            } else if (field === "year_level") {
                newValues.section = "";
                // Hardcoding mock sections for now since we haven't built the sections table yet!
                setSectionOptions(
                    Array.from({ length: 20 }, (_, i) => ({
                       value: `${value}-${i + 1}`,
                        label: `Section ${i + 1}`
                    }))
                );
            }
        } else if (filterMode === "batch") {
            if (field === "batch_college") {
                newValues.batch_program = "";
                const filteredPrograms = dbPrograms
                    .filter((p) => p.college_id.toString() === value)
                    .map((p) => ({ value: p.program_id.toString(), label: p.name }));
                setProgramOptions(filteredPrograms);
            }
        }

        setValues(newValues);
    };

    const handleClear = () => {
        let resetValues = { ...initialValues };
        
        // Restore locked College
        if (user && user.college_id) {
            resetValues.college = user.college_id.toString();
            resetValues.batch_college = user.college_id.toString();
        } else {
            setProgramOptions([]);
        }

        // Restore locked Program
        if (user && user.program_id) {
            resetValues.program = user.program_id.toString();
            resetValues.batch_program = user.program_id.toString();
        } else {
            setYearOptions([]);
        }
        
        setValues(resetValues);
        setSectionOptions([]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Filter out empty values and only send keys relevant to the active mode
        const filteredParams = Object.fromEntries(
            Object.entries(values).filter(([_, v]) => v !== "")
        );

        router.get(route('student.info'), filteredParams, {
            preserveState: true, 
            preserveScroll: true,
        });
    };

    // Validation logic (Kept exactly as you had it)
    const isSectionComplete = values.academic_year && values.college && values.program && values.year_level && values.semester && values.section;
    const isBatchComplete = values.batch_college && values.batch_program && values.batch_year && values.board_batch;
    const isFormComplete = filterMode === "section" ? isSectionComplete : isBatchComplete;

    // Hardcoded mock options for the fields we haven't built database tables for yet
    const mockSemesters = [{ value: "1st", label: "1st Semester" }, { value: "2nd", label: "2nd Semester" }, { value: "Summer", label: "Summer" }];
    // 1. Get the current year dynamically (e.g., 2026)
    const currentYear = new Date().getFullYear(); 
    
    const mockBatches = Array.from(
        { length: currentYear - 2000 + 1 }, 
        (_, i) => {
            const startYear = currentYear - i;
            return {
                value: startYear.toString(),
                label: `Batch ${startYear}`
            };
        }
    );
    
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
                                <span>{filterMode === "section" ? "Switch to Batch Filter" : "Switch to Section Filter"}</span>
                            </button>
                        </div>

                        {filterMode === "section" ? (
                            <div className="animate-fade-in">
                                <CustomSelectGroup
                                    label="Academic Year"
                                    value={values.academic_year}
                                    onChange={(e) => handleChange("academic_year", e.target.value)}
                                    options={dynamicAcademicYears}
                                />
                                <CustomSelectGroup
                                    label="College"
                                    value={values.college}
                                    onChange={(e) => handleChange("college", e.target.value)}
                                    options={collegeOptions}
                                    disabled={user && user.college_id !== null} // Locks the dropdown!
                                />
                                <CustomSelectGroup
                                    label="Program"
                                    value={values.program}
                                    onChange={(e) => handleChange("program", e.target.value)}
                                    options={programOptions}
                                    disabled={!values.college || (user && user.program_id !== null)}
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
                                    options={mockSemesters}
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
                                    options={collegeOptions}
                                    disabled={user && user.college_id !== null} // Locks the dropdown!
                                />
                                <CustomSelectGroup
                                    label="Program"
                                    value={values.batch_program}
                                    onChange={(e) => handleChange("batch_program", e.target.value)}
                                    options={programOptions}
                                    disabled={!values.batch_college || (user && user.program_id !== null)}
                                    placeholder={!values.batch_college ? "Select College first" : "Select Program"}
                                />
                                <CustomSelectGroup
                                    label="Year"
                                    value={values.batch_year}
                                    onChange={(e) => handleChange("batch_year", e.target.value)}
                                    options={mockBatches}
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
                                href={route('student.masterlist')}
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