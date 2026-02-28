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

    const inputClass =
        "w-full border-gray-300 rounded-[5px] shadow-sm text-sm p-2 " +
        "focus:border-[#ffb736] focus:ring-[#ffb736] focus:ring-1 focus:outline-none " +
        "transition-colors duration-200 placeholder:text-gray-400";

    const labelClass = "block mb-0.5 font-bold text-sm text-[#5c297c]";

    // Validation: Form is valid if review center name is not empty
    const isFormValid = data.review_center && data.review_center.trim() !== "";

    const openConfirmModal = (e) => {
        e.preventDefault();
        if (isFormValid) setIsModalOpen(true);
    };

    return (
        <div className="flex justify-center w-full px-4 py-0 h-[calc(100vh-100px)] items-start overflow-hidden font-montserrat text-left text-[#5c297c]">
            <div className="w-full max-w-2xl bg-white rounded-[10px] shadow-[0_6px_25px_rgba(0,0,0,0.1)] px-6 py-4 md:px-8 md:py-5 flex flex-col max-h-full my-2 relative">
                <h2 className="text-center text-xl md:text-2xl font-bold mb-3 flex-shrink-0">
                    Review Center Overview
                </h2>

                <div className="overflow-y-auto overflow-x-hidden pr-2 flex-1 custom-form-scrollbar">
                    <style>{`
                        .custom-form-scrollbar::-webkit-scrollbar { width: 4px; }
                        .custom-form-scrollbar::-webkit-scrollbar-thumb { background-color: #5c297c; border-radius: 6px; }
                        input:focus { box-shadow: 0 0 0 1px #ffb736 !important; border-color: #ffb736 !important; }
                    `}</style>

                    <form
                        onSubmit={openConfirmModal}
                        className="flex flex-col gap-3 p-1"
                    >
                        {/* Header Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[#5c297c]">
                            <div className="w-full">
                                <label className={labelClass}>
                                    Student ID:
                                </label>
                                <TextInput
                                    value={data.student_number}
                                    className={`${inputClass} bg-gray-100 cursor-not-allowed text-gray-500 font-bold`}
                                    readOnly={true}
                                />
                            </div>
                            <div className="w-full">
                                <label className={labelClass}>
                                    Student Name:
                                </label>
                                <TextInput
                                    value={studentName}
                                    className={`${inputClass} bg-gray-100 cursor-not-allowed text-gray-500 font-bold`}
                                    readOnly={true}
                                />
                            </div>
                        </div>

                        {/* Current Review Center Display */}
                        <div className="border-t border-gray-100 pt-3">
                            <label className={labelClass}>
                                Currently Enrolled At:
                            </label>
                            <div className="mt-2 animate-fade-in">
                                <TextInput
                                    value={
                                        currentReviewCenter ||
                                        "No review center recorded"
                                    }
                                    className={`${inputClass} bg-gray-50 border-gray-200 italic text-gray-500`}
                                    readOnly={true}
                                />
                            </div>
                        </div>

                        {/* Update Section */}
                        <div className="border-t border-gray-100 pt-4 bg-purple-50/30 p-3 rounded-lg mt-1 text-[#5c297c]">
                            <h3 className="text-[11px] font-bold mb-3 uppercase tracking-widest opacity-70">
                                Update Review Center Information
                            </h3>

                            <div className="w-full">
                                <label className={labelClass}>
                                    Review Center Name:
                                </label>
                                <TextInput
                                    type="text"
                                    placeholder="Enter Name of Review Center"
                                    value={data.review_center}
                                    onChange={(e) =>
                                        setData("review_center", e.target.value)
                                    }
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

                        {/* Buttons */}
                        <div className="flex justify-end gap-3 mt-4 mb-2 flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="px-6 py-2.5 text-sm font-bold text-[#666] bg-white border border-[#ddd] rounded-[6px] hover:bg-[#ffb736] hover:text-white transition-all duration-300 shadow-sm font-montserrat"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={processing || !isFormValid}
                                className={`px-6 py-2.5 text-sm font-bold text-white rounded-[6px] transition-all duration-300 shadow-md
                                    ${
                                        !isFormValid
                                            ? "bg-gray-400 cursor-not-allowed opacity-70"
                                            : "bg-[#5c297c] hover:bg-[#ffb736] cursor-pointer"
                                    }`}
                            >
                                {processing ? "Saving..." : "Update Center"}
                            </button>
                        </div>
                    </form>
                </div>

                <ConfirmSaveModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={submit}
                    message={
                        <>
                            Are you sure you want to update the review center
                            for <br />
                            <strong>{studentName}</strong>?
                        </>
                    }
                />
            </div>
        </div>
    );
}
