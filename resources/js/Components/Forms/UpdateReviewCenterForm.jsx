import React, { useState } from "react";
import TextInput from "@/Components/TextInput";
import ConfirmSaveModal from "@/Components/Modals/ConfirmSaveModal";

export default function UpdateReviewCenterForm({
    data,
    setData,
    errors = {},
    processing = false,
    submit,
    studentName,
    currentReviewCenter = "",
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const inputClass = "w-full border-gray-300 rounded-[5px] shadow-sm text-sm p-2 focus:border-[#ffb736] focus:ring-[#ffb736] focus:ring-1 focus:outline-none transition-colors duration-200";
    const labelClass = "block mb-0.5 font-bold text-sm text-[#5c297c]";

    // Validation: Form is valid if review center name is not empty
    const isFormValid = data.review_center && data.review_center.trim() !== "";

    const openConfirmModal = (e) => {
        e.preventDefault();
        if (isFormValid) setIsModalOpen(true);
    };

    const handleConfirm = () => {
        setIsModalOpen(false);
        submit();
    };

    return (
        <div className="w-full font-montserrat text-left text-[#5c297c]">
            <form onSubmit={openConfirmModal} className="flex flex-col gap-4">
                
                {/* Student Info (Read-Only) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Student ID:</label>
                        <TextInput
                            value={data.student_number}
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

                {/* Current Review Center Display */}
                <div className="border-t border-gray-100 pt-4">
                    <label className={labelClass}>Currently Enrolled At:</label>
                    <div className="mt-2 animate-fade-in">
                        <TextInput
                            value={currentReviewCenter || "No review center recorded"}
                            className={`${inputClass} bg-gray-50 border-gray-200 italic text-gray-500`}
                            readOnly
                        />
                    </div>
                </div>

                {/* Update Section */}
                <div className="border-t border-gray-100 pt-5 bg-purple-50/30 p-4 rounded-lg mt-2">
                    <h3 className="text-[11px] font-bold mb-4 uppercase tracking-widest opacity-70">
                        Update Review Center Information
                    </h3>

                    <div className="w-full">
                        <label className={labelClass}>Review Center Name:</label>
                        <TextInput
                            type="text"
                            placeholder="Enter Name of Review Center"
                            value={data.review_center}
                            onChange={(e) => setData("review_center", e.target.value)}
                            className={inputClass}
                            required
                        />
                        {errors.review_center && (
                            <div className="text-red-500 text-xs mt-1">
                                {errors.review_center}
                            </div>
                        )}
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
                        {processing ? "Saving..." : "Update Center"}
                    </button>
                </div>
            </form>

            <ConfirmSaveModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirm}
                message={
                    <>
                        Are you sure you want to update the review center for <br />
                        <strong>{studentName}</strong>?
                    </>
                }
            />
        </div>
    );
}