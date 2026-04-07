import { useState, useEffect, useMemo, useRef } from "react";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CustomSelectGroup from "@/Components/SelectGroup";
import ChangeMetricModal from "@/Components/Modals/ChangeMetricModal";

export default function AcademicProfileFilter() {
    const { auth } = usePage().props;
    const user = auth.user;

    const [values, setValues] = useState({
        academic_year: "",
        college: "",
        program: "",
        year_level: "",
        semester: "",
        section: "",
    });

    const [academicYears, setAcademicYears] = useState([]);
    const [optionsCache, setOptionsCache] = useState({});
    const [loading, setLoading] = useState(true);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);

    const isCollegeRestricted = !!user?.college_id;
    const isProgramRestricted = !!user?.program_id;

    const getOrdinal = (n) => {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return s[(v - 20) % 10] || s[v] || s[0];
    };

    // 1. Fetch academic years once
    useEffect(() => {
        axios.get(route('academic.filter-options'), { params: {} })
            .then(res => setAcademicYears(res.data.academic_years || []))
            .catch(err => console.error(err));
    }, []);

    // 2. Pre‑fetch options for each academic year (only when academicYears changes)
    useEffect(() => {
        if (academicYears.length === 0) return;
        let isMounted = true;
        const fetchAll = async () => {
            setLoading(true);
            const promises = academicYears.map(year =>
                axios.get(route('academic.filter-options'), { params: { academic_year: year } })
                    .then(res => ({ year, data: res.data }))
                    .catch(() => ({ year, data: null }))
            );
            const results = await Promise.all(promises);
            if (!isMounted) return;
            const cache = {};
            results.forEach(({ year, data }) => {
                if (data) {
                    const programsMap = {};
                    (data.programs || []).forEach(p => {
                        const collegeId = p.college_id;
                        if (!programsMap[collegeId]) programsMap[collegeId] = [];
                        programsMap[collegeId].push({ value: p.value, label: p.label });
                    });
                    cache[year] = {
                        colleges: data.colleges || [],
                        programs: programsMap,
                        year_levels: data.year_levels || [],
                        semesters: data.semesters || [],
                        sections: data.sections || [],
                    };
                }
            });
            setOptionsCache(cache);
            setLoading(false);
        };
        fetchAll();
        return () => { isMounted = false; };
    }, [academicYears]);

    // Options for the selected academic year
    const currentOptions = useMemo(() => {
        if (!values.academic_year) return null;
        return optionsCache[values.academic_year] || null;
    }, [values.academic_year, optionsCache]);

    const collegeOptions = currentOptions?.colleges || [];
    const programOptions = useMemo(() => {
        if (!values.college || !currentOptions) return [];
        return currentOptions.programs[values.college] || [];
    }, [values.college, currentOptions]);

    const yearLevelOptions = useMemo(() => {
        if (!currentOptions) return [];
        return currentOptions.year_levels.map(yl => ({
            value: yl.toString(),
            label: `${yl}${getOrdinal(yl)} Year`
        }));
    }, [currentOptions]);

    const semesterOptions = useMemo(() => {
        if (!currentOptions) return [];
        return currentOptions.semesters.map(s => ({ value: s, label: s }));
    }, [currentOptions]);

    const sectionOptions = useMemo(() => {
        if (!currentOptions || !values.year_level) return [];
        const filtered = currentOptions.sections.filter(s => s.startsWith(`${values.year_level}-`));
        return filtered.map(s => ({ value: s, label: s }));
    }, [currentOptions, values.year_level]);

    // Apply user restrictions only once on mount
    useEffect(() => {
        let initial = { ...values };
        if (isCollegeRestricted) initial.college = user.college_id.toString();
        if (isProgramRestricted) initial.program = user.program_id.toString();
        setValues(initial);
    }, []); // ✅ Empty array – runs once

    const handleChange = (field, value) => {
        let newValues = { ...values, [field]: value };

        if (field === "academic_year") {
            newValues.college = "";
            newValues.program = "";
            newValues.year_level = "";
            newValues.semester = "";
            newValues.section = "";
            if (isCollegeRestricted) newValues.college = user.college_id.toString();
            if (isProgramRestricted) newValues.program = user.program_id.toString();
        } else if (field === "college") {
            newValues.program = "";
            newValues.year_level = "";
            newValues.semester = "";
            newValues.section = "";
            if (isProgramRestricted) newValues.program = user.program_id.toString();
        } else if (field === "program") {
            newValues.year_level = "";
            newValues.semester = "";
            newValues.section = "";
        } else if (field === "year_level") {
            newValues.semester = "";
            newValues.section = "";
        } else if (field === "semester") {
            newValues.section = "";
        }
        setValues(newValues);
    };

    const handleClear = () => {
        let newValues = {
            academic_year: "",
            college: "",
            program: "",
            year_level: "",
            semester: "",
            section: "",
        };
        if (isCollegeRestricted) newValues.college = user.college_id.toString();
        if (isProgramRestricted) newValues.program = user.program_id.toString();
        setValues(newValues);
    };

    // ✅ Correct handleSubmit – only saves to localStorage and opens modal
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!values.academic_year || !values.college || !values.program || !values.year_level || !values.semester || !values.section) {
            return;
        }
        localStorage.setItem("academicFilterData", JSON.stringify(values));
        setIsMetricModalOpen(true);
    };

    const isFormComplete = !!(
        values.academic_year &&
        values.college &&
        values.program &&
        values.year_level &&
        values.semester &&
        values.section
    );

    if (loading) {
        return (
            <AuthenticatedLayout>
                <div className="flex justify-center items-center h-screen">Loading filter options...</div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-[700px] bg-white rounded-[10px] shadow-[0_6px_25px_rgba(0,0,0,0.1)] p-6 md:p-8">
                    <form onSubmit={handleSubmit}>
                        <h2 className="text-center text-2xl md:text-[28px] font-bold text-[#5c297c] mb-6">
                            Academic Profile Filter
                        </h2>

                        <div className="space-y-3">
                            <CustomSelectGroup
                                label="Academic Year"
                                value={values.academic_year}
                                onChange={(e) => handleChange("academic_year", e.target.value)}
                                options={academicYears.map(ay => ({ value: ay, label: ay }))}
                            />

                            <CustomSelectGroup
                                label="College"
                                value={values.college}
                                onChange={(e) => handleChange("college", e.target.value)}
                                options={collegeOptions}
                                disabled={isCollegeRestricted}
                                placeholder={!values.academic_year ? "Select Academic Year first" : "Select College"}
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
                                label="Year Level"
                                value={values.year_level}
                                onChange={(e) => handleChange("year_level", e.target.value)}
                                options={yearLevelOptions}
                                disabled={!values.program}
                                placeholder={!values.program ? "Select Program first" : "Select Year Level"}
                            />

                            <CustomSelectGroup
                                label="Semester"
                                value={values.semester}
                                onChange={(e) => handleChange("semester", e.target.value)}
                                options={semesterOptions}
                                disabled={!values.year_level}
                                placeholder={!values.year_level ? "Select Year Level first" : "Select Semester"}
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

                        <div className="mt-8 flex justify-center gap-3">
                            <button type="button" onClick={handleClear} className="px-6 py-3 bg-white text-gray-600 border border-gray-300 rounded-md hover:bg-[#ffb736] hover:text-white transition">
                                Clear
                            </button>
                            <button type="submit" disabled={!isFormComplete} className={`px-6 py-3 rounded-md transition ${isFormComplete ? "bg-[#5c297c] text-white hover:bg-[#ffb736] cursor-pointer" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}>
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
                type="academic"
                filterData={values}
            />
        </AuthenticatedLayout>
    );
}