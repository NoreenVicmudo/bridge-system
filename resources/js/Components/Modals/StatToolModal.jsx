import React, { useState, useEffect } from "react";
import CustomSelectGroup from "@/Components/SelectGroup";
import axios from 'axios';

export default function StatToolModal({ 
    isOpen, 
    onClose, 
    onGenerate, 
    subMetricMap = {}, 
    filters 
}) {
    const [animate, setAnimate] = useState(false);
    const [categories, setCategories] = useState([]);
    const [expectedRatios, setExpectedRatios] = useState({});
    
    // 🧠 NEW: Dynamic Years State
    const [dynamicYears, setDynamicYears] = useState([]);

    const [config, setConfig] = useState({
        tool: "",
        inferentialType: "",
        descField: "",
        descSub: "",
        var1Field: "",
        var1Sub: "",
        var2Field: "",
        var2Sub: "",
        
        tTestMetric: "",
        tTestSub: "",
        groupBStart: "",
        groupBEnd: "",
        period1: "Pre-Test",
        period2: "Post-Test",

        indTestMode: "categories"
    });

    useEffect(() => {
        if (isOpen) setAnimate(true);
        else setAnimate(false);
    }, [isOpen]);

    // 🧠 DYNAMIC YEAR FETCHER
    useEffect(() => {
        if (isOpen && filters?.program) {
            axios.get(route('program.filter-options'))
                .then(res => {
                    if (res.data.combinations) {
                        // Filter the combinations to only match the currently selected program
                        const programCombos = res.data.combinations.filter(
                            c => c.program_id == filters.program
                        );
                        // Extract unique years and sort them
                        const years = [...new Set(programCombos.map(c => c.year))].sort((a, b) => a - b);
                        
                        setDynamicYears(years.map(y => ({ value: y.toString(), label: y.toString() })));
                    }
                })
                .catch(err => console.error("Failed to fetch year options", err));
        }
    }, [isOpen, filters]);

    // 🧠 Set default Group B batch to the year before Group A (if available)
    useEffect(() => {
        if (filters?.year_start) {
            const prevYear = (parseInt(filters.year_start) - 1).toString();
            setConfig(prev => ({
                ...prev,
                groupBStart: prevYear,
                groupBEnd: prevYear,
            }));
        }
    }, [filters]);

    const closeModal = () => {
        setAnimate(false);
        setTimeout(onClose, 300);
    };

    // --- STATIC OPTIONS ---
    const currentYear = new Date().getFullYear();
    const fallbackYears = Array.from({ length: 16 }, (_, i) => ({ value: (currentYear - 10 + i).toString(), label: (currentYear - 10 + i).toString() }));
    
    // Use dynamic years if available, otherwise fallback
    const yearOptions = dynamicYears.length > 0 ? dynamicYears : fallbackYears;

    const EXAM_PERIODS = [
        { value: "Default", label: "Default" },
        { value: "Diagnostic", label: "Diagnostic" },
        { value: "Pre-Test", label: "Pre-Test" },
        { value: "Midterm", label: "Midterm" },
        { value: "Post-Test", label: "Post-Test" }
    ];

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
        // --- Existing Categorical Demographics ---
        { value: "Gender", label: "Gender (Male/Female)", type: "categorical", hasSub: false },
        { value: "WorkStatus", label: "Work Status", type: "categorical", hasSub: false },
        
        // 🧠 NEW: ADDED CATEGORICAL DEMOGRAPHICS
        { value: "LivingArrangement", label: "Living Arrangement", type: "categorical", hasSub: false },
        { value: "Scholarship", label: "Scholarship Status", type: "categorical", hasSub: false },
        { value: "Language", label: "Language Spoken", type: "categorical", hasSub: false },
        { value: "LastSchool", label: "Last School Attended", type: "categorical", hasSub: false },
        
        // --- Existing Numerical Demographics ---
        { value: "Age", label: "Age", type: "numerical", hasSub: false },
        { value: "Socioeconomic", label: "Socioeconomic Status", type: "numerical", hasSub: false },
        
        // --- Existing Academic / Program Metrics ---
        { value: "GWA", label: "General Weighted Average (GWA)", type: "numerical", hasSub: true },
        { value: "BoardGrades", label: "Grades in Board Subjects", type: "numerical", hasSub: true },
        { value: "MockScores", label: "Mock Board Exam Scores", type: "numerical", hasSub: true },
        { value: "PerformanceRating", label: "Performance Rating", type: "numerical", hasSub: true },
        { value: "SimExam", label: "Simulation Exam Results", type: "numerical", hasSub: true },
        { value: "Attendance", label: "Review Attendance", type: "numerical", hasSub: false },
        { value: "Retakes", label: "Back Subjects / Retakes", type: "numerical", hasSub: false },
        
        // --- Output Variable ---
        { value: "Licensure", label: "Licensure Exam Result", type: "categorical", hasSub: false },
    ];

    const getFilteredMetrics = (variableNum = 1) => {
        const type = config.inferentialType;

        if (config.tool === "descriptive") return METRIC_OPTIONS.filter(m => m.type === "numerical");
        
        // 🧠 REMOVED ttest_dep from this list
        if (type === "pearson" || type === "regression") return METRIC_OPTIONS.filter(m => m.type === "numerical");
        
        // 🧠 ADDED: Strict restriction for Dependent T-Test
        if (type === "ttest_dep") {
            return METRIC_OPTIONS.filter(m => m.value === "MockScores" || m.value === "SimExam");
        }

        if (type === "chi_sq_gof" || type === "chi_sq_toi") return METRIC_OPTIONS.filter(m => m.type === "categorical");
        
        if (type === "ttest_ind") {
            if (config.indTestMode === "categories") {
                return variableNum === 1 
                    ? METRIC_OPTIONS.filter(m => m.type === "categorical")
                    : METRIC_OPTIONS.filter(m => m.type === "numerical");
            } else {
                return METRIC_OPTIONS.filter(m => m.type === "numerical");
            }
        }
        return METRIC_OPTIONS;
    };

    const getSubOptions = (metricKey) => {
        if (!metricKey) return [];
        const metricLabel = METRIC_OPTIONS.find(m => m.value === metricKey)?.label || metricKey;
        const overallOption = { value: "overall", label: `Overall ${metricLabel}` };
        if (subMetricMap[metricKey] && subMetricMap[metricKey].length > 0) return [overallOption, ...subMetricMap[metricKey]];
        return [overallOption];
    };

    const handleChange = (field, value) => {
        let newConfig = { ...config, [field]: value };

        if (field === "tool") {
            newConfig = { ...newConfig, inferentialType: "", descField: "", descSub: "", var1Field: "", var1Sub: "", var2Field: "", var2Sub: "", tTestMetric: "", tTestSub: "" };
        } else if (field === "inferentialType") {
            newConfig = { ...newConfig, var1Field: "", var1Sub: "", var2Field: "", var2Sub: "", tTestMetric: "", tTestSub: "", indTestMode: "categories" };
        } else if (field === "indTestMode") {
            newConfig = { ...newConfig, var1Field: "", var2Field: "", tTestMetric: "" };
        } else if (field === "groupBStart") {
            // 🧠 VALIDATION: If new start year is greater than current end year, auto-adjust end year
            if (parseInt(value) > parseInt(newConfig.groupBEnd)) {
                newConfig.groupBEnd = value;
            }
        } else if (field === "descField") newConfig.descSub = "";
        else if (field === "var1Field") newConfig.var1Sub = "";
        else if (field === "var2Field") newConfig.var2Sub = "";
        else if (field === "tTestMetric") newConfig.tTestSub = "";

        setConfig(newConfig);
    };

    const isFormValid = () => {
        if (!config.tool) return false;
        if (config.tool === "descriptive") return config.descField !== "";
        
        if (config.tool === "inferential") {
            if (config.inferentialType === "chi_sq_gof") {
                const total = Object.values(expectedRatios).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
                return config.var1Field !== "" && Math.abs(total - 100) < 0.01;
            } else if (config.inferentialType === "ttest_ind") {
                if (config.indTestMode === "batches") return config.tTestMetric !== "";
                else return config.var1Field !== "" && config.var2Field !== "";
            } else if (config.inferentialType === "ttest_dep") {
                return config.tTestMetric !== "" && config.period1 !== config.period2;
            } else {
                return config.var1Field !== "" && config.var2Field !== "";
            }
        }
        return false;
    };

    // Chi-Square Category Fetcher
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
            setCategories([]);
            setExpectedRatios({});
        }
    }, [config.inferentialType, config.var1Field]);

    const handleGenerate = () => {
        if (!isFormValid()) return;

        const enrichedConfig = { 
            ...config, 
            expected_ratios: config.inferentialType === 'chi_sq_gof' ? expectedRatios : null 
        };

        if (config.tool === "descriptive") {
            enrichedConfig.descFieldLabel = METRIC_OPTIONS.find(m => m.value === config.descField)?.label;
            enrichedConfig.descSubLabel = getSubOptions(config.descField).find(s => s.value === config.descSub)?.label;
        } else if (config.inferentialType === "ttest_ind" || config.inferentialType === "ttest_dep") {
            enrichedConfig.inferentialLabel = INFERENTIAL_TYPES.find(m => m.value === config.inferentialType)?.label;

            if (config.inferentialType === "ttest_ind") {
                enrichedConfig.test_type = 'independent';
                enrichedConfig.independent_mode = config.indTestMode; 

                if (config.indTestMode === "batches") {
                    enrichedConfig.metric = config.tTestMetric;
                    enrichedConfig.sub_metric = config.tTestSub;
                    enrichedConfig.group_a_start = filters.year_start;
                    enrichedConfig.group_a_end = filters.year_end;
                    enrichedConfig.group_b_start = config.groupBStart;
                    enrichedConfig.group_b_end = config.groupBEnd;
                    enrichedConfig.var1FieldLabel = METRIC_OPTIONS.find(m => m.value === config.tTestMetric)?.label;
                } else {
                    enrichedConfig.var1FieldLabel = METRIC_OPTIONS.find(m => m.value === config.var1Field)?.label;
                    enrichedConfig.var2FieldLabel = METRIC_OPTIONS.find(m => m.value === config.var2Field)?.label;
                }
            } else {
                // --- DEPENDENT T-TEST PAYLOAD ---
                enrichedConfig.test_type = 'dependent';
                enrichedConfig.metric = config.tTestMetric;
                enrichedConfig.sub_metric = config.tTestSub;
                enrichedConfig.batch_start = filters.year_start;
                enrichedConfig.batch_end = filters.year_end;
                
                // 🧠 ADDED THESE TWO LINES TO FIX THE 500 ERROR:
                enrichedConfig.period_1 = config.period1;
                enrichedConfig.period_2 = config.period2;
                
                enrichedConfig.var1FieldLabel = METRIC_OPTIONS.find(m => m.value === config.tTestMetric)?.label;
            }
        } else {
            enrichedConfig.inferentialLabel = INFERENTIAL_TYPES.find(m => m.value === config.inferentialType)?.label;
            enrichedConfig.var1FieldLabel = METRIC_OPTIONS.find(m => m.value === config.var1Field)?.label;
            if (config.inferentialType !== 'chi_sq_gof') {
                enrichedConfig.var2FieldLabel = METRIC_OPTIONS.find(m => m.value === config.var2Field)?.label;
            }
        }

        closeModal();
        setTimeout(() => onGenerate(enrichedConfig), 300);
    };

    if (!isOpen) return null;

    const currentGoFTotal = Object.values(expectedRatios).reduce((a, b) => Number(a) + Number(b), 0);

    return (
        <div className={`fixed inset-0 z-[1000] flex items-center justify-center transition-all duration-300 ${animate ? "bg-gray-900/60 backdrop-blur-sm" : "bg-transparent backdrop-blur-none pointer-events-none"}`}>
            <div className={`bg-white rounded-2xl w-[90%] max-w-[600px] shadow-2xl relative flex flex-col transition-all duration-300 transform overflow-visible ${animate ? "scale-100 opacity-100" : "scale-95 opacity-0"} max-h-[90vh]`}>
                
                {/* HEADER */}
                <div className="bg-[#5c297c] p-6 text-center relative rounded-t-2xl shrink-0 z-20 shadow-sm">
                    <h2 className="text-2xl font-bold text-white tracking-wide">Statistical Tool Setup</h2>
                    <button onClick={closeModal} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
                        <i className="bi bi-x-lg text-xl"></i>
                    </button>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10 pb-24">
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
                                <h3 className="font-bold text-[#5c297c] border-b border-purple-200 pb-2 mb-4 text-center">Descriptive Analysis Setup</h3>
                                <CustomSelectGroup
                                    label="Select Variable:" value={config.descField}
                                    onChange={(e) => handleChange("descField", e.target.value)}
                                    options={getFilteredMetrics()} vertical={true}
                                />
                                <CustomSelectGroup
                                    label="Specific Metric / Subject:" value={config.descSub}
                                    onChange={(e) => handleChange("descSub", e.target.value)}
                                    options={getSubOptions(config.descField)} disabled={!config.descField} vertical={true}
                                />
                            </div>
                        )}

                        {/* INFERENTIAL SETUP */}
                        {config.tool === "inferential" && (
                            <div className="space-y-6 animate-fade-in-up">
                                <CustomSelectGroup
                                    label="Specific Inferential Tool:" value={config.inferentialType}
                                    onChange={(e) => handleChange("inferentialType", e.target.value)}
                                    options={INFERENTIAL_TYPES} vertical={true}
                                />

                                {/* 🧠 INDEPENDENT T-TEST UI */}
                                {config.inferentialType === "ttest_ind" && (
                                    <div className="space-y-4 p-5 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
                                        <div className="flex flex-col border-b border-blue-200 pb-3 mb-3">
                                            <h4 className="font-bold text-blue-900 text-center mb-3">Independent T-Test Configuration</h4>
                                            
                                            {/* MODE TOGGLE */}
                                            <div className="flex bg-white rounded-lg border border-blue-200 p-1 shadow-sm w-full mx-auto">
                                                <button 
                                                    onClick={() => handleChange("indTestMode", "categories")}
                                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${config.indTestMode === 'categories' ? 'bg-[#5c297c] text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
                                                >
                                                    Compare Categories
                                                </button>
                                                <button 
                                                    onClick={() => handleChange("indTestMode", "batches")}
                                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${config.indTestMode === 'batches' ? 'bg-[#5c297c] text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
                                                >
                                                    Compare Batches
                                                </button>
                                            </div>
                                        </div>

                                        {config.indTestMode === "categories" && (
                                            <div className="space-y-4 animate-fade-in">
                                                {/* 🧠 FIXED: Display correct filters.year_start and year_end */}
                                                <p className="text-xs text-blue-700 italic text-center mb-4">Targeting Batches {filters?.year_start} - {filters?.year_end}. Select a category and a metric.</p>
                                                <CustomSelectGroup
                                                    label="Grouping Variable (e.g., Gender):" value={config.var1Field}
                                                    onChange={(e) => handleChange("var1Field", e.target.value)}
                                                    options={getFilteredMetrics(1)} vertical={true}
                                                />
                                                <div className="pt-3 border-t border-blue-100/50">
                                                    <CustomSelectGroup
                                                        label="Score / Metric to Compare:" value={config.var2Field}
                                                        onChange={(e) => handleChange("var2Field", e.target.value)}
                                                        options={getFilteredMetrics(2)} vertical={true}
                                                    />
                                                    <CustomSelectGroup
                                                        label="Specific Subject:" value={config.var2Sub}
                                                        onChange={(e) => handleChange("var2Sub", e.target.value)}
                                                        options={getSubOptions(config.var2Field)} disabled={!config.var2Field} vertical={true}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {config.indTestMode === "batches" && (
                                            <div className="space-y-4 animate-fade-in">
                                                {/* 🧠 FIXED: Display correct filters.year_start and year_end */}
                                                <p className="text-xs text-blue-700 italic text-center mb-4">Group A is Batch {filters?.year_start} - {filters?.year_end}. Select Group B.</p>
                                                
                                                <div className="grid grid-cols-2 gap-4 mb-4 bg-white p-3 rounded-lg border border-blue-50">
                                                    <CustomSelectGroup
                                                        label="Group B Start:" value={config.groupBStart}
                                                        onChange={(e) => handleChange("groupBStart", e.target.value)}
                                                        options={yearOptions} vertical={true}
                                                    />
                                                    <CustomSelectGroup
                                                        label="Group B End:" value={config.groupBEnd}
                                                        onChange={(e) => handleChange("groupBEnd", e.target.value)}
                                                        /* 🧠 VALIDATION: Filter to only show years >= Group B Start */
                                                        options={yearOptions.filter(y => parseInt(y.value) >= parseInt(config.groupBStart || 0))} 
                                                        vertical={true}
                                                    />
                                                </div>

                                                <div className="pt-3 border-t border-blue-100/50">
                                                    <CustomSelectGroup
                                                        label="Target Metric (Score):" value={config.tTestMetric}
                                                        onChange={(e) => handleChange("tTestMetric", e.target.value)}
                                                        options={getFilteredMetrics(2)} vertical={true}
                                                    />
                                                    <CustomSelectGroup
                                                        label="Specific Subject:" value={config.tTestSub}
                                                        onChange={(e) => handleChange("tTestSub", e.target.value)}
                                                        options={getSubOptions(config.tTestMetric)} disabled={!config.tTestMetric} vertical={true}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 🧠 DEPENDENT T-TEST UI */}
                                {config.inferentialType === "ttest_dep" && (
                                    <div className="space-y-4 p-5 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
                                        <h4 className="font-bold text-blue-900 text-center border-b border-blue-200 pb-3 mb-4">Dependent T-Test Configuration</h4>
                                        {/* 🧠 FIXED: Display correct filters.year_start and year_end */}
                                        <p className="text-xs text-blue-700 italic text-center mb-4">Targeting Batch {filters?.year_start} - {filters?.year_end}. Select periods to compare.</p>
                                        
                                        <CustomSelectGroup
                                            label="Target Metric (Score):" value={config.tTestMetric}
                                            onChange={(e) => handleChange("tTestMetric", e.target.value)}
                                            options={getFilteredMetrics(2)} vertical={true}
                                        />
                                        <CustomSelectGroup
                                            label="Specific Subject:" value={config.tTestSub}
                                            onChange={(e) => handleChange("tTestSub", e.target.value)}
                                            options={getSubOptions(config.tTestMetric)} disabled={!config.tTestMetric} vertical={true}
                                        />

                                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-blue-200">
                                            <CustomSelectGroup
                                                label="Period 1 (Baseline):" value={config.period1}
                                                onChange={(e) => handleChange("period1", e.target.value)}
                                                options={EXAM_PERIODS} vertical={true}
                                            />
                                            <CustomSelectGroup
                                                label="Period 2 (Comparison):" value={config.period2}
                                                onChange={(e) => handleChange("period2", e.target.value)}
                                                options={EXAM_PERIODS} vertical={true}
                                            />
                                        </div>
                                        {config.period1 === config.period2 && <p className="text-red-500 text-xs font-bold text-center mt-2 animate-pulse">Periods must be different.</p>}
                                    </div>
                                )}

                                {/* STANDARD INFERENTIAL UI (Pearson, Regression, Chi-Sq) */}
                                {config.inferentialType && config.inferentialType !== "ttest_ind" && config.inferentialType !== "ttest_dep" && (
                                    <div className="space-y-6">
                                        <div className={`grid grid-cols-1 ${config.inferentialType === 'chi_sq_gof' ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-4`}>
                                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 shadow-sm space-y-4">
                                                <h4 className="font-bold text-blue-900 text-sm border-b border-blue-200 pb-2 text-center">Variable 1 (X)</h4>
                                                <CustomSelectGroup
                                                    label="Metric Category:" value={config.var1Field}
                                                    onChange={(e) => handleChange("var1Field", e.target.value)}
                                                    options={getFilteredMetrics(1)} vertical={true}
                                                />
                                                <CustomSelectGroup
                                                    label="Specific Subject:" value={config.var1Sub}
                                                    onChange={(e) => handleChange("var1Sub", e.target.value)}
                                                    options={getSubOptions(config.var1Field)} disabled={!config.var1Field} vertical={true}
                                                />
                                            </div>

                                            {config.inferentialType !== "chi_sq_gof" && (
                                            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm space-y-4">
                                                <h4 className="font-bold text-emerald-900 text-sm border-b border-emerald-200 pb-2 text-center">Variable 2 (Y)</h4>
                                                <CustomSelectGroup
                                                    label="Metric Category:" value={config.var2Field}
                                                    onChange={(e) => handleChange("var2Field", e.target.value)}
                                                    options={getFilteredMetrics(2)} vertical={true}
                                                />
                                                <CustomSelectGroup
                                                    label="Specific Subject:" value={config.var2Sub}
                                                    onChange={(e) => handleChange("var2Sub", e.target.value)}
                                                    options={getSubOptions(config.var2Field)} disabled={!config.var2Field} vertical={true}
                                                />
                                            </div>
                                            )}
                                        </div>

                                        {/* CHI-SQUARE GOF */}
                                        {config.inferentialType === 'chi_sq_gof' && categories.length > 0 && (
                                            <div className="p-5 bg-purple-50 rounded-xl border border-purple-200 shadow-sm animate-fade-in-up">
                                                <h4 className="text-sm font-bold text-[#5c297c] mb-4 text-center uppercase tracking-wide">Target Distribution (%)</h4>
                                                
                                                <div className="flex flex-wrap justify-center gap-4">
                                                    {categories.map(cat => (
                                                        <div key={cat} className="w-full sm:w-[140px] text-center bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                                                            <label className="text-xs font-bold text-gray-700 block mb-2 truncate" title={cat}>{cat}</label>
                                                            <div className="relative inline-block w-full">
                                                                <input 
                                                                    type="number" value={expectedRatios[cat] || ""}
                                                                    onChange={(e) => setExpectedRatios({...expectedRatios, [cat]: e.target.value})}
                                                                    className="w-full p-2.5 pr-6 text-center text-sm font-bold text-[#5c297c] border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ffb736] focus:border-[#ffb736] transition-all"
                                                                />
                                                                <span className="absolute right-3 top-2.5 text-gray-400 text-xs font-bold">%</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                <div className={`mt-5 text-xs font-bold text-center pt-3 border-t ${currentGoFTotal === 100 ? 'text-green-600 border-green-200' : 'text-red-500 border-red-200'}`}>
                                                    Total: {currentGoFTotal}% (Must equal 100%)
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* FOOTER */}
                <div className="flex justify-center gap-4 p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl shrink-0 relative z-0">
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