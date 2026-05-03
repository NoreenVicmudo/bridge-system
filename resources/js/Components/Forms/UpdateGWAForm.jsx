import React, { useState, useEffect } from "react";
import TextInput from "@/Components/TextInput";
import CustomSelectGroup from "@/Components/SelectGroup";
import ConfirmSaveModal from "@/Components/Modals/ConfirmSaveModal";

export default function UpdateGWAForm({
    data,
    setData,
    errors = {},
    processing = false,
    submit,
    studentName,
    studentNumber,
    gwaRecords = [],
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const inputClass = "w-full border-gray-300 rounded-[5px] shadow-sm text-sm p-2 focus:border-[#ffb736] focus:ring-[#ffb736] focus:ring-1 focus:outline-none transition-colors duration-200";
    const labelClass = "block mb-0.5 font-bold text-sm text-[#5c297c]";

    const selectGroupOverride = "!flex-col !items-start !gap-0.5 mb-0 w-full !whitespace-nowrap";
    const selectLabelOverride = "!w-full !text-left !font-bold !text-[#5c297c] !mb-0 !whitespace-nowrap";

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
                    <label className={labelClass}>Current GWA Records:</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        {gwaRecords.length > 0 ? (
                            gwaRecords.map((record, idx) => (
                                <div key={idx} className="flex gap-2 animate-fade-in text-[#5c297c]">
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

                {/* Update Section */}
                <div className="border-t border-gray-100 pt-5 bg-purple-50/30 p-4 rounded-lg mt-2">
                    <h3 className="text-[11px] font-bold mb-4 uppercase tracking-widest opacity-70">Update Grade Entry</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <CustomSelectGroup
                                label="Year Level:"
                                value={data.year_level}
                                onChange={(e) => setData("year_level", e.target.value)}
                                options={[
                                    { value: "1", label: "1st Year" },
                                    { value: "2", label: "2nd Year" },
                                    { value: "3", label: "3rd Year" },
                                    { value: "4", label: "4th Year" },
                                ]}
                                placeholder="Select Year"
                                vertical={true}
                                className={selectGroupOverride}
                                labelClassName={selectLabelOverride}
                            />
                        </div>
                        <div>
                            <CustomSelectGroup
                                label="Semester:"
                                value={data.semester}
                                onChange={(e) => setData("semester", e.target.value)}
                                options={[
                                    { value: "1ST", label: "1st Semester" },
                                    { value: "2ND", label: "2nd Semester" },
                                ]}
                                placeholder="Select Semester"
                                vertical={true}
                                className={selectGroupOverride}
                                labelClassName={selectLabelOverride}
                            />
                        </div>
                    </div>

                    <div className="mt-4 w-full">
                        <label className={labelClass}>General Weighted Average:</label>
                        <TextInput
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={data.gwa}
                            onChange={(e) => setData("gwa", e.target.value)}
                            className={inputClass}
                            required
                        />
                        {errors.gwa && <div className="text-red-500 text-xs mt-1">{errors.gwa}</div>}
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
                        {processing ? "Saving..." : "Update GWA"}
                    </button>
                </div>
            </form>

            <ConfirmSaveModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirm}
                message={
                    <>
                        Are you sure you want to update the GWA record for <br />
                        <strong>{studentName}</strong>?
                    </>
                }
            />
        </div>
    );
}