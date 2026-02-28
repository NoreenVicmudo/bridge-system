import React, { useState } from "react";
import TextInput from "@/Components/TextInput";
import CustomSelectGroup from "@/Components/SelectGroup";
import ConfirmSaveModal from "@/Components/Modals/ConfirmSaveModal";

export default function UpdateLicensureForm({
    data,
    setData,
    errors = {},
    processing = false,
    submit,
    studentName,
    currentResult = "",
    currentDate = "",
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const inputClass =
        "w-full border-gray-300 rounded-[5px] shadow-sm text-sm p-2 " +
        "focus:border-[#ffb736] focus:ring-[#ffb736] focus:ring-1 focus:outline-none " +
        "transition-colors duration-200 placeholder:text-gray-400";

    const labelClass = "block mb-0.5 font-bold text-sm text-[#5c297c]";

    const selectGroupOverride =
        "!flex-col !items-start !gap-0.5 mb-0 w-full !whitespace-nowrap";
    const selectLabelOverride =
        "!w-full !text-left !font-bold !text-[#5c297c] !mb-0 !whitespace-nowrap";

    // Validation: Form is valid if both result and date are provided
    const isFormValid = data.exam_result && data.exam_date_taken;

    const openConfirmModal = (e) => {
        e.preventDefault();
        if (isFormValid) setIsModalOpen(true);
    };

    return (
        <div className="flex justify-center w-full px-4 py-0 h-[calc(100vh-100px)] items-start overflow-hidden font-montserrat text-left text-[#5c297c]">
            <div className="w-full max-w-2xl bg-white rounded-[10px] shadow-[0_6px_25px_rgba(0,0,0,0.1)] px-6 py-4 md:px-8 md:py-5 flex flex-col max-h-full my-2 relative">
                <h2 className="text-center text-xl md:text-2xl font-bold mb-3 flex-shrink-0">
                    Licensure Exam Result Overview
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                        {/* Current Status Overview */}
                        <div className="border-t border-gray-100 pt-3">
                            <label className={labelClass}>
                                Latest Recorded Result:
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 animate-fade-in">
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="block text-[10px] uppercase font-bold opacity-60">
                                        Result
                                    </span>
                                    <span
                                        className={`text-sm font-bold ${currentResult === "PASSED" ? "text-green-600" : "text-red-600"}`}
                                    >
                                        {currentResult || "No result recorded"}
                                    </span>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="block text-[10px] uppercase font-bold opacity-60">
                                        Date Taken
                                    </span>
                                    <span className="text-sm font-bold text-gray-700">
                                        {currentDate || "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Update Section */}
                        <div className="border-t border-gray-100 pt-4 bg-purple-50/30 p-3 rounded-lg mt-1">
                            <h3 className="text-[11px] font-bold mb-3 uppercase tracking-widest opacity-70">
                                Update Exam Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[#5c297c]">
                                <div className="w-full">
                                    <CustomSelectGroup
                                        label="Exam Result:"
                                        value={data.exam_result}
                                        onChange={(e) =>
                                            setData(
                                                "exam_result",
                                                e.target.value,
                                            )
                                        }
                                        options={[
                                            {
                                                value: "PASSED",
                                                label: "PASSED",
                                            },
                                            {
                                                value: "FAILED",
                                                label: "FAILED",
                                            },
                                        ]}
                                        placeholder="Select Result"
                                        vertical={true}
                                        className={selectGroupOverride}
                                        labelClassName={selectLabelOverride}
                                    />
                                </div>
                                <div className="w-full">
                                    <label className={labelClass}>
                                        Date Taken:
                                    </label>
                                    <TextInput
                                        type="date"
                                        value={data.exam_date_taken}
                                        onChange={(e) =>
                                            setData(
                                                "exam_date_taken",
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-3 mt-4 mb-2 flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="px-6 py-2.5 text-sm font-bold text-[#666] bg-white border border-[#ddd] rounded-[6px] hover:bg-[#ffb736] hover:text-white transition-all duration-300 shadow-sm"
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
                                {processing ? "Saving..." : "Update Result"}
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
                            Are you sure you want to update the licensure exam
                            result for <br />
                            <strong>{studentName}</strong>?
                        </>
                    }
                />
            </div>
        </div>
    );
}
