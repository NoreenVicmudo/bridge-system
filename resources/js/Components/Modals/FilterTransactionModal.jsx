import React, { useState, useEffect } from "react";
import CustomSelectGroup from "@/Components/SelectGroup";

export default function FilterTransactionModal({
    isOpen,
    onClose,
    currentFilters,
    onApply,
}) {
    const [animate, setAnimate] = useState(false);

    // Local state for the form before applying
    const [filters, setFilters] = useState({
        college: "ALL",
        action: "ALL",
    });

    // Reset local state when modal opens
    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
            setFilters(currentFilters);
        }
    }, [isOpen, currentFilters]);

    const handleClose = () => {
        setAnimate(false);
        setTimeout(() => onClose(), 300);
    };

    const handleApply = () => {
        setAnimate(false);
        setTimeout(() => {
            onApply(filters);
            onClose();
        }, 300);
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-[1000] flex items-center justify-center transition-all duration-300 ${animate ? "bg-gray-900/60 backdrop-blur-sm" : "bg-transparent backdrop-blur-none"}`}
        >
            <div
                className={`bg-white rounded-2xl w-[90%] max-w-[400px] p-0 shadow-2xl relative flex flex-col overflow-hidden transition-all duration-300 transform ${animate ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
            >
                {/* Header */}
                <div className="bg-[#5c297c] p-5 text-center relative">
                    <h2 className="text-xl font-bold text-white tracking-wide">
                        Filter Transactions
                    </h2>
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/20 rounded-full p-1 transition-all"
                    >
                        <i className="bi bi-x-lg text-xl"></i>
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-6 flex flex-col gap-4">
                    <CustomSelectGroup
                        label="College:"
                        value={filters.college}
                        onChange={(e) =>
                            setFilters({ ...filters, college: e.target.value })
                        }
                        options={[
                            { value: "ALL", label: "ALL" },
                            {
                                value: "CMT",
                                label: "College of Medical Technology",
                            },
                            // Add more colleges...
                        ]}
                        vertical={true}
                    />

                    <CustomSelectGroup
                        label="Action:"
                        value={filters.action}
                        onChange={(e) =>
                            setFilters({ ...filters, action: e.target.value })
                        }
                        options={[
                            { value: "ALL", label: "ALL" },
                            { value: "ACTIVITY LOG", label: "ACTIVITY LOG" },
                            { value: "ADD STUDENT", label: "ADD STUDENT" },
                            {
                                value: "UPDATE STUDENT",
                                label: "UPDATE STUDENT",
                            },
                            {
                                value: "REMOVE STUDENT",
                                label: "REMOVE STUDENT",
                            },
                            {
                                value: "ACADEMIC PROFILE",
                                label: "ACADEMIC PROFILE",
                            },
                            {
                                value: "PROGRAM METRICS",
                                label: "PROGRAM METRICS",
                            },
                            {
                                value: "REPORT GENERATION",
                                label: "REPORT GENERATION",
                            },
                            {
                                value: "ADDITIONAL ENTRY",
                                label: "ADDITIONAL ENTRY",
                            },
                        ]}
                        vertical={true}
                    />

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-gray-100">
                        <button
                            onClick={handleClose}
                            className="px-5 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApply}
                            className="px-5 py-2 text-sm font-bold text-white bg-[#5c297c] rounded-lg hover:bg-[#ffb736] shadow-md transition-all"
                        >
                            Apply Filter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
