import React, { useState, useMemo, useEffect } from "react";
import { useForm, usePage } from "@inertiajs/react";
import DataEntryLayout from "@/Layouts/DataEntryLayout";
import CustomSelectGroup from "@/Components/SelectGroup";
import TextInput from "@/Components/TextInput";
import ConfirmSaveModal from "@/Components/Modals/ConfirmSaveModal";

export default function ProgramMetricsEntry({ initialData }) {
    const { auth } = usePage().props;
    const user = auth.user || {};

    const isCollegeRestricted = !!user.college_id;
    const isProgramRestricted = !!user.program_id;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCollege, setSelectedCollege] = useState(user.college_id || "");
    const [selectedProgram, setSelectedProgram] = useState(user.program_id || "");

    const { data, setData, post, processing } = useForm({
        metric: "",
        sub_metric: "",
        detail_name: "",
        program_id: user.program_id || "", 
        is_hidden: false,
    });

    const filteredPrograms = useMemo(() => {
        if (!selectedCollege) return [];
        return (initialData?.Programs || []).filter(p => p.college_id == selectedCollege);
    }, [selectedCollege, initialData]);

    const subMetrics = useMemo(() => {
        if (!selectedProgram || !data.metric) return [];
        
        const items = initialData[data.metric] || [];
        const filteredItems = items.filter(item => item.program_id == selectedProgram);

        return [
            { value: "add", label: "+ Add New Mock Subject" },
            ...filteredItems.map(m => ({ value: m.mock_subject_id, label: m.mock_subject_name }))
        ];
    }, [selectedProgram, data.metric, initialData]);

    // Auto-Fill Logic when selecting existing items
    useEffect(() => {
        if (data.sub_metric && data.sub_metric !== "add") {
            const selectedOption = subMetrics.find(opt => String(opt.value) === String(data.sub_metric));
            if (selectedOption) setData("detail_name", selectedOption.label);

            // 🧠 Find the original DB item to get its is_active status
            const items = initialData[data.metric] || [];
            const originalItem = items.find(item => String(item.mock_subject_id) === String(data.sub_metric));
            
            if (originalItem && originalItem.is_active !== undefined) {
                setData("is_hidden", !originalItem.is_active);
            } else {
                setData("is_hidden", false);
            }

        } else {
            setData("detail_name", "");
            setData("is_hidden", false); // Default to visible for new entries
        }
    }, [data.sub_metric, subMetrics, initialData, data.metric]);
        
    const handleSubmit = () => {
        post(route("program-metrics-entry.store"), {
            onSuccess: () => setIsModalOpen(false),
        });
    };

    return (
        <DataEntryLayout title="Program Metrics Entry">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white p-6 rounded-xl border border-purple-100 shadow-sm space-y-4">
                    <h3 className="text-[#5c297c] font-bold text-sm uppercase tracking-wider opacity-60">Step 1: Select Jurisdiction</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CustomSelectGroup
                            label="College:"
                            value={selectedCollege}
                            onChange={(e) => {
                                setSelectedCollege(e.target.value);
                                setSelectedProgram("");
                                setData("program_id", "");
                                setData("sub_metric", "");
                            }}
                            options={(initialData?.Colleges || []).map(c => ({ value: c.college_id, label: c.name }))}
                            disabled={isCollegeRestricted}
                            placeholder="Select College"
                        />
                        <CustomSelectGroup
                            label="Program:"
                            value={selectedProgram}
                            onChange={(e) => {
                                setSelectedProgram(e.target.value);
                                setData("program_id", e.target.value);
                                setData("sub_metric", "");
                            }}
                            options={filteredPrograms.map(p => ({ value: p.program_id, label: p.name }))}
                            disabled={isProgramRestricted || !selectedCollege}
                            placeholder="Select Program"
                        />
                    </div>
                </div>

                <form className="bg-white p-6 rounded-xl border border-purple-100 shadow-sm space-y-6">
                    <CustomSelectGroup
                        label="Select Metric:"
                        value={data.metric}
                        disabled={!selectedProgram}
                        onChange={(e) => {
                            setData("metric", e.target.value);
                            setData("sub_metric", "");
                        }}
                        options={[{ value: "MockSubjects", label: "Mock Subjects" }]}
                        placeholder={!selectedProgram ? "Select Program First" : "Select Metric"}
                    />

                    {data.metric && selectedProgram && (
                        <div className="space-y-5 animate-fade-in-up border-t border-gray-100 pt-5">
                            <CustomSelectGroup
                                label="Select Mock Subject:"
                                value={data.sub_metric}
                                onChange={(e) => setData("sub_metric", e.target.value)}
                                options={subMetrics}
                                placeholder="Select Option"
                            />

                            <div className="flex flex-col gap-2">
                                <label className="font-bold text-sm text-[#5c297c]">Additional Details:</label>
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
                                        Hide
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            disabled={!data.metric || !data.sub_metric || !data.detail_name || processing}
                            className={`px-10 py-3 font-bold text-white rounded-lg transition-all shadow-md ${(!data.metric || !data.sub_metric || !data.detail_name) ? "bg-gray-300 cursor-not-allowed" : "bg-[#5c297c] hover:bg-[#ffb736]"}`}
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
                title="Update Program Metrics"
                message="Are you sure you want to save these changes to the program metrics?"
            />
        </DataEntryLayout>
    );
}