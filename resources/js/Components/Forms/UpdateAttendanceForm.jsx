import React, { useState } from "react";
import TextInput from "@/Components/TextInput";
import ConfirmSaveModal from "@/Components/Modals/ConfirmSaveModal";

export default function UpdateAttendanceForm({
    data,
    setData,
    errors = {},
    processing = false,
    submit,
    studentName,
    currentAttendance = { attended: 0, total: 0 }, // Prefilled from backend
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const inputClass =
        "w-full border-gray-300 rounded-[5px] shadow-sm text-sm p-2 " +
        "focus:border-[#ffb736] focus:ring-[#ffb736] focus:ring-1 focus:outline-none " +
        "transition-colors duration-200 placeholder:text-gray-400";

    const labelClass = "block mb-0.5 font-bold text-sm text-[#5c297c]";

    // Validation: Form is valid if both attended and total sessions are provided
    const isFormValid = data.attended !== "" && data.total !== "";

    const openConfirmModal = (e) => {
        e.preventDefault();
        if (isFormValid) setIsModalOpen(true);
    };

    return (
        <div className="flex justify-center w-full px-4 py-0 h-[calc(100vh-100px)] items-start overflow-hidden font-montserrat text-left text-[#5c297c]">
            <div className="w-full max-w-2xl bg-white rounded-[10px] shadow-[0_6px_25px_rgba(0,0,0,0.1)] px-6 py-4 md:px-8 md:py-5 flex flex-col max-h-full my-2 relative">
                <h2 className="text-center text-xl md:text-2xl font-bold mb-3 flex-shrink-0">
                    Attendance in Review Classes Overview
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

                        {/* Attendance Overview Card */}
                        <div className="border-t border-gray-100 pt-3">
                            <label className={labelClass}>
                                Current Attendance Stats:
                            </label>
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                                    <span className="block text-[10px] uppercase font-bold opacity-60">
                                        Attended
                                    </span>
                                    <span className="text-xl font-bold">
                                        {currentAttendance.attended}
                                    </span>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                                    <span className="block text-[10px] uppercase font-bold opacity-60">
                                        Total Sessions
                                    </span>
                                    <span className="text-xl font-bold">
                                        {currentAttendance.total}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Update Section */}
                        <div className="border-t border-gray-100 pt-4 bg-purple-50/30 p-3 rounded-lg mt-1">
                            <h3 className="text-[11px] font-bold mb-3 uppercase tracking-widest opacity-70">
                                Update Attendance Records
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[#5c297c]">
                                <div className="w-full">
                                    <label className={labelClass}>
                                        Sessions Attended:
                                    </label>
                                    <TextInput
                                        type="number"
                                        placeholder="0"
                                        value={data.attended}
                                        onChange={(e) =>
                                            setData("attended", e.target.value)
                                        }
                                        className={inputClass}
                                        required
                                    />
                                    {errors.attended && (
                                        <div className="text-red-500 text-xs mt-1">
                                            {errors.attended}
                                        </div>
                                    )}
                                </div>
                                <div className="w-full">
                                    <label className={labelClass}>
                                        Total Sessions:
                                    </label>
                                    <TextInput
                                        type="number"
                                        placeholder="0"
                                        value={data.total}
                                        onChange={(e) =>
                                            setData("total", e.target.value)
                                        }
                                        className={inputClass}
                                        required
                                    />
                                    {errors.total && (
                                        <div className="text-red-500 text-xs mt-1">
                                            {errors.total}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
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
                                {processing ? "Saving..." : "Update Attendance"}
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
                            Are you sure you want to update the review class
                            attendance for <br />
                            <strong>{studentName}</strong>?
                        </>
                    }
                />
            </div>
        </div>
    );
}
