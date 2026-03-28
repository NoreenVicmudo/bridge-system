import React, { useState, useEffect } from "react";
import CustomSelectGroup from "@/Components/SelectGroup";

export default function ProgramStatModal({ isOpen, onClose, onGenerate }) {
    const [animate, setAnimate] = useState(false);
    
    // State is initialized once here, and will now persist!
    const [config, setConfig] = useState({
        category: "",
        field: "",
        sub: "",
    });

    const CATEGORIES = [
        { value: "studentInfo", label: "Student Information" },
        { value: "academicProfile", label: "Academic Profile" },
        { value: "programMetrics", label: "Program Metrics" },
    ];

    const FIELDS = {
        studentInfo: [
            { value: "age", label: "Age" },
            { value: "socioeconomicStatus", label: "Socioeconomic Status" },
        ],
        academicProfile: [
            { value: "GWA", label: "GWA" },
            { value: "BoardGrades", label: "Grades in Board Subjects" },
            { value: "Retakes", label: "Back Subjects/Retakes" },
            { value: "PerformanceRating", label: "Performance Rating" },
            { value: "SimExam", label: "Simulation Exam Results" },
            { value: "Attendance", label: "Attendance in Review Classes" },
            { value: "Recognition", label: "Academic Recognition" },
        ],
        programMetrics: [
            { value: "MockScores", label: "Mock Board Scores" },
            { value: "TakeAttempt", label: "Number of Exam Attempts" },
        ],
    };

    const FIELDS_REQUIRING_SUB = [
        "GWA", "BoardGrades", "Retakes", "PerformanceRating", "SimExam", "MockScores",
    ];

    const SUB_METRICS = {
        GWA: [
            { value: "avg", label: "Average GWA" },
            { value: "1y1s", label: "1st Year - 1st Semester" },
            { value: "1y2s", label: "1st Year - 2nd Semester" },
        ],
        BoardGrades: [
            { value: "subj1", label: "Clinical Chemistry" },
            { value: "subj2", label: "Microbiology" },
        ],
        Retakes: [
            { value: "gen1", label: "Anatomy" },
            { value: "gen2", label: "Physiology" },
        ],
        PerformanceRating: [
            { value: "cat1", label: "Laboratory" },
            { value: "cat2", label: "Lecture" },
        ],
        SimExam: [
            { value: "sim1", label: "Simulation Exam 1" },
            { value: "sim2", label: "Simulation Exam 2" },
        ],
        MockScores: [
            { value: "mock1", label: "Mock Board 1" },
            { value: "mock2", label: "Mock Board 2" },
        ],
    };

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
            // FIX: Removed the setConfig reset here so it remembers previous choices!
        } else {
            setAnimate(false);
        }
    }, [isOpen]);

    const closeModal = () => {
        setAnimate(false);
        setTimeout(onClose, 300);
    };

    const handleConfigChange = (key, value) => {
        setConfig((prev) => {
            const next = { ...prev, [key]: value };
            if (key === "category") {
                next.field = "";
                next.sub = "";
            }
            if (key === "field") {
                next.sub = "";
            }
            return next;
        });
    };

    const getSubMetricLabel = (field) => {
        if (field === "GWA") return "Select Year/Semester:";
        if (field === "BoardGrades") return "Select Board Subject:";
        if (field === "Retakes") return "Select Subject:";
        if (field === "PerformanceRating") return "Select Category:";
        if (field === "SimExam") return "Select Simulation:";
        if (field === "MockScores") return "Select Mock Subject:";
        return "Select Option:";
    };

    const isFormValid = () => {
        if (!config.category || !config.field) return false;
        if (FIELDS_REQUIRING_SUB.includes(config.field) && !config.sub) return false;
        return true;
    };

    const handleGenerate = () => {
        onGenerate(config);
        closeModal();
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 transition-all duration-300 ${animate ? "bg-gray-900/60 backdrop-blur-sm" : "bg-transparent backdrop-blur-none pointer-events-none"}`}>
            <style>{`
                .stat-modal-scroll::-webkit-scrollbar { width: 6px; }
                .stat-modal-scroll::-webkit-scrollbar-thumb { background-color: #5c297c; border-radius: 6px; }
                .stat-modal-scroll::-webkit-scrollbar-track { background: transparent; }
            `}</style>

            <div className={`bg-white rounded-2xl w-full max-w-[500px] shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto stat-modal-scroll transition-all duration-300 transform ${animate ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
                
                <div className="sticky top-0 bg-white p-6 pb-4 text-center border-b border-gray-100 relative z-[70] rounded-t-2xl">
                    <h2 className="text-[22px] font-bold text-[#5c297c] tracking-wide">
                        Program Analysis Configuration
                    </h2>
                    <button onClick={closeModal} className="absolute top-6 right-6 text-gray-400 hover:text-[#5c297c] transition-all duration-300">
                        <i className="bi bi-x-lg text-xl"></i>
                    </button>
                </div>

                <div className="px-8 pb-10 pt-6 flex-1 flex flex-col gap-6 relative z-[30]">
                    <div className="bg-purple-50 p-5 rounded-xl border border-purple-100 relative z-[50]">
                        <h4 className="font-bold text-[#5c297c] mb-4 text-sm uppercase tracking-wider">Select Variable</h4>

                        <div className="space-y-4">
                            <div className="relative z-[40]">
                                <CustomSelectGroup
                                    label="Category:"
                                    value={config.category}
                                    onChange={(e) => handleConfigChange("category", e.target.value)}
                                    options={CATEGORIES}
                                    placeholder="Select Category"
                                    vertical={true}
                                />
                            </div>

                            {config.category && (
                                <div className="relative z-[30] pt-2 border-t border-purple-200/50 mt-2">
                                    <CustomSelectGroup
                                        label={config.category === "studentInfo" ? "Field:" : "Metric:"}
                                        value={config.field}
                                        onChange={(e) => handleConfigChange("field", e.target.value)}
                                        options={FIELDS[config.category] || []}
                                        placeholder="Select Field"
                                        vertical={true}
                                    />
                                </div>
                            )}

                            {config.field && FIELDS_REQUIRING_SUB.includes(config.field) && (
                                <div className="relative z-[20] pt-2 border-t border-purple-200">
                                    <CustomSelectGroup
                                        label={getSubMetricLabel(config.field)}
                                        value={config.sub}
                                        onChange={(e) => handleConfigChange("sub", e.target.value)}
                                        options={SUB_METRICS[config.field] || []}
                                        placeholder="Select Option"
                                        vertical={true}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-center gap-4 p-5 mt-auto border-t border-gray-100 bg-gray-50 z-[10] relative rounded-b-2xl">
                    <button onClick={closeModal} className="w-[120px] py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-[5px] hover:bg-gray-100 transition-all shadow-sm">
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={!isFormValid()}
                        className={`w-[140px] py-2.5 text-sm font-bold text-white border rounded-[5px] shadow-md transition-all 
                            ${!isFormValid() ? "bg-gray-400 border-gray-400 cursor-not-allowed opacity-70" : "bg-[#5c297c] border-[#5c297c] hover:bg-[#4a1f63]"}`}
                    >
                        Generate Report
                    </button>
                </div>
            </div>
        </div>
    );
}