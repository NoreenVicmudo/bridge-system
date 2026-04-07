import { useState, useEffect, useMemo } from "react";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CustomSelectGroup from "@/Components/SelectGroup";
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";

export default function ProgramMetricsFilter({ dbColleges = [], dbPrograms = [] }) {
    const { auth } = usePage().props;
    const user = auth.user;

    const isCollegeRestricted = !!user?.college_id;
    const isProgramRestricted = !!user?.program_id;

    // ✅ FIXED PARAM NAMES
    const [values, setValues] = useState({
        batch_college: "",
        batch_program: "",
        batch_year: "",
        board_batch: "",
    });

    const [combinations, setCombinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);

    // --- FETCH COMBINATIONS ---
    useEffect(() => {
        axios.get(route('program.filter-options')) 
            .then(res => {
                setCombinations(res.data.combinations || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    // --- APPLY USER RESTRICTIONS ---
    useEffect(() => {
        let initial = { ...values };

        if (isCollegeRestricted) initial.batch_college = user.college_id.toString();
        if (isProgramRestricted) initial.batch_program = user.program_id.toString();

        setValues(prev => ({ ...prev, ...initial }));
    }, [user]);

    // --- OPTIONS ---

    const collegeOptions = useMemo(() => {
        return dbColleges.map(c => ({
            value: c.value ? c.value.toString() : (c.college_id ? c.college_id.toString() : ""),
            label: c.label || c.name || "Unknown College"
        }));
    }, [dbColleges]);

    const programOptions = useMemo(() => {
        if (!values.batch_college) return [];

        return dbPrograms
            .filter(p => p.college_id && p.college_id.toString() === values.batch_college)
            .map(p => ({
                value: p.program_id?.toString() || "",
                label: p.name || "Unknown Program"
            }));
    }, [values.batch_college, dbPrograms]);

    const yearOptions = useMemo(() => {
        if (!values.batch_program) return [];

        const activeYears = new Set(
            combinations
                .filter(c => c.program_id.toString() === values.batch_program)
                .map(c => c.year.toString())
        );

        if (activeYears.size === 0) {
            const currentYear = new Date().getFullYear();
            return [
                { value: currentYear.toString(), label: currentYear.toString() },
                { value: (currentYear + 1).toString(), label: (currentYear + 1).toString() }
            ];
        }

        return Array.from(activeYears)
            .sort((a, b) => b - a)
            .map(y => ({ value: y, label: y }));
    }, [values.batch_program, combinations]);

    const batchOptions = useMemo(() => {
        if (!values.batch_year) return [];

        const activeBatches = new Set(
            combinations
                .filter(c =>
                    c.program_id.toString() === values.batch_program &&
                    c.year.toString() === values.batch_year
                )
                .map(c => c.batch_number.toString())
        );

        if (activeBatches.size === 0) {
            return [
                { value: "1", label: "Batch 1" },
                { value: "2", label: "Batch 2" }
            ];
        }

        return Array.from(activeBatches)
            .sort((a, b) => a - b)
            .map(b => ({ value: b, label: `Batch ${b}` }));
    }, [values.batch_program, values.batch_year, combinations]);

    // --- HANDLERS ---
    const handleChange = (field, value) => {
        let newValues = { ...values, [field]: value };

        if (field === "batch_college") {
            newValues.batch_program = isProgramRestricted ? user.program_id.toString() : "";
            newValues.batch_year = "";
            newValues.board_batch = "";
        } else if (field === "batch_program") {
            newValues.batch_year = "";
            newValues.board_batch = "";
        } else if (field === "batch_year") {
            newValues.board_batch = "";
        }

        setValues(newValues);
    };

    const handleClear = () => {
        let resetValues = {
            batch_college: "",
            batch_program: "",
            batch_year: "",
            board_batch: ""
        };

        if (isCollegeRestricted) resetValues.batch_college = user.college_id.toString();
        if (isProgramRestricted) resetValues.batch_program = user.program_id.toString();

        setValues(resetValues);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const collegeName = collegeOptions.find(c => c.value === values.batch_college)?.label;
        const programName = programOptions.find(p => p.value === values.batch_program)?.label;

        const filterWithNames = {
            ...values,
            college_name: collegeName,
            program_name: programName
        };

        localStorage.setItem("programFilterData", JSON.stringify(filterWithNames));
        setIsMetricModalOpen(true);
    };

    // ✅ FIXED VALIDATION
    const isFormComplete =
        values.batch_college &&
        values.batch_program &&
        values.batch_year &&
        values.board_batch;

    if (loading) return (
        <AuthenticatedLayout>
            <div className="flex justify-center items-center h-screen text-[#5c297c] font-bold">
                Loading Program Data...
            </div>
        </AuthenticatedLayout>
    );

    return (
        <AuthenticatedLayout>
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-[700px] bg-white rounded-[10px] shadow-[0_6px_25px_rgba(0,0,0,0.1)] p-6 md:p-8">
                    <form onSubmit={handleSubmit}>
                        <h2 className="text-center text-2xl font-bold text-[#5c297c] mb-6">
                            Program Metrics Filter
                        </h2>

                        <div className="space-y-4">
                            <CustomSelectGroup
                                label="College"
                                value={values.batch_college}
                                onChange={(e) => handleChange("batch_college", e.target.value)}
                                options={collegeOptions}
                                disabled={isCollegeRestricted}
                            />

                            <CustomSelectGroup
                                label="Program"
                                value={values.batch_program}
                                onChange={(e) => handleChange("batch_program", e.target.value)}
                                options={programOptions}
                                disabled={!values.batch_college || isProgramRestricted}
                            />

                            <CustomSelectGroup
                                label="Calendar Year"
                                value={values.batch_year}
                                onChange={(e) => handleChange("batch_year", e.target.value)}
                                options={yearOptions}
                                disabled={!values.batch_program}
                            />

                            <CustomSelectGroup
                                label="Board Exam Batch"
                                value={values.board_batch}
                                onChange={(e) => handleChange("board_batch", e.target.value)}
                                options={batchOptions}
                                disabled={!values.batch_year}
                            />
                        </div>

                        <div className="mt-8 flex justify-center gap-3">
                            <button
                                type="button"
                                onClick={handleClear}
                                className="px-10 py-3 bg-white border border-gray-300 font-bold rounded-md"
                            >
                                Clear
                            </button>

                            <button
                                type="submit"
                                disabled={!isFormComplete}
                                className={`px-10 py-3 font-bold rounded-md
                                    ${isFormComplete 
                                        ? "bg-[#5c297c] text-white" 
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
                filterData={values} // ✅ now correct keys
            />
        </AuthenticatedLayout>
    );
}