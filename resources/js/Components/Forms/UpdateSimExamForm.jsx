import React, { useState, useEffect } from "react";
import TextInput from "@/Components/TextInput";
import CustomSelectGroup from "@/Components/SelectGroup";
import ConfirmSaveModal from "@/Components/Modals/ConfirmSaveModal";

export default function UpdateSimExamForm({
    data,
    setData,
    errors = {},
    processing = false,
    submit,
    studentName,
    studentNumber,
    simulationOptions = [], 
    currentResults = {}, 
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const inputClass = "w-full border-gray-300 rounded-[5px] shadow-sm text-sm p-2 focus:border-[#ffb736] focus:ring-[#ffb736] focus:ring-1 focus:outline-none transition-colors duration-200";
    const labelClass = "block mb-0.5 font-bold text-sm text-[#5c297c]";

    const selectGroupOverride = "!flex-col !items-start !gap-0.5 mb-0 w-full !whitespace-nowrap";
    const selectLabelOverride = "!w-full !text-left !font-bold !text-[#5c297c] !mb-0 !whitespace-nowrap";

    // Form is valid ONLY if simulation, score, AND exam_period are provided
    const isFormValid = data.simulation_id && data.score && data.exam_period;

    // Auto-fill existing result when an exam is selected
    useEffect(() => {
        if (data.simulation_id) {
            const existingScore = currentResults[data.simulation_id] || "";
            setData("score", existingScore);
        }
    }, [data.simulation_id]);

    const handleConfirm = () => {
        setIsModalOpen(false);
        submit();
    };

    return (
        <div className="w-full font-montserrat text-left text-[#5c297c]">
            <form onSubmit={(e) => { e.preventDefault(); if (isFormValid) setIsModalOpen(true); }} className="flex flex-col gap-4">
                
                {/* Student Info (Read-Only) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Student ID:</label>
                        <TextInput
                            value={studentNumber}
                            className={`${inputClass} bg-gray-100 cursor-not-allowed text-gray-500 font-bold`}
                            readOnly
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Student Name:</label>
                        <TextInput
                            value={studentName}
                            className={`${inputClass} bg-gray-100 cursor-not-allowed text-gray-500 font-bold`}
                            readOnly
                        />
                    </div>
                </div>

                {/* History Section */}
                <div className="border-t border-gray-100 pt-4">
                    <label className={labelClass}>Previous Exam Results:</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        {simulationOptions.length > 0 ? (
                            simulationOptions.map((sim) => (
                                <div key={sim.value} className="flex gap-2 animate-fade-in">
                                    <input
                                        type="text"
                                        value={sim.label}
                                        className={`${inputClass} bg-gray-50 border-gray-200 font-medium`}
                                        readOnly
                                    />
                                    <input
                                        type="text"
                                        value={currentResults[sim.value] ? `${currentResults[sim.value]}%` : "N/A"}
                                        className={`${inputClass} font-bold text-center w-24 bg-gray-50 border-gray-200 ${!currentResults[sim.value] ? "text-gray-300" : "text-[#5c297c]"}`}
                                        readOnly
                                    />
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 italic text-sm py-2">
                                No exams found for this program.
                            </p>
                        )}
                    </div>
                </div>

                {/* Update Section */}
                <div className="border-t border-gray-100 pt-5 bg-purple-50/30 p-4 rounded-lg mt-2">
                    <h3 className="text-[11px] font-bold mb-4 uppercase tracking-widest opacity-70">Update Exam Score</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <CustomSelectGroup
                                label="Exam Period / Attempt:"
                                value={data.exam_period}
                                onChange={(e) => setData("exam_period", e.target.value)}
                                options={[
                                    { value: "Default", label: "Default Period" },
                                    { value: "Diagnostic", label: "Diagnostic" },
                                    { value: "Pre-Test", label: "Pre-Test" },
                                    { value: "Midterm", label: "Midterm" },
                                    { value: "Post-Test", label: "Post-Test" },
                                ]}
                                placeholder="Select Period"
                                vertical={true}
                                className={selectGroupOverride}
                                labelClassName={selectLabelOverride}
                            />
                            {errors.exam_period && <div className="text-red-500 text-xs mt-1">{errors.exam_period}</div>}
                        </div>

                        <div>
                            <CustomSelectGroup
                                label="Select Simulation Exam:"
                                value={data.simulation_id}
                                onChange={(e) => setData("simulation_id", e.target.value)}
                                options={simulationOptions}
                                placeholder="Choose Simulation"
                                vertical={true}
                                className={selectGroupOverride}
                                labelClassName={selectLabelOverride}
                            />
                        </div>
                    </div>

                    <div className="mt-4 w-full">
                        <label className={labelClass}>Result / Score (%):</label>
                        <TextInput
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={data.score}
                            onChange={(e) => setData("score", e.target.value)}
                            className={inputClass}
                            required
                        />
                        {errors.score && <div className="text-red-500 text-xs mt-1">{errors.score}</div>}
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end mt-4">
                    <button
                        type="submit"
                        disabled={processing || !isFormValid}
                        className={`px-10 py-3 text-sm font-bold text-white rounded-[6px] transition-all shadow-md ${
                            !isFormValid ? "bg-gray-400 cursor-not-allowed" : "bg-[#5c297c] hover:bg-[#ffb736]"
                        }`}
                    >
                        {processing ? "Saving..." : "Update Results"}
                    </button>
                </div>
            </form>

            <ConfirmSaveModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirm}
                message={
                    <>
                        Are you sure you want to update the <strong>{data.exam_period || 'exam'}</strong> result for <br />
                        <strong>{studentName}</strong>?
                    </>
                }
            />
        </div>
    );
}