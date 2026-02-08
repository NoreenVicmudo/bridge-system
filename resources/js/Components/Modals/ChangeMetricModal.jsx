import React, { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import CustomSelectGroup from "@/Components/SelectGroup";

export default function ChangeMetricModal({ isOpen, onClose, currentMetric }) {
    const [selectedMetric, setSelectedMetric] = useState("");
    const [animate, setAnimate] = useState(false);

    const METRICS = [
        { label: "GWA", value: "GWA", url: "/academic-profile/gwa" },
        { label: "Grades in Board Subjects", value: "Grades in Board Subjects", url: "/academic-profile/board-grades" },
        { label: "Back Subjects/Retakes", value: "Back Subjects/Retakes", url: "/academic-profile/retakes" },
        { label: "Performance Rating", value: "Performance Rating", url: "/academic-profile/performance" },
        { label: "Simulation Exam Results", value: "Simulation Exam Results", url: "/academic-profile/mock-exams" },
        { label: "Attendance in Review Classes", value: "Attendance in Review Classes", url: "/academic-profile/attendance" },
        { label: "Academic Recognition", value: "Academic Recognition", url: "/academic-profile/recognition" },
    ];

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
            setSelectedMetric(currentMetric || "GWA");
        } else {
            setAnimate(false);
        }
    }, [isOpen, currentMetric]);

    const closeModal = () => {
        setAnimate(false);
        setTimeout(onClose, 300);
    };

    const handleChange = () => {
        const target = METRICS.find(m => m.value === selectedMetric);
        if (target) {
            // console.log("Navigating to:", target.url); // Use for testing
            router.visit(target.url);
            closeModal();
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[1000] flex items-center justify-center transition-all duration-300 ${animate ? "bg-gray-900/60 backdrop-blur-sm" : "bg-transparent backdrop-blur-none pointer-events-none"}`}>
            
            <div className={`bg-white rounded-2xl w-[90%] max-w-[500px] shadow-2xl relative flex flex-col overflow-hidden transition-all duration-300 transform ${animate ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
                
                {/* Header - Purple Text Only */}
                <div className="p-6 pb-0 text-center">
                    <h2 className="text-[26px] font-bold text-[#5c297c] tracking-wide">Change Academic Metric</h2>
                </div>

                {/* Content */}
                <div className="p-8 pt-6 pb-8">
                    
                    {/* FIX: We pass "Select Metric:" directly to the label prop.
                       This utilizes the internal flex layout of CustomSelectGroup 
                       so the label is on the left and the box fills the rest of the width.
                    */}
                    <div className="w-full">
                        <CustomSelectGroup 
                            label="Select Metric:" 
                            value={selectedMetric} 
                            onChange={(e) => setSelectedMetric(e.target.value)}
                            options={METRICS}
                            placeholder="Select Metric"
                        />
                    </div>

                    {/* Footer Buttons Centered & Matched Widths */}
                    <div className="flex justify-center gap-4 mt-8">
                        <button 
                            onClick={closeModal} 
                            className="w-[120px] py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-[5px] hover:bg-gray-100 transition-all shadow-sm"
                        >
                            Cancel
                        </button>
                        
                        <button 
                            onClick={handleChange} 
                            className="w-[120px] py-2.5 text-sm font-bold text-white bg-[#5c297c] border border-[#5c297c] rounded-[5px] shadow-md hover:bg-[#4a1f63] transition-all"
                        >
                            Change
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}