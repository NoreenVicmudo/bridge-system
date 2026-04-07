import React, { useState, useMemo, useEffect } from "react";
import { useForm, usePage } from "@inertiajs/react";
import DataEntryLayout from "@/Layouts/DataEntryLayout";
import CustomSelectGroup from "@/Components/SelectGroup";
import TextInput from "@/Components/TextInput";
import ConfirmSaveModal from "@/Components/Modals/ConfirmSaveModal";

export default function StudentInformationEntry({ initialData }) {
    const { auth = {} } = usePage().props;
    const user = auth?.user || {};

    // Determine specific access based on the user's database footprint
    const isSuperAdmin = !user.college_id && !user.program_id;
    const isDean = !!user.college_id && !user.program_id;

    const [isModalOpen, setIsModalOpen] = useState(false);

    // 1. Filter the main selection dropdown based on access
    const activeMetricOptions = useMemo(() => {
        const options = [];
        
        // Only Super Admins can see/edit Socioeconomic and College
        if (isSuperAdmin) {
            options.push({ value: "SocioeconomicStatus", label: "Socioeconomic Status" });
            options.push({ value: "College", label: "College" });
        }

        // Super Admins and Deans can see Programs
        if (isSuperAdmin || isDean) {
            options.push({ value: "Program", label: "Program" });
        }

        // Everyone can access the standard lookups
        options.push({ value: "CurrentLivingArrangement", label: "Living Arrangement" });
        options.push({ value: "LanguageSpoken", label: "Language Spoken" });

        return options;
    }, [isSuperAdmin, isDean]);

    // 2. Map database props to dropdown options, enforcing Dean restrictions
    const subMetrics = useMemo(() => ({
        College: [
            { value: "add", label: "+ Add New College" },
            ...(initialData?.Colleges || []).map(c => ({ value: c.college_id, label: c.name }))
        ],
        Program: [
            { value: "add", label: "+ Add New Program" },
            ...(initialData?.Programs || [])
                .filter(p => isSuperAdmin || p.college_id == user.college_id) // Dean restriction
                .map(p => ({ value: p.program_id, label: p.name }))
        ],
        CurrentLivingArrangement: [
            { value: "add", label: "+ Add New Arrangement" },
            ...(initialData?.LivingArrangements || []).map(l => ({ value: l.id, label: l.name }))
        ],
        LanguageSpoken: [
            { value: "add", label: "+ Add New Language" },
            ...(initialData?.Languages || []).map(lang => ({ value: lang.id, label: lang.name }))
        ],
    }), [initialData, isSuperAdmin, user.college_id]);

    const { data, setData, post, processing } = useForm({
        metric: "",
        sub_metric: "",
        detail_name: "",
        college_id: "", // Used specifically for Super Admins adding Programs
        is_hidden: false,
        ranges: {
            rich_min: "", high_min: "", high_max: "",
            upper_min: "", upper_max: "", mid_min: "", mid_max: "",
            lower_mid_min: "", lower_mid_max: "", low_min: "", low_max: "",
            poor_max: "",
        },
    });

    // 3. Validation Rules
    const isFormValid = () => {
        if (!data.metric) return false;
        if (data.metric === "SocioeconomicStatus") {
            return Object.values(data.ranges).some((val) => val !== "");
        }
        
        // If Super Admin is adding a new Program, force them to select a parent College
        if (data.metric === "Program" && data.sub_metric === "add" && isSuperAdmin) {
            if (!data.college_id) return false;
        }

        return data.sub_metric !== "" && data.detail_name.trim() !== "";
    };

    // 4. Auto-Fill Logic when selecting existing items
    useEffect(() => {
        if (data.sub_metric && data.sub_metric !== "add") {
            const selectedOption = subMetrics[data.metric]?.find(opt => String(opt.value) === String(data.sub_metric));
            if (selectedOption) {
                setData("detail_name", selectedOption.label);
                
                // If editing a Program as SuperAdmin, auto-select its current College
                if (data.metric === "Program" && isSuperAdmin) {
                    const program = initialData?.Programs?.find(p => String(p.program_id) === String(data.sub_metric));
                    if (program) setData("college_id", program.college_id || "");
                }
            }
        } else {
            setData("detail_name", "");
            setData("college_id", "");
        }
    }, [data.sub_metric, data.metric]);

    // 5. Pre-fill Socioeconomic ranges if data exists
    useEffect(() => {
        if (data.metric === "SocioeconomicStatus" && initialData?.SocioeconomicStatus?.length > 0) {
            const ranges = { ...data.ranges };
            initialData.SocioeconomicStatus.forEach(status => {
                if (status.status === 'Rich') ranges.rich_min = status.minimum || "";
                if (status.status === 'High Income') { ranges.high_min = status.minimum || ""; ranges.high_max = status.maximum || ""; }
                if (status.status === 'Upper Middle') { ranges.upper_min = status.minimum || ""; ranges.upper_max = status.maximum || ""; }
                if (status.status === 'Middle Class') { ranges.mid_min = status.minimum || ""; ranges.mid_max = status.maximum || ""; }
                if (status.status === 'Lower Middle') { ranges.lower_mid_min = status.minimum || ""; ranges.lower_mid_max = status.maximum || ""; }
                if (status.status === 'Low Income') { ranges.low_min = status.minimum || ""; ranges.low_max = status.maximum || ""; }
                if (status.status === 'Poor') ranges.poor_max = status.maximum || "";
            });
            setData("ranges", ranges);
        }
    }, [data.metric, initialData]);

    const handleSubmit = () => {
        post(route("student-info-entry.store"), {
            onSuccess: () => setIsModalOpen(false),
        });
    };

    return (
        <DataEntryLayout title="Student Info Entry">
            <div className="max-w-2xl mx-auto">
                <form className="bg-white p-6 rounded-xl border border-purple-100 shadow-sm space-y-6">
                    {/* 1. Metric Selection */}
                    <CustomSelectGroup
                        label="Select Field:"
                        value={data.metric}
                        onChange={(e) => {
                            setData("metric", e.target.value);
                            setData("sub_metric", "");
                            setData("college_id", "");
                        }}
                        options={activeMetricOptions}
                        placeholder="Select Field"
                        vertical={true}
                    />

                    {/* 2A. Standard Entry (College, Program, Living, Language) */}
                    {data.metric && data.metric !== "SocioeconomicStatus" && (
                        <div className="space-y-5 animate-fade-in-up border-t border-gray-100 pt-5">
                            <CustomSelectGroup
                                label={`Select ${data.metric.replace(/([A-Z])/g, " $1").trim()}:`}
                                value={data.sub_metric}
                                onChange={(e) => setData("sub_metric", e.target.value)}
                                options={subMetrics[data.metric] || []}
                                placeholder="Select Option"
                                vertical={true}
                            />

                            {/* Extra requirement for Super Admins adding/editing Programs */}
                            {data.metric === "Program" && isSuperAdmin && (
                                <CustomSelectGroup
                                    label="Parent College:"
                                    value={data.college_id}
                                    onChange={(e) => setData("college_id", e.target.value)}
                                    options={(initialData?.Colleges || []).map(c => ({ value: c.college_id, label: c.name }))}
                                    placeholder="Assign to College"
                                    vertical={true}
                                />
                            )}

                            <div className="flex flex-col gap-2">
                                <label className="font-bold text-sm text-[#5c297c]">
                                    Additional Details:
                                </label>
                                <div className="flex flex-col md:flex-row gap-3 items-center">
                                    <TextInput
                                        type="text"
                                        placeholder="Enter detail here"
                                        value={data.detail_name}
                                        onChange={(e) => setData("detail_name", e.target.value)}
                                        className="w-full"
                                    />
                                    <label className="flex items-center gap-2 text-sm font-bold text-[#5c297c] whitespace-nowrap bg-purple-50 px-4 py-2.5 rounded-lg border border-purple-100 cursor-pointer hover:bg-purple-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-[#5c297c] focus:ring-[#ffb736] border-gray-300 rounded cursor-pointer"
                                            checked={data.is_hidden}
                                            onChange={(e) => setData("is_hidden", e.target.checked)}
                                        />
                                        Hide from System
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2B. Socioeconomic Status Ranges */}
                    {data.metric === "SocioeconomicStatus" && (
                        <div className="animate-fade-in-up border-t border-gray-100 pt-5 text-[#5c297c]">
                            <h3 className="text-sm font-bold mb-4 uppercase tracking-widest opacity-70">
                                Update Income Ranges
                            </h3>
                            <div className="grid grid-cols-1 gap-3 bg-slate-50 p-4 rounded-xl border border-gray-200">
                                <div className="flex items-center justify-between gap-4 bg-white p-2 rounded-lg shadow-sm">
                                    <label className="font-bold text-sm w-32">Rich:</label>
                                    <div className="flex items-center gap-2 flex-1">
                                        <TextInput
                                            type="number"
                                            placeholder="Min"
                                            value={data.ranges.rich_min}
                                            onChange={(e) => setData("ranges", { ...data.ranges, rich_min: e.target.value })}
                                            className="w-full text-right"
                                        />
                                        <span className="text-sm font-medium whitespace-nowrap w-20">and above</span>
                                    </div>
                                </div>

                                {/* Helper loop for min/max ranges */}
                                {[
                                    { id: "high", label: "High Income" },
                                    { id: "upper", label: "Upper Middle" },
                                    { id: "mid", label: "Middle Class" },
                                    { id: "lower_mid", label: "Lower Middle" },
                                    { id: "low", label: "Low Income" },
                                ].map((range) => (
                                    <div key={range.id} className="flex items-center justify-between gap-4 bg-white p-2 rounded-lg shadow-sm">
                                        <label className="font-bold text-sm w-32">{range.label}:</label>
                                        <div className="flex items-center gap-2 flex-1">
                                            <TextInput
                                                type="number"
                                                placeholder="Min"
                                                value={data.ranges[`${range.id}_min`]}
                                                onChange={(e) => setData("ranges", { ...data.ranges, [`${range.id}_min`]: e.target.value })}
                                                className="w-full text-right"
                                            />
                                            <span className="text-sm font-bold text-gray-400">to</span>
                                            <TextInput
                                                type="number"
                                                placeholder="Max"
                                                value={data.ranges[`${range.id}_max`]}
                                                onChange={(e) => setData("ranges", { ...data.ranges, [`${range.id}_max`]: e.target.value })}
                                                className="w-full text-right"
                                            />
                                        </div>
                                    </div>
                                ))}

                                <div className="flex items-center justify-between gap-4 bg-white p-2 rounded-lg shadow-sm">
                                    <label className="font-bold text-sm w-32">Poor:</label>
                                    <div className="flex items-center gap-2 flex-1">
                                        <span className="text-sm font-medium w-12">Below</span>
                                        <TextInput
                                            type="number"
                                            placeholder="Max"
                                            value={data.ranges.poor_max}
                                            onChange={(e) => setData("ranges", { ...data.ranges, poor_max: e.target.value })}
                                            className="w-full text-right"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-center pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            disabled={!isFormValid() || processing}
                            className={`px-10 py-3 font-bold text-white rounded-lg transition-all shadow-md
                                ${!isFormValid() ? "bg-gray-300 cursor-not-allowed" : "bg-[#5c297c] hover:bg-[#ffb736]"}`}
                        >
                            Save Configuration
                        </button>
                    </div>
                </form>
            </div>

            <ConfirmSaveModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleSubmit}
                title="Update Student Information"
                message="Are you sure you want to save these changes to the system metrics?"
            />
        </DataEntryLayout>
    );
}