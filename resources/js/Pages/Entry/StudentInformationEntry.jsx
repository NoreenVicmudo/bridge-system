import React, { useState } from "react";
import { useForm, usePage } from "@inertiajs/react";
import DataEntryLayout from "@/Layouts/DataEntryLayout";
import CustomSelectGroup from "@/Components/SelectGroup";
import TextInput from "@/Components/TextInput";
import ConfirmSaveModal from "@/Components/Modals/ConfirmSaveModal";

export default function StudentInfoEntry() {
    const { auth = {} } = usePage().props;
    const userLevel = auth?.user?.level ?? 0; // Mock: 0 = SuperAdmin

    const [isModalOpen, setIsModalOpen] = useState(false);

    // Dynamic Options Mock (Replace with actual backend props later)
    const mockSubMetrics = {
        College: [
            { value: "add", label: "+ Add New College" },
            { value: "cmt", label: "College of Medical Technology" },
        ],
        Program: [
            { value: "add", label: "+ Add New Program" },
            { value: "bsmt", label: "BS Medical Technology" },
        ],
        CurrentLivingArrangement: [
            { value: "add", label: "+ Add New Arrangement" },
            { value: "dorm", label: "Dormitory" },
        ],
        LanguageSpoken: [
            { value: "add", label: "+ Add New Language" },
            { value: "tagalog", label: "Tagalog" },
        ],
    };

    const { data, setData, post, processing } = useForm({
        metric: "",
        sub_metric: "",
        detail_name: "",
        is_hidden: false,
        // Socioeconomic range data
        ranges: {
            rich_min: "",
            high_min: "",
            high_max: "",
            upper_min: "",
            upper_max: "",
            mid_min: "",
            mid_max: "",
            lower_mid_min: "",
            lower_mid_max: "",
            low_min: "",
            low_max: "",
            poor_max: "",
        },
    });

    // Check if form is valid based on selected metric
    const isFormValid = () => {
        if (!data.metric) return false;
        if (data.metric === "SocioeconomicStatus") {
            // Check if at least one range field has a value
            return Object.values(data.ranges).some((val) => val !== "");
        }
        return data.sub_metric !== "" && data.detail_name.trim() !== "";
    };

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
                            setData("sub_metric", ""); // Reset sub-metric on change
                        }}
                        options={[
                            ...([0, 1].includes(userLevel)
                                ? [
                                      {
                                          value: "SocioeconomicStatus",
                                          label: "Socioeconomic Status",
                                      },
                                      { value: "College", label: "College" },
                                  ]
                                : []),
                            ...([0, 1, 2].includes(userLevel)
                                ? [{ value: "Program", label: "Program" }]
                                : []),
                            ...([0, 2, 3].includes(userLevel)
                                ? [
                                      {
                                          value: "CurrentLivingArrangement",
                                          label: "Current Living Arrangement",
                                      },
                                      {
                                          value: "LanguageSpoken",
                                          label: "Language Spoken",
                                      },
                                  ]
                                : []),
                        ]}
                        placeholder="Select Field"
                        vertical={true}
                    />

                    {/* 2A. Standard Entry (College, Program, etc.) */}
                    {data.metric && data.metric !== "SocioeconomicStatus" && (
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

                    {/* 2B. Socioeconomic Status Ranges */}
                    {data.metric === "SocioeconomicStatus" && (
                        <div className="animate-fade-in-up border-t border-gray-100 pt-5 text-[#5c297c]">
                            <h3 className="text-sm font-bold mb-4 uppercase tracking-widest opacity-70">
                                Update Income Ranges
                            </h3>
                            <div className="grid grid-cols-1 gap-3 bg-slate-50 p-4 rounded-xl border border-gray-200">
                                <div className="flex items-center justify-between gap-4 bg-white p-2 rounded-lg shadow-sm">
                                    <label className="font-bold text-sm w-32">
                                        Rich:
                                    </label>
                                    <div className="flex items-center gap-2 flex-1">
                                        <TextInput
                                            type="number"
                                            placeholder="Min"
                                            value={data.ranges.rich_min}
                                            onChange={(e) =>
                                                setData("ranges", {
                                                    ...data.ranges,
                                                    rich_min: e.target.value,
                                                })
                                            }
                                            className="w-full text-right"
                                        />
                                        <span className="text-sm font-medium whitespace-nowrap w-20">
                                            and above
                                        </span>
                                    </div>
                                </div>

                                {/* Helper function for rendering to-to ranges */}
                                {[
                                    { id: "high", label: "High Income" },
                                    { id: "upper", label: "Upper Middle" },
                                    { id: "mid", label: "Middle Class" },
                                    { id: "lower_mid", label: "Lower Middle" },
                                    { id: "low", label: "Low Income" },
                                ].map((range) => (
                                    <div
                                        key={range.id}
                                        className="flex items-center justify-between gap-4 bg-white p-2 rounded-lg shadow-sm"
                                    >
                                        <label className="font-bold text-sm w-32">
                                            {range.label}:
                                        </label>
                                        <div className="flex items-center gap-2 flex-1">
                                            <TextInput
                                                type="number"
                                                placeholder="Min"
                                                value={
                                                    data.ranges[
                                                        `${range.id}_min`
                                                    ]
                                                }
                                                onChange={(e) =>
                                                    setData("ranges", {
                                                        ...data.ranges,
                                                        [`${range.id}_min`]:
                                                            e.target.value,
                                                    })
                                                }
                                                className="w-full text-right"
                                            />
                                            <span className="text-sm font-bold text-gray-400">
                                                to
                                            </span>
                                            <TextInput
                                                type="number"
                                                placeholder="Max"
                                                value={
                                                    data.ranges[
                                                        `${range.id}_max`
                                                    ]
                                                }
                                                onChange={(e) =>
                                                    setData("ranges", {
                                                        ...data.ranges,
                                                        [`${range.id}_max`]:
                                                            e.target.value,
                                                    })
                                                }
                                                className="w-full text-right"
                                            />
                                        </div>
                                    </div>
                                ))}

                                <div className="flex items-center justify-between gap-4 bg-white p-2 rounded-lg shadow-sm">
                                    <label className="font-bold text-sm w-32">
                                        Poor:
                                    </label>
                                    <div className="flex items-center gap-2 flex-1">
                                        <span className="text-sm font-medium w-12">
                                            Below
                                        </span>
                                        <TextInput
                                            type="number"
                                            placeholder="Max"
                                            value={data.ranges.poor_max}
                                            onChange={(e) =>
                                                setData("ranges", {
                                                    ...data.ranges,
                                                    poor_max: e.target.value,
                                                })
                                            }
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
                            onClick={() => setIsModalOpen(true)} // <-- FIXED HERE
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
