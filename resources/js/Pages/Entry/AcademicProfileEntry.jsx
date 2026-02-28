import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import DataEntryLayout from "@/Layouts/DataEntryLayout";
import CustomSelectGroup from "@/Components/SelectGroup";
import TextInput from "@/Components/TextInput";
import ConfirmSaveModal from "@/Components/Modals/ConfirmSaveModal";

export default function AcademicProfileEntry() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Mock Options
    const mockSubMetrics = {
        BoardSubjects: [
            { value: "add", label: "+ Add New Subject" },
            { value: "mt101", label: "Clinical Chemistry" },
        ],
        GeneralSubjects: [
            { value: "add", label: "+ Add New Gen Subject" },
            { value: "pe", label: "Physical Education" },
        ],
        TypeOfRating: [
            { value: "add", label: "+ Add New Rating" },
            { value: "mock", label: "Mock Exam" },
        ],
        TypeOfSimulation: [
            { value: "add", label: "+ Add New Simulation" },
            { value: "sim1", label: "Simulation Alpha" },
        ],
    };

    const { data, setData, post, processing } = useForm({
        metric: "",
        sub_metric: "",
        detail_name: "",
        is_hidden: false,
    });

    const isFormValid =
        data.metric && data.sub_metric && data.detail_name.trim() !== "";

    const handleSubmit = () => {
        post(route("academic-profile-entry.store"), {
            onSuccess: () => setIsModalOpen(false),
        });
    };

    return (
        <DataEntryLayout title="Academic Profile Entry">
            <div className="max-w-2xl mx-auto">
                <form className="bg-white p-6 rounded-xl border border-purple-100 shadow-sm space-y-6">
                    <CustomSelectGroup
                        label="Select Metric:"
                        value={data.metric}
                        onChange={(e) => {
                            setData("metric", e.target.value);
                            setData("sub_metric", "");
                        }}
                        options={[
                            { value: "BoardSubjects", label: "Board Subjects" },
                            {
                                value: "GeneralSubjects",
                                label: "General Subjects",
                            },
                            { value: "TypeOfRating", label: "Type of Rating" },
                            {
                                value: "TypeOfSimulation",
                                label: "Type of Simulation",
                            },
                        ]}
                        placeholder="Select Metric"
                        vertical={true}
                    />

                    {data.metric && (
                        <div className="space-y-5 animate-fade-in-up border-t border-gray-100 pt-5">
                            <CustomSelectGroup
                                label={`Select ${data.metric.replace(/([A-Z])/g, " $1").trim()}:`}
                                value={data.sub_metric}
                                onChange={(e) =>
                                    setData("sub_metric", e.target.value)
                                }
                                options={mockSubMetrics[data.metric] || []}
                                placeholder="Select Option"
                                vertical={true}
                            />

                            <div className="flex flex-col gap-2">
                                <label className="font-bold text-sm text-[#5c297c]">
                                    Additional Details:
                                </label>
                                <div className="flex flex-col md:flex-row gap-3 items-center">
                                    <TextInput
                                        type="text"
                                        placeholder="Enter detail here"
                                        value={data.detail_name}
                                        onChange={(e) =>
                                            setData(
                                                "detail_name",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full"
                                    />
                                    <label className="flex items-center gap-2 text-sm font-bold text-[#5c297c] whitespace-nowrap bg-purple-50 px-4 py-2.5 rounded-lg border border-purple-100 cursor-pointer hover:bg-purple-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-[#5c297c] focus:ring-[#ffb736] border-gray-300 rounded cursor-pointer"
                                            checked={data.is_hidden}
                                            onChange={(e) =>
                                                setData(
                                                    "is_hidden",
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                        Hide from System
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            disabled={!isFormValid || processing}
                            className={`px-10 py-3 font-bold text-white rounded-lg transition-all shadow-md
                                ${!isFormValid ? "bg-gray-300 cursor-not-allowed" : "bg-[#5c297c] hover:bg-[#ffb736]"}`}
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
                title="Update Academic Profile"
                message="Are you sure you want to save these changes to the academic metrics?"
            />
        </DataEntryLayout>
    );
}
