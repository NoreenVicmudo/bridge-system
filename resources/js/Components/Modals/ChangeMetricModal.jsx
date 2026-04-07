import React, { useState, useEffect } from "react";
import { router } from "@inertiajs/react"; // Make sure router is imported!
import CustomSelectGroup from "@/Components/SelectGroup";

export default function ChangeMetricModal({
    isOpen,
    onClose,
    currentMetric,
    type = "academic",
    filterData = null,
}) {
    const [selectedMetric, setSelectedMetric] = useState("");
    const [animate, setAnimate] = useState(false);

    // 1. UPDATED URLs TO USE route() HELPER
    const ACADEMIC_METRICS = [
        { label: "GWA", value: "GWA", routeName: "gwa.info" },
        { label: "Grades in Board Subjects", value: "Grades in Board Subjects", routeName: "board.subject.grades" },
        { label: "Back Subjects/Retakes", value: "Back Subjects/Retakes", routeName: "retakes.info" },
        { label: "Performance Rating", value: "Performance Rating", routeName: "performance.rating" },
        { label: "Simulation Exam Results", value: "Simulation Exam Results", routeName: "simulation.exam" },
        { label: "Attendance in Review Classes", value: "Attendance in Review Classes", routeName: "review.attendance" },
        { label: "Academic Recognition", value: "Academic Recognition", routeName: "academic.recognition" },
    ];

    const PROGRAM_METRICS = [
        { label: "Review Center", value: "Review Center", routeName: "review.center" },
        { label: "Mock Exam Scores", value: "Mock Exam Scores", routeName: "mock.board.scores" },
        { label: "Licensure Exam Results", value: "Licensure Exam Results", routeName: "licensure.exam" },
    ];

    const activeOptions = type === "program" ? PROGRAM_METRICS : ACADEMIC_METRICS;

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
            setSelectedMetric(currentMetric || "");
        } else {
            setAnimate(false);
        }
    }, [isOpen, currentMetric]);

    const closeModal = () => {
        setAnimate(false);
        setTimeout(onClose, 300);
    };

    // 2. UPDATED NAVIGATION TO USE INERTIA ROUTER
    const handleChange = () => {
        const target = activeOptions.find((m) => m.value === selectedMetric);
        if (target && target.routeName) {
            setAnimate(false);
            setTimeout(() => {
                onClose();
                
                // Use Inertia's router.get! It automatically converts the filterData 
                // object into query parameters seamlessly and prevents full page reloads.
                router.get(route(target.routeName), filterData || {}, {
                    preserveState: false, // We want to cleanly load the new metric page
                });
            }, 300);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[1000] flex items-center justify-center transition-all duration-300 ${animate ? "bg-gray-900/60 backdrop-blur-sm" : "bg-transparent backdrop-blur-none pointer-events-none"}`}>
            <style>{`
                .metric-modal-scroll ul::-webkit-scrollbar { width: 6px; }
                .metric-modal-scroll ul::-webkit-scrollbar-thumb { background-color: #5c297c; border-radius: 6px; }
                .metric-modal-scroll ul::-webkit-scrollbar-track { background: transparent; }
            `}</style>

            <div className={`bg-white rounded-2xl w-[90%] max-w-[550px] shadow-2xl relative flex flex-col transition-all duration-300 transform overflow-visible ${animate ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
                <div className="p-8 pb-4 text-center">
                    <h2 className="text-[26px] font-bold text-[#5c297c] tracking-wide">
                        {type === "program" ? "Change Program Metric" : "Change Academic Metric"}
                    </h2>
                </div>

                <div className="px-10 pb-10 pt-2">
                    <div className="w-full relative z-50">
                        <CustomSelectGroup
                            label="Select Metric:"
                            value={selectedMetric}
                            onChange={(e) => setSelectedMetric(e.target.value)}
                            options={activeOptions}
                            placeholder="Select Metric"
                            className="mb-0 w-full metric-modal-scroll"
                            vertical={true}
                        />
                    </div>

                    <div className="flex justify-center gap-4 mt-8 relative z-0">
                        <button
                            onClick={closeModal}
                            className="w-[120px] py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-[5px] hover:bg-gray-100 transition-all shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleChange}
                            disabled={!selectedMetric}
                            className={`w-[120px] py-2.5 text-sm font-bold text-white border rounded-[5px] shadow-md transition-all duration-300
                                ${!selectedMetric
                                    ? "bg-gray-400 border-gray-400 cursor-not-allowed opacity-70"
                                    : "bg-[#5c297c] border-[#5c297c] hover:bg-[#4a1f63] cursor-pointer"
                                }`}
                        >
                            View
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}