import React, { useState, useEffect } from "react";
import TextInput from "@/Components/TextInput";
import CustomSelectGroup from "@/Components/SelectGroup";
import ConfirmSaveModal from "@/Components/Modals/ConfirmSaveModal"; // Import here

export default function UpdateGWAForm({
    data,
    setData,
    errors = {},
    processing = false,
    submit,
    studentName,
    gwaRecords = [],
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

    const isFormValid = data.year_level && data.semester && data.gwa;

    useEffect(() => {
        if (data.year_level && data.semester) {
            // Map the dropdown value to match the database value
            const mappedSemester = data.semester === "1ST" ? "1" : 
                                   data.semester === "2ND" ? "2" : 
                                   data.semester;

            const existingRecord = gwaRecords.find(
                (r) =>
                    r.year_level.toString() === data.year_level.toString() &&
                    r.semester.toString() === mappedSemester.toString(),
            );
            
            if (existingRecord) {
                setData("gwa", existingRecord.gwa);
            } else {
                setData("gwa", "");
            }
        }
    }, [data.year_level, data.semester, gwaRecords]);

    const openConfirmModal = (e) => {
        e.preventDefault();
        if (isFormValid) setIsModalOpen(true);
    };

    return (
        <div className="flex justify-center w-full px-4 py-0 h-[calc(100vh-100px)] items-start overflow-hidden font-montserrat text-left text-[#5c297c]">
            <div className="w-full max-w-2xl bg-white rounded-[10px] shadow-[0_6px_25px_rgba(0,0,0,0.1)] px-6 py-4 md:px-8 md:py-5 flex flex-col max-h-full my-2 relative">
                <h2 className="text-center text-xl md:text-2xl font-bold mb-3 flex-shrink-0">
                    Student GWA Overview
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

                        <div className="border-t border-gray-100 pt-3">
                            <label className={labelClass}>
                                Current GWA Records:
                            </label>
                            <div className="space-y-2 mt-2 text-[#5c297c]">
                                {gwaRecords.length > 0 ? (
                                    gwaRecords.map((record, idx) => (
                                        <div
                                            key={idx}
                                            className="flex gap-2 animate-fade-in text-[#5c297c]"
                                        >
                                            <input
                                                type="text"
                                                value={`${record.year_level} Year - Sem ${record.semester}`}
                                                className={`${inputClass} bg-gray-50 border-gray-200 font-medium`}
                                                readOnly
                                            />
                                            <input
                                                type="text"
                                                value={record.gwa}
                                                className={`${inputClass} font-bold text-center w-24 bg-gray-50 border-gray-200`}
                                                readOnly
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-400 italic text-sm py-2">
                                        No GWA records found.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4 bg-purple-50/30 p-3 rounded-lg mt-1 text-[#5c297c]">
                            <h3 className="text-[11px] font-bold mb-3 uppercase tracking-widest opacity-70">
                                Update Grade Entry
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[#5c297c]">
                                <CustomSelectGroup
                                    label="Year Level:"
                                    value={data.year_level}
                                    onChange={(e) =>
                                        setData("year_level", e.target.value)
                                    }
                                    options={[
                                        { value: "1", label: "1st Year" },
                                        { value: "2", label: "2nd Year" },
                                        { value: "3", label: "3rd Year" },
                                        { value: "4", label: "4th Year" },
                                    ]}
                                    placeholder="Select Year"
                                    className={selectGroupOverride}
                                    labelClassName={selectLabelOverride}
                                />
                                <CustomSelectGroup
                                    label="Semester:"
                                    value={data.semester}
                                    onChange={(e) =>
                                        setData("semester", e.target.value)
                                    }
                                    options={[
                                        { value: "1ST", label: "1st Semester" },
                                        { value: "2ND", label: "2nd Semester" },
                                    ]}
                                    placeholder="Select Semester"
                                    className={selectGroupOverride}
                                    labelClassName={selectLabelOverride}
                                />
                            </div>

                            <div className="mt-3 w-full text-[#5c297c]">
                                <label className={labelClass}>
                                    General Weighted Average:
                                </label>
                                <TextInput
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={data.gwa}
                                    onChange={(e) =>
                                        setData("gwa", e.target.value)
                                    }
                                    className={inputClass}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-4 mb-2 flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="px-6 py-2.5 text-sm font-bold text-[#666] bg-white border border-[#ddd] rounded-[6px] hover:bg-[#ffb736] hover:text-white transition-all duration-300 shadow-sm ease-in-out font-montserrat"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={processing || !isFormValid}
                                className={`px-6 py-2.5 text-sm font-bold text-white rounded-[6px] transition-all duration-300 shadow-md ease-in-out font-montserrat
                                    ${
                                        !isFormValid
                                            ? "bg-gray-400 cursor-not-allowed opacity-70"
                                            : "bg-[#5c297c] hover:bg-[#ffb736] cursor-pointer"
                                    }`}
                            >
                                {processing ? "Saving..." : "Update GWA"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* CALLING THE REUSABLE MODAL */}
                <ConfirmSaveModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={submit}
                    message={
                        <>
                            Are you sure you want to update the GWA record for{" "}
                            <br />
                            <strong>{studentName}</strong>?
                        </>
                    }
                />
            </div>
        </div>
    );
}
