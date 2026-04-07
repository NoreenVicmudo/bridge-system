import React, { useState, useEffect } from "react";
import CustomSelectGroup from "@/Components/SelectGroup";

export default function StatToolModal({ 
    isOpen, 
    onClose, 
    onGenerate, 
    subMetricMap = {}, filters // <-- Now injected dynamically from the backend!
}) {
    const [animate, setAnimate] = useState(false);
    const [categories, setCategories] = useState([]);
    const [expectedRatios, setExpectedRatios] = useState({});
    
    const [config, setConfig] = useState({
        tool: "",
        inferentialType: "",
        descField: "",
        descSub: "",
        var1Field: "",
        var1Sub: "",
        var2Field: "",
        var2Sub: "",
    });

    useEffect(() => {
        if (isOpen) setAnimate(true);
        else setAnimate(false);
    }, [isOpen]);

    const closeModal = () => {
        setAnimate(false);
        setTimeout(onClose, 300);
    };

    // --- STATIC OPTIONS ---
    const TOOL_OPTIONS = [
        { value: "descriptive", label: "Descriptive Statistics" },
        { value: "inferential", label: "Inferential Statistics" },
    ];

    const INFERENTIAL_TYPES = [
        { value: "pearson", label: "Pearson R Correlation" },
        { value: "regression", label: "Regression Analysis" },
        { value: "ttest_ind", label: "Independent Samples T-Test" },
        { value: "ttest_dep", label: "Dependent (Paired) Samples T-Test" },
        { value: "chi_sq_gof", label: "Chi-Square (Goodness of Fit)" },
        { value: "chi_sq_toi", label: "Chi-Square (Test of Independence)" },
    ];

    const METRIC_OPTIONS = [
        { value: "Gender", label: "Gender (Male/Female)", type: "categorical", hasSub: false },
        { value: "Age", label: "Age", type: "numerical", hasSub: false },
        { value: "Socioeconomic", label: "Socioeconomic Status", type: "numerical", hasSub: false },
        { value: "WorkStatus", label: "Work Status", type: "categorical", hasSub: false },
        { value: "GWA", label: "General Weighted Average (GWA)", type: "numerical", hasSub: false },
        // These four now support sub-selection + overall
        { value: "BoardGrades", label: "Grades in Board Subjects", type: "numerical", hasSub: true },
        { value: "MockScores", label: "Mock Board Exam Scores", type: "numerical", hasSub: true },
        { value: "PerformanceRating", label: "Performance Rating", type: "numerical", hasSub: true },
        { value: "SimExam", label: "Simulation Exam Results", type: "numerical", hasSub: true },
        
        { value: "Attendance", label: "Review Attendance", type: "numerical", hasSub: false },
        { value: "Retakes", label: "Back Subjects / Retakes", type: "numerical", hasSub: false },
        { value: "Licensure", label: "Licensure Exam Result", type: "categorical", hasSub: false },
    ];

    const getFilteredMetrics = (variableNum = 1) => {
        const type = config.inferentialType;

        // 1. Descriptive only makes sense for Numerical data (Mean, Std Dev, etc.)
        if (config.tool === "descriptive") {
            return METRIC_OPTIONS.filter(m => m.type === "numerical");
        }

        // 2. Pearson R & Regression REQUIRE both variables to be Numerical
        if (type === "pearson" || type === "regression") {
            return METRIC_OPTIONS.filter(m => m.type === "numerical");
        }

        // 3. Independent T-Test: Var 1 MUST be Categorical (Groups), Var 2 MUST be Numerical (Scores)
        if (type === "ttest_ind") {
            return variableNum === 1 
                ? METRIC_OPTIONS.filter(m => m.type === "categorical")
                : METRIC_OPTIONS.filter(m => m.type === "numerical");
        }

        // 4. Dependent T-Test: BOTH must be Numerical (e.g., Pre-test vs Post-test)
        if (type === "ttest_dep") {
            return METRIC_OPTIONS.filter(m => m.type === "numerical");
        }

        // 5. Chi-Square: BOTH must be Categorical (Counting frequencies)
        if (type === "chi_sq_gof" || type === "chi_sq_toi") {
            return METRIC_OPTIONS.filter(m => m.type === "categorical");
        }

        return METRIC_OPTIONS;
    };

    // --- DYNAMIC SUB-METRIC LOOKUP ---
    // If the backend didn't provide sub-metrics for a field (e.g., GWA just has one generic value), we provide a default single option.
    const getSubOptions = (metricKey) => {
        if (!metricKey) return [];

        const metricLabel = METRIC_OPTIONS.find(m => m.value === metricKey)?.label || metricKey;
        const overallOption = { value: "overall", label: `Overall ${metricLabel}` };

        // If the map has entries for this key, combine them with the overall option
        if (subMetricMap[metricKey] && subMetricMap[metricKey].length > 0) {
            return [overallOption, ...subMetricMap[metricKey]];
        }

        // Fallback for GWA, Age, etc.
        return [overallOption];
    };

    // --- HANDLERS ---
    const handleChange = (field, value) => {
        let newConfig = { ...config, [field]: value };

        // Reset downstream fields when parents change
        if (field === "tool") {
            newConfig = { tool: value, inferentialType: "", descField: "", descSub: "", var1Field: "", var1Sub: "", var2Field: "", var2Sub: "" };
        } else if (field === "inferentialType") {
            newConfig = { ...newConfig, var1Field: "", var1Sub: "", var2Field: "", var2Sub: "" };
        } else if (field === "descField") {
            newConfig.descSub = ""; // Reset sub-metric when main metric changes
        } else if (field === "var1Field") {
            newConfig.var1Sub = "";
        } else if (field === "var2Field") {
            newConfig.var2Sub = "";
        }

        setConfig(newConfig);
    };

    const isFormValid = () => {
        if (!config.tool) return false;
        if (config.tool === "descriptive") {
            return config.descField !== "" && config.descSub !== "";
        }
        if (config.tool === "inferential") {
            if (config.inferentialType === "chi_sq_gof") {
                // Goodness of fit only needs ONE variable
                return config.inferentialType !== "" && config.var1Field !== "" && config.var1Sub !== "";
            } else {
                // All other inferential tests need TWO variables
                return (
                    config.inferentialType !== "" &&
                    config.var1Field !== "" && config.var1Sub !== "" &&
                    config.var2Field !== "" && config.var2Sub !== ""
                );
            }
        }
        return false;
    };

        // Triggered when Var1 changes
    useEffect(() => {
        if (config.inferentialType === 'chi_sq_gof' && config.var1Field && filters?.program) {
            axios.post(route('report.categories'), { ...filters, field: config.var1Field })
                .then(res => {
                    setCategories(res.data.categories);
                    const fetchedCats = res.data.categories;
                    if (fetchedCats.length > 0) {
                        const equal = (100 / fetchedCats.length).toFixed(0);
                        const initial = {};
                        fetchedCats.forEach(cat => initial[cat] = equal);
                        setExpectedRatios(initial);
                    }
                });
        } else {
            // Reset if we switch away from GoF
            setCategories([]);
            setExpectedRatios({});
        }
    }, [config.inferentialType, config.var1Field]);

    const handleGenerate = () => {
        if (!isFormValid()) return;

        // Enrich the config with Human-Readable Labels for the PDF Report titles
        const enrichedConfig = { 
            ...config, 
            expected_ratios: config.inferentialType === 'chi_sq_gof' ? expectedRatios : null 
        };

        if (config.tool === "descriptive") {
            enrichedConfig.descFieldLabel = METRIC_OPTIONS.find(m => m.value === config.descField)?.label;
            enrichedConfig.descSubLabel = getSubOptions(config.descField).find(s => s.value === config.descSub)?.label;
        } else {
            enrichedConfig.inferentialLabel = INFERENTIAL_TYPES.find(m => m.value === config.inferentialType)?.label;
            enrichedConfig.var1FieldLabel = METRIC_OPTIONS.find(m => m.value === config.var1Field)?.label;
            enrichedConfig.var1SubLabel = getSubOptions(config.var1Field).find(s => s.value === config.var1Sub)?.label;
            
            // Only look for Var 2 labels if it's NOT a GoF test
            if (config.inferentialType !== 'chi_sq_gof') {
                enrichedConfig.var2FieldLabel = METRIC_OPTIONS.find(m => m.value === config.var2Field)?.label;
                enrichedConfig.var2SubLabel = getSubOptions(config.var2Field).find(s => s.value === config.var2Sub)?.label;
            }
        }

        closeModal();
        setTimeout(() => onGenerate(enrichedConfig), 300);
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[1000] flex items-center justify-center transition-all duration-300 ${animate ? "bg-gray-900/60 backdrop-blur-sm" : "bg-transparent backdrop-blur-none pointer-events-none"}`}>
            <div className={`bg-white rounded-2xl w-[90%] max-w-[600px] shadow-2xl relative flex flex-col transition-all duration-300 transform overflow-visible ${animate ? "scale-100 opacity-100" : "scale-95 opacity-0"} max-h-[90vh]`}>
                
                <div className="bg-[#5c297c] p-6 text-center relative rounded-t-2xl shrink-0">
                    <h2 className="text-2xl font-bold text-white tracking-wide">Statistical Tool Setup</h2>
                    <button onClick={closeModal} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
                        <i className="bi bi-x-lg text-xl"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <style>{`
                        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #5c297c; border-radius: 6px; }
                    `}</style>

                    <div className="space-y-6">
                        <CustomSelectGroup
                            label="Type of Statistical Tool:"
                            value={config.tool}
                            onChange={(e) => handleChange("tool", e.target.value)}
                            options={TOOL_OPTIONS}
                            placeholder="Select Tool Type"
                            vertical={true}
                        />

                        {/* DESCRIPTIVE SETUP */}
                        {config.tool === "descriptive" && (
                            <div className="p-5 bg-purple-50 rounded-lg border border-purple-100 space-y-4 animate-fade-in-up">
                                <h3 className="font-bold text-[#5c297c] border-b border-purple-200 pb-2 mb-4">Descriptive Analysis Setup</h3>
                                
                                <CustomSelectGroup
                                    label="Select Variable:"
                                    value={config.descField}
                                    onChange={(e) => handleChange("descField", e.target.value)}
                                    options={getFilteredMetrics()} // Filters for Numerical
                                    vertical={true}
                                />
                                
                                <CustomSelectGroup
                                    label="Specific Metric / Subject:"
                                    value={config.descSub}
                                    onChange={(e) => handleChange("descSub", e.target.value)}
                                    options={getSubOptions(config.descField)}
                                    disabled={!config.descField}
                                    vertical={true}
                                />
                            </div>
                        )}

                        {/* INFERENTIAL SETUP */}
                        {config.tool === "inferential" && (
                            <div className="space-y-6 animate-fade-in-up">
                                <CustomSelectGroup
                                    label="Specific Inferential Tool:"
                                    value={config.inferentialType}
                                    onChange={(e) => handleChange("inferentialType", e.target.value)}
                                    options={INFERENTIAL_TYPES}
                                    vertical={true}
                                />

                                {config.inferentialType && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Variable 1 */}
                                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-4">
                                            <h4 className="font-bold text-blue-800 text-sm border-b border-blue-200 pb-1">Variable 1 (X)</h4>
                                            <CustomSelectGroup
                                                label="Metric Category:"
                                                value={config.var1Field}
                                                onChange={(e) => handleChange("var1Field", e.target.value)}
                                                options={getFilteredMetrics(1)} // Pass 1 for Var 1 logic
                                                vertical={true}
                                            />
                                            <CustomSelectGroup
                                                label="Specific Subject:"
                                                value={config.var1Sub}
                                                onChange={(e) => handleChange("var1Sub", e.target.value)}
                                                options={getSubOptions(config.var1Field)}
                                                disabled={!config.var1Field}
                                                vertical={true}
                                            />
                                        </div>

                                        {config.inferentialType === 'chi_sq_gof' && categories.length > 0 && (
                                            <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                                                <h4 className="text-sm font-bold text-purple-900 mb-3">Target Distribution (%)</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {categories.map(cat => (
                                                        <div key={cat}>
                                                            <label className="text-xs font-semibold text-gray-600 block mb-1 uppercase">{cat}</label>
                                                            <div className="relative">
                                                                <input 
                                                                    type="number" 
                                                                    value={expectedRatios[cat]}
                                                                    onChange={(e) => setExpectedRatios({...expectedRatios, [cat]: e.target.value})}
                                                                    className="w-full p-2 pr-8 border rounded-lg focus:ring-2 focus:ring-purple-400"
                                                                />
                                                                <span className="absolute right-3 top-2 text-gray-400">%</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-3 text-[10px] text-purple-600 italic">
                                                    Total: {Object.values(expectedRatios).reduce((a, b) => Number(a) + Number(b), 0)}% (Should equal 100)
                                                </div>
                                            </div>
                                        )}

                                        {/* Variable 2 */}
                                        {config.inferentialType !== "chi_sq_gof" && (
                                        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 space-y-4">
                                            <h4 className="font-bold text-emerald-800 text-sm border-b border-emerald-200 pb-1">Variable 2 (Y)</h4>
                                            <CustomSelectGroup
                                                label="Metric Category:"
                                                value={config.var2Field}
                                                onChange={(e) => handleChange("var2Field", e.target.value)}
                                                options={getFilteredMetrics(2)} // Pass 2 for Var 2 logic
                                                vertical={true}
                                            />
                                            <CustomSelectGroup
                                                label="Specific Subject:"
                                                value={config.var2Sub}
                                                onChange={(e) => handleChange("var2Sub", e.target.value)}
                                                options={getSubOptions(config.var2Field)}
                                                disabled={!config.var2Field}
                                                vertical={true}
                                            />
                                        </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-center gap-4 p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl shrink-0">
                    <button onClick={closeModal} className="w-[120px] py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-[5px] hover:bg-gray-100 transition-all shadow-sm">
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={!isFormValid()}
                        className={`w-[160px] py-2.5 text-sm font-bold text-white rounded-[5px] shadow-md transition-all
                            ${!isFormValid() ? "bg-gray-400 cursor-not-allowed opacity-70" : "bg-[#5c297c] hover:bg-[#4a1f63]"}`}
                    >
                        Process Data
                    </button>
                </div>
            </div>
        </div>
    );
}