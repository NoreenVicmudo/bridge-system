import React, { useState } from "react";
import TextInput from "@/Components/TextInput";
import ConfirmSaveModal from "@/Components/Modals/ConfirmSaveModal";

export default function UpdateRecognitionForm({
    data,
    setData,
    errors = {},
    processing = false,
    submit,
    studentName,
    studentNumber,
    awardName = "Dean's List",
    currentCount = 0,
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const inputClass = "w-full border-gray-300 rounded-[5px] shadow-sm text-sm p-2 focus:border-[#ffb736] focus:ring-[#ffb736] focus:ring-1 focus:outline-none transition-colors duration-200";
    const labelClass = "block mb-0.5 font-bold text-sm text-[#5c297c]";

    const isFormValid = data.award_count !== "" && data.award_count >= 0;

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
                    <label className={labelClass}>Latest Recorded Recognition:</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="block text-[10px] uppercase font-bold opacity-60">Award Title</span>
                            <span className="text-sm font-bold text-[#5c297c]">{awardName}</span>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="block text-[10px] uppercase font-bold opacity-60">Times Received</span>
                            <span className="text-sm font-bold text-gray-700">{currentCount || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Update Section */}
                <div className="border-t border-gray-100 pt-5 bg-purple-50/30 p-4 rounded-lg mt-2">
                    <h3 className="text-[11px] font-bold mb-4 uppercase tracking-widest opacity-70">Update Recognition Data</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Award Title:</label>
                            <TextInput
                                value={awardName}
                                className={`${inputClass} bg-gray-200 cursor-not-allowed text-gray-500`}
                                readOnly
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Times Received:</label>
                            <TextInput
                                type="number"
                                min="0"
                                value={data.award_count}
                                onChange={(e) => setData("award_count", e.target.value)}
                                className={inputClass}
                                required
                            />
                            {errors.award_count && (
                                <div className="text-red-500 text-xs mt-1">{errors.award_count}</div>
                            )}
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
                        {processing ? "Saving..." : "Update Recognition"}
                    </button>
                </div>
            </form>

            <ConfirmSaveModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirm}
                message={
                    <>
                        Update academic recognition for <br />
                        <strong>{studentName}</strong>?
                    </>
                }
            />
        </div>
    );
}