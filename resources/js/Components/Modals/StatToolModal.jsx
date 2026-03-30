import React, { useState, useEffect } from "react";
import CustomSelectGroup from "@/Components/SelectGroup";

export default function StatToolModal({ isOpen, onClose, onGenerate }) {
    const [animate, setAnimate] = useState(false);
    
    // State is initialized once here, and will now persist!
    const [config, setConfig] = useState({
        tool: "",
        inferentialType: "",
        descCategory: "",
        descField: "",
        descSub: "",
        var1Category: "",
        var1Field: "",
        var1Sub: "",
        var2Category: "",
        var2Field: "",
        var2Sub: "",
    });

    const INFERENTIAL_TYPES = [
        { value: "regression", label: "Regression" },
        { value: "pearson", label: "Pearson R" },
        { value: "chiSquareGOF", label: "Chi Square - Goodness of Fit" },
        { value: "chiSquareTOI", label: "Chi Square - Test of Independence" },
        { value: "tTestIND", label: "Independent T Test" },
        { value: "tTestDEP", label: "Dependent T Test" },
    ];

    const FIELDS_REQUIRING_SUB = [
        "GWA",
        "BoardGrades",
        "Retakes",
        "PerformanceRating",
        "SimExam",
        "MockScores",
    ];

    // MOCK DATA for sub-metrics
    const MOCK_SUB_METRICS = {
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

    const getBaseFieldOptions = (category, varType, currentState) => {
        if (!category) return [];

        if (currentState.tool === "descriptive") {
            if (category === "studentInfo")
                return [
                    { value: "age", label: "Age" },
                    { value: "socioeconomicStatus", label: "Socioeconomic Status" },
                ];
            if (category === "academicProfile")
                return [
                    { value: "GWA", label: "GWA" },
                    { value: "BoardGrades", label: "Grades in Board Subjects" },
                    { value: "Retakes", label: "Back Subjects/Retakes" },
                    { value: "PerformanceRating", label: "Performance Rating" },
                    { value: "SimExam", label: "Simulation Exam Results" },
                    { value: "Attendance", label: "Attendance in Review Classes" },
                    { value: "Recognition", label: "Academic Recognition" },
                ];
            if (category === "programMetrics")
                return [
                    { value: "MockScores", label: "Mock Board Scores" },
                    { value: "TakeAttempt", label: "Number of Exam Attempts" },
                ];
        }

        if (currentState.tool === "inferential") {
            const inf = currentState.inferentialType;

            if (inf === "regression" || inf === "pearson") {
                if (category === "studentInfo") return [{ value: "age", label: "Age" }];
                if (category === "academicProfile")
                    return [
                        { value: "GWA", label: "GWA" },
                        { value: "BoardGrades", label: "Grades in Board Subjects" },
                        { value: "Retakes", label: "Back Subjects/Retakes" },
                        { value: "PerformanceRating", label: "Performance Rating" },
                        { value: "SimExam", label: "Simulation Exam Results" },
                        { value: "Attendance", label: "Attendance in Review Classes" },
                        { value: "Recognition", label: "Academic Recognition" },
                    ];
                if (category === "programMetrics")
                    return [
                        { value: "MockScores", label: "Mock Board Scores" },
                        { value: "TakeAttempt", label: "Number of Exam Attempts" },
                    ];
            }

            if (inf === "chiSquareGOF" || inf === "chiSquareTOI") {
                if (category === "studentInfo")
                    return [
                        { value: "gender", label: "Gender" },
                        { value: "socioeconomicStatus", label: "Socioeconomic Status" },
                        { value: "livingArrangement", label: "Current Living Arrangement" },
                        { value: "workStatus", label: "Work Status" },
                        { value: "scholarship", label: "Scholarship/Grant" },
                        { value: "language", label: "Language Spoken at Home" },
                        { value: "lastSchool", label: "Last School Attended" },
                    ];
                if (category === "academicProfile")
                    return [
                        { value: "BoardGrades", label: "Grades in Board Subjects" },
                        { value: "PerformanceRating", label: "Performance Rating" },
                        { value: "SimExam", label: "Simulation Exam Results" },
                        { value: "Attendance", label: "Attendance in Review Classes" },
                    ];
                if (category === "programMetrics")
                    return [
                        { value: "ReviewCenter", label: "Student Review Center" },
                        { value: "MockScores", label: "Mock Board Scores" },
                        { value: "LicensureResult", label: "Licensure Exam Result" },
                    ];
            }

            if (inf === "tTestIND") {
                if (varType === "var1") {
                    if (category === "studentInfo")
                        return [
                            { value: "gender", label: "Gender" },
                            { value: "scholarship", label: "Scholarship/Grant" },
                            { value: "language", label: "Language Spoken at Home" },
                            { value: "lastSchool", label: "Last School Attended" },
                        ];
                    if (category === "academicProfile")
                        return [{ value: "Retakes", label: "Back Subjects/Retakes" }];
                    if (category === "programMetrics")
                        return [
                            { value: "LicensureResult", label: "Licensure Exam Result" },
                            { value: "TakeAttempt", label: "Number of Exam Attempts" },
                        ];
                } else {
                    if (category === "studentInfo") return [{ value: "age", label: "Age" }];
                    if (category === "academicProfile")
                        return [
                            { value: "BoardGrades", label: "Grades in Board Subjects" },
                            { value: "PerformanceRating", label: "Performance Rating" },
                            { value: "SimExam", label: "Simulation Exam Results" },
                            { value: "Attendance", label: "Attendance in Review Classes" },
                        ];
                    if (category === "programMetrics")
                        return [{ value: "MockScores", label: "Mock Board Scores" }];
                }
            }

            if (inf === "tTestDEP") {
                if (category === "academicProfile")
                    return [
                        { value: "BoardGrades", label: "Grades in Board Subjects" },
                        { value: "PerformanceRating", label: "Performance Rating" },
                        { value: "SimExam", label: "Simulation Exam Results" },
                    ];
                if (category === "programMetrics")
                    return [{ value: "MockScores", label: "Mock Board Scores" }];
            }
        }
        return [];
    };

    const getAvailableFields = (category, varType, currentState = config) => {
        const baseFields = getBaseFieldOptions(category, varType, currentState);
        if (varType === "var2" && currentState.var1Category === category) {
            return baseFields.filter((option) => {
                const requiresSub = FIELDS_REQUIRING_SUB.includes(option.value);
                if (!requiresSub) {
                    if (currentState.var1Field === option.value) return false;
                } else {
                    const subMetrics = MOCK_SUB_METRICS[option.value] || [];
                    if (subMetrics.length === 1 && currentState.var1Field === option.value && currentState.var1Sub === subMetrics[0].value) {
                        return false;
                    }
                }
                return true;
            });
        }
        return baseFields;
    };

    const getAvailableCategories = (varType, currentState = config) => {
        let all = [
            { value: "studentInfo", label: "Student Information" },
            { value: "academicProfile", label: "Academic Profile" },
            { value: "programMetrics", label: "Program Metrics" },
        ];
        if (currentState.tool === "inferential" && currentState.inferentialType === "tTestDEP") {
            all = all.filter((c) => c.value !== "studentInfo");
        }
        if (varType === "var2") {
            all = all.filter((category) => {
                const fields = getAvailableFields(category.value, "var2", currentState);
                return fields.length > 0;
            });
        }
        return all;
    };

    const getAvailableSubMetrics = (field, varType, currentState = config) => {
        const baseSubMetrics = MOCK_SUB_METRICS[field] || [];
        if (varType === "var2" && currentState.var1Category === currentState.var2Category && currentState.var1Field === field) {
            return baseSubMetrics.filter((sub) => sub.value !== currentState.var1Sub);
        }
        return baseSubMetrics;
    };

    const getSubMetricLabel = (field) => {
        if (field === "GWA") return "Select Year and Semester:";
        if (field === "BoardGrades") return "Select Board Subject:";
        if (field === "Retakes") return "Select Subject:";
        if (field === "PerformanceRating") return "Select Category:";
        if (field === "SimExam") return "Select Simulation:";
        if (field === "MockScores") return "Select Mock Subject:";
        return "Select Option:";
    };

    const handleConfigChange = (field, value) => {
        setConfig((prev) => {
            const next = { ...prev, [field]: value };
            if (field === "descCategory") { next.descField = ""; next.descSub = ""; }
            if (field === "descField") { next.descSub = ""; }
            if (field === "var1Category") { next.var1Field = ""; next.var1Sub = ""; }
            if (field === "var1Field") { next.var1Sub = ""; }
            if (field === "var2Category") { next.var2Field = ""; next.var2Sub = ""; }
            if (field === "var2Field") { next.var2Sub = ""; }

            if (field.startsWith("var1") && next.tool === "inferential") {
                const validVar2Cats = getAvailableCategories("var2", next).map((c) => c.value);
                if (next.var2Category && !validVar2Cats.includes(next.var2Category)) {
                    next.var2Category = ""; next.var2Field = ""; next.var2Sub = "";
                } else if (next.var2Category) {
                    const validVar2Fields = getAvailableFields(next.var2Category, "var2", next).map((f) => f.value);
                    if (next.var2Field && !validVar2Fields.includes(next.var2Field)) {
                        next.var2Field = ""; next.var2Sub = "";
                    } else if (next.var2Field) {
                        const validVar2Subs = getAvailableSubMetrics(next.var2Field, "var2", next).map((s) => s.value);
                        if (next.var2Sub && !validVar2Subs.includes(next.var2Sub)) {
                            next.var2Sub = "";
                        }
                    }
                }
            }
            return next;
        });
    };

    const isFormValid = () => {
        if (!config.tool) return false;
        if (config.tool === "descriptive") {
            if (!config.descCategory || !config.descField) return false;
            if (FIELDS_REQUIRING_SUB.includes(config.descField) && !config.descSub) return false;
            return true;
        }
        if (config.tool === "inferential") {
            if (!config.inferentialType) return false;
            if (config.inferentialType === "chiSquareGOF") {
                if (!config.var1Category || !config.var1Field) return false;
                if (FIELDS_REQUIRING_SUB.includes(config.var1Field) && !config.var1Sub) return false;
                return true;
            }
            if (!config.var1Category || !config.var1Field || !config.var2Category || !config.var2Field) return false;
            if (FIELDS_REQUIRING_SUB.includes(config.var1Field) && !config.var1Sub) return false;
            if (FIELDS_REQUIRING_SUB.includes(config.var2Field) && !config.var2Sub) return false;
            if (config.var1Field === config.var2Field && config.var1Sub === config.var2Sub) return false;
            return true;
        }
        return false;
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
                @keyframes snapIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
                .animate-snap { animation: snapIn 0.2s ease-out forwards; }
            `}</style>

            <div className={`bg-white rounded-2xl w-full max-w-[550px] shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden transition-all duration-300 transform ${animate ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
                
                <div className="p-6 pb-4 text-center border-b border-gray-100 relative z-[70] flex-shrink-0 bg-white">
                    <h2 className="text-[22px] font-bold text-[#5c297c] tracking-wide">
                        Statistical Tools
                    </h2>
                    <button onClick={closeModal} className="absolute top-6 right-6 text-gray-400 hover:text-[#5c297c] transition-all duration-300 ease-in-out">
                        <i className="bi bi-x-lg text-xl"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto stat-modal-scroll flex flex-col relative">
                    <div className="px-8 pt-6 pb-6 flex flex-col gap-6 relative z-[30]">
                        
                        {/* Tool Selection */}
                        <div className="w-full relative z-[60]">
                            <div className="relative z-[30]">
                                <CustomSelectGroup
                                    label="Statistical Tool:"
                                    value={config.tool}
                                    onChange={(e) => {
                                        setConfig({
                                            tool: e.target.value, inferentialType: "",
                                            descCategory: "", descField: "", descSub: "",
                                            var1Category: "", var1Field: "", var1Sub: "",
                                            var2Category: "", var2Field: "", var2Sub: "",
                                        });
                                    }}
                                    options={[
                                        { value: "descriptive", label: "Descriptive" },
                                        { value: "inferential", label: "Inferential" },
                                    ]}
                                    placeholder="Select Tool"
                                    vertical={true}
                                    className="mb-0"
                                />
                            </div>

                            {config.tool === "inferential" && (
                                <div className="mt-4 pt-4 border-t border-gray-200 animate-snap relative z-[20]">
                                    <CustomSelectGroup
                                        label="Inferential Type:"
                                        value={config.inferentialType}
                                        onChange={(e) => setConfig((prev) => ({
                                            ...prev, inferentialType: e.target.value,
                                            var1Category: "", var1Field: "", var1Sub: "",
                                            var2Category: "", var2Field: "", var2Sub: "",
                                        }))}
                                        options={INFERENTIAL_TYPES}
                                        placeholder="Select Type"
                                        vertical={true}
                                        className="mb-0"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Descriptive Mode Variables */}
                        {config.tool === "descriptive" && (
                            <div className="bg-purple-50 p-5 rounded-xl border border-purple-100 animate-snap relative z-[50]">
                                <h4 className="font-bold text-[#5c297c] mb-3 text-sm">Variable to Analyze</h4>

                                <div className="relative z-[30]">
                                    <CustomSelectGroup
                                        label="Category:"
                                        value={config.descCategory}
                                        onChange={(e) => handleConfigChange("descCategory", e.target.value)}
                                        options={getAvailableCategories("desc")}
                                        placeholder="Select Category"
                                        vertical={true}
                                    />
                                </div>

                                {config.descCategory && (
                                    <div className="mt-4 animate-snap relative z-[20]">
                                        <CustomSelectGroup
                                            label={config.descCategory === "studentInfo" ? "Field:" : "Metric:"}
                                            value={config.descField}
                                            onChange={(e) => handleConfigChange("descField", e.target.value)}
                                            options={getAvailableFields(config.descCategory, "desc")}
                                            placeholder="Select Field"
                                            vertical={true}
                                        />
                                    </div>
                                )}

                                {config.descField && FIELDS_REQUIRING_SUB.includes(config.descField) && (
                                    <div className="mt-4 pt-4 border-t border-purple-200 animate-snap relative z-[10]">
                                        <CustomSelectGroup
                                            label={getSubMetricLabel(config.descField)}
                                            value={config.descSub}
                                            onChange={(e) => handleConfigChange("descSub", e.target.value)}
                                            options={getAvailableSubMetrics(config.descField, "desc")}
                                            placeholder="Select Option"
                                            vertical={true}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Inferential Mode Variables */}
                        {config.tool === "inferential" && config.inferentialType && (
                            <div className="space-y-6">
                                {/* VARIABLE 1 */}
                                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 relative z-[40]">
                                    <h4 className="font-bold text-[#5c297c] mb-3 text-sm">Variable 1</h4>
                                    <div className="relative z-[30]">
                                        <CustomSelectGroup
                                            label="Category:"
                                            value={config.var1Category}
                                            onChange={(e) => handleConfigChange("var1Category", e.target.value)}
                                            options={getAvailableCategories("var1")}
                                            placeholder="Select Category"
                                            vertical={true}
                                        />
                                    </div>

                                    {config.var1Category && (
                                        <div className="mt-4 animate-snap relative z-[20]">
                                            <CustomSelectGroup
                                                label={config.var1Category === "studentInfo" ? "Field:" : "Metric:"}
                                                value={config.var1Field}
                                                onChange={(e) => handleConfigChange("var1Field", e.target.value)}
                                                options={getAvailableFields(config.var1Category, "var1")}
                                                placeholder="Select Field"
                                                vertical={true}
                                            />
                                        </div>
                                    )}

                                    {config.var1Field && FIELDS_REQUIRING_SUB.includes(config.var1Field) && (
                                        <div className="mt-4 pt-4 border-t border-blue-200 animate-snap relative z-[10]">
                                            <CustomSelectGroup
                                                label={getSubMetricLabel(config.var1Field)}
                                                value={config.var1Sub}
                                                onChange={(e) => handleConfigChange("var1Sub", e.target.value)}
                                                options={getAvailableSubMetrics(config.var1Field, "var1")}
                                                placeholder="Select Option"
                                                vertical={true}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* VARIABLE 2 */}
                                {config.inferentialType !== "chiSquareGOF" && (
                                    <div className="bg-green-50 p-5 rounded-xl border border-green-100 relative z-[30]">
                                        <h4 className="font-bold text-[#5c297c] mb-3 text-sm">Variable 2</h4>
                                        <div className="relative z-[30]">
                                            <CustomSelectGroup
                                                label="Category:"
                                                value={config.var2Category}
                                                onChange={(e) => handleConfigChange("var2Category", e.target.value)}
                                                options={getAvailableCategories("var2")}
                                                placeholder="Select Category"
                                                vertical={true}
                                            />
                                        </div>

                                        {config.var2Category && (
                                            <div className="mt-4 animate-snap relative z-[20]">
                                                <CustomSelectGroup
                                                    label={config.var2Category === "studentInfo" ? "Field:" : "Metric:"}
                                                    value={config.var2Field}
                                                    onChange={(e) => handleConfigChange("var2Field", e.target.value)}
                                                    options={getAvailableFields(config.var2Category, "var2")}
                                                    placeholder="Select Field"
                                                    vertical={true}
                                                />
                                            </div>
                                        )}

                                        {config.var2Field && FIELDS_REQUIRING_SUB.includes(config.var2Field) && (
                                            <div className="mt-4 pt-4 border-t border-green-200 animate-snap relative z-[10]">
                                                <CustomSelectGroup
                                                    label={getSubMetricLabel(config.var2Field)}
                                                    value={config.var2Sub}
                                                    onChange={(e) => handleConfigChange("var2Sub", e.target.value)}
                                                    options={getAvailableSubMetrics(config.var2Field, "var2")}
                                                    placeholder="Select Option"
                                                    vertical={true}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center gap-4 p-5 mt-auto border-t border-gray-100 bg-gray-50 z-10 relative">
                        <button
                            onClick={closeModal}
                            className="w-[120px] py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-[5px] hover:bg-gray-100 transition-all duration-300 ease-in-out shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={!isFormValid()}
                            className={`w-[140px] py-2.5 text-sm font-bold text-white border rounded-[5px] shadow-md transition-all duration-300 ease-in-out
                                ${!isFormValid()
                                    ? "bg-gray-400 border-gray-400 cursor-not-allowed opacity-70"
                                    : "bg-[#5c297c] border-[#5c297c] hover:bg-[#4a1f63] cursor-pointer"
                                }`}
                        >
                            Generate Report
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}