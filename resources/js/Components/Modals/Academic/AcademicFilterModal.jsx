import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import CustomSelectGroup from "@/Components/SelectGroup";

export default function AcademicFilterModal({ isOpen, onClose, currentFilters, onApply }) {
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
    const [animate, setAnimate] = useState(false);

    const getOrdinal = (n) => {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return s[(v - 20) % 10] || s[v] || s[0];
    };

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
            // Pre-fill with currentFilters
            setValues({
                academic_year: currentFilters?.academic_year || "",
                college: currentFilters?.college || "",
                program: currentFilters?.program || "",
                year_level: currentFilters?.year_level || "",
                semester: currentFilters?.semester || "",
                section: currentFilters?.section || "",
            });
            if (academicYears.length === 0) {
                axios.get(route('academic.filter-options'), { params: {} })
                    .then(res => setAcademicYears(res.data.academic_years || []))
                    .catch(err => console.error(err));
            }
        } else {
            setAnimate(false);
        }
    }, [isOpen, currentFilters]);

    useEffect(() => {
        if (academicYears.length === 0) return;
        const fetchAll = async () => {
            setLoading(true);
            const promises = academicYears.map(year =>
                axios.get(route('academic.filter-options'), { params: { academic_year: year } })
                    .then(res => ({ year, data: res.data }))
                    .catch(() => ({ year, data: null }))
            );
            const results = await Promise.all(promises);
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
    }, [academicYears]);

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

    const handleChange = (field, value) => {
        let newValues = { ...values, [field]: value };
        if (field === "academic_year") {
            newValues.college = "";
            newValues.program = "";
            newValues.year_level = "";
            newValues.semester = "";
            newValues.section = "";
        } else if (field === "college") {
            newValues.program = "";
            newValues.year_level = "";
            newValues.semester = "";
            newValues.section = "";
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

    const handleSubmit = () => {
        if (!values.academic_year || !values.college || !values.program || !values.year_level || !values.semester || !values.section) {
            return;
        }
        onApply(values);
        closeModal();
    };

    const closeModal = () => {
        setAnimate(false);
        setTimeout(onClose, 300);
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[1000] flex items-center justify-center transition-all duration-300 ${animate ? "bg-gray-900/60 backdrop-blur-sm" : "bg-transparent backdrop-blur-none pointer-events-none"}`}>
            <div className={`bg-white rounded-2xl w-[90%] max-w-[700px] shadow-2xl relative flex flex-col transition-all duration-300 transform ${animate ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
                <div className="bg-[#5c297c] p-6 text-center relative rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-white">Filter Students (Academic)</h2>
                    <button onClick={closeModal} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
                        <i className="bi bi-x-lg text-xl"></i>
                    </button>
                </div>

                <div className="p-8">
                    {loading ? (
                        <div className="text-center py-8">Loading filter options...</div>
                    ) : (
                        <div className="space-y-4">
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
                                disabled={!values.academic_year}
                                placeholder={!values.academic_year ? "Select Academic Year first" : "Select College"}
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
                    )}

                    <div className="mt-8 flex justify-center gap-4">
                        <button onClick={closeModal} className="px-6 py-3 bg-white text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition">
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!values.academic_year || !values.college || !values.program || !values.year_level || !values.semester || !values.section}
                            className={`px-6 py-3 rounded-md transition ${
                                values.academic_year && values.college && values.program && values.year_level && values.semester && values.section
                                    ? "bg-[#5c297c] text-white hover:bg-[#ffb736] cursor-pointer"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                        >
                            Apply Filter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}