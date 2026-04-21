import React, { useState, useEffect } from "react";
import TextInput from "@/Components/TextInput";
import CustomSelectGroup from "@/Components/SelectGroup";
import ConfirmSaveModal from "@/Components/Modals/ConfirmSaveModal";

export default function UpdateRetakesForm({
    data,
    setData,
    errors = {},
    processing = false,
    submit,
    studentName,
    studentNumber,
    subjectOptions = [], 
    currentRetakes = {}, 
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const inputClass = "w-full border-gray-300 rounded-[5px] shadow-sm text-sm p-2 focus:border-[#ffb736] focus:ring-[#ffb736] focus:ring-1 focus:outline-none transition-colors duration-200";
    const labelClass = "block mb-0.5 font-bold text-sm text-[#5c297c]";

    const selectGroupOverride = "!flex-col !items-start !gap-0.5 mb-0 w-full !whitespace-nowrap";
    const selectLabelOverride = "!w-full !text-left !font-bold !text-[#5c297c] !mb-0 !whitespace-nowrap";

    const isFormValid = data.general_subject_id && data.terms_repeated !== "";

    // Auto-fill existing retake count when a subject is selected
    useEffect(() => {
        if (data.general_subject_id) {
            const existingCount = currentRetakes[data.general_subject_id] ?? "";
            setData("terms_repeated", existingCount);
        }
    }, [data.general_subject_id]);

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
                    <label className={labelClass}>Subjects and Retakes Overview:</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        {subjectOptions.length > 0 ? (
                            subjectOptions.map((sub) => (
                                <div key={sub.value} className="flex gap-2 animate-fade-in">
                                    <input
                                        type="text"
                                        value={sub.label}
                                        className={`${inputClass} bg-gray-50 border-gray-200 font-medium`}
                                        readOnly
                                    />
                                    <input
                                        type="text"
                                        value={currentRetakes[sub.value] ?? "0"}
                                        className={`${inputClass} font-bold text-center w-24 bg-gray-50 border-gray-200 ${!currentRetakes[sub.value] ? "text-gray-300" : "text-[#5c297c]"}`}
                                        readOnly
                                    />
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 italic text-sm py-2">
                                No subjects found.
                            </p>
                        )}
                    </div>
                </div>

                {/* Update Section */}
                <div className="border-t border-gray-100 pt-5 bg-purple-50/30 p-4 rounded-lg mt-2">
                    <h3 className="text-[11px] font-bold mb-4 uppercase tracking-widest opacity-70">Update Retake Count</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <CustomSelectGroup
                                label="Select General Subject:"
                                value={data.general_subject_id}
                                onChange={(e) => setData("general_subject_id", e.target.value)}
                                options={subjectOptions}
                                placeholder="Choose Subject"
                                vertical={true}
                                className={selectGroupOverride}
                                labelClassName={selectLabelOverride}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Number of Retakes:</label>
                            <TextInput
                                type="number"
                                min="0"
                                placeholder="0"
                                value={data.terms_repeated}
                                onChange={(e) => setData("terms_repeated", e.target.value)}
                                className={inputClass}
                                required
                            />
                            {errors.terms_repeated && <div className="text-red-500 text-xs mt-1">{errors.terms_repeated}</div>}
                        </div>
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
                        {processing ? "Saving..." : "Update Retakes"}
                    </button>
                </div>
            </form>

            <ConfirmSaveModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirm}
                message={
                    <>
                        Are you sure you want to update the retake records for <br />
                        <strong>{studentName}</strong>?
                    </>
                }
            />
        </div>
    );
}