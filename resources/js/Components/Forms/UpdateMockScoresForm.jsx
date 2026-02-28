import React, { useState, useEffect } from "react";
import TextInput from "@/Components/TextInput";
import CustomSelectGroup from "@/Components/SelectGroup";
import ConfirmSaveModal from "@/Components/Modals/ConfirmSaveModal";

export default function UpdateMockScoresForm({
    data,
    setData,
    errors = {},
    processing = false,
    submit,
    studentName,
    subjectOptions = [], // Mock subjects list: [{ value, label }]
    studentScores = {}, // Existing scores: { subject_id: score }
    totalScores = {}, // Existing totals: { subject_id: total }
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

    const isFormValid =
        data.mock_subject_id &&
        data.student_score !== "" &&
        data.total_score !== "";

    // Auto-fill logic when a subject is selected
    useEffect(() => {
        if (data.mock_subject_id) {
            setData((prev) => ({
                ...prev,
                student_score: studentScores[data.mock_subject_id] ?? "",
                total_score: totalScores[data.mock_subject_id] ?? "",
            }));
        }
    }, [data.mock_subject_id]);

    const openConfirmModal = (e) => {
        e.preventDefault();
        if (isFormValid) setIsModalOpen(true);
    };

    return (
        <div className="flex justify-center w-full px-4 py-0 h-[calc(100vh-100px)] items-start overflow-hidden font-montserrat text-left text-[#5c297c]">
            <div className="w-full max-w-2xl bg-white rounded-[10px] shadow-[0_6px_25px_rgba(0,0,0,0.1)] px-6 py-4 md:px-8 md:py-5 flex flex-col max-h-full my-2 relative">
                <h2 className="text-center text-xl md:text-2xl font-bold mb-3 flex-shrink-0">
                    Mock Board Scores Overview
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

                        {/* List Overview */}
                        <div className="border-t border-gray-100 pt-3">
                            <label className={labelClass}>
                                Board Subjects and Results:
                            </label>
                            <div className="space-y-2 mt-2">
                                {subjectOptions.length > 0 ? (
                                    subjectOptions.map((sub) => (
                                        <div
                                            key={sub.value}
                                            className="flex items-center gap-2 animate-fade-in"
                                        >
                                            <input
                                                type="text"
                                                value={sub.label}
                                                className={`${inputClass} bg-gray-50 border-gray-200 font-medium`}
                                                readOnly
                                            />
                                            <div className="flex items-center gap-1 font-bold">
                                                <input
                                                    type="text"
                                                    value={
                                                        studentScores[
                                                            sub.value
                                                        ] ?? "-"
                                                    }
                                                    className={`${inputClass} text-center w-16 bg-gray-50 border-gray-200`}
                                                    readOnly
                                                />
                                                <span>/</span>
                                                <input
                                                    type="text"
                                                    value={
                                                        totalScores[
                                                            sub.value
                                                        ] ?? "-"
                                                    }
                                                    className={`${inputClass} text-center w-16 bg-gray-50 border-gray-200`}
                                                    readOnly
                                                />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-400 italic text-sm py-2 text-center">
                                        No subjects found.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Update Section */}
                        <div className="border-t border-gray-100 pt-4 bg-purple-50/30 p-3 rounded-lg mt-1">
                            <h3 className="text-[11px] font-bold mb-3 uppercase tracking-widest opacity-70">
                                Update Mock Exam Score
                            </h3>

                            <div className="w-full mb-3">
                                <CustomSelectGroup
                                    label="Select Subject:"
                                    value={data.mock_subject_id}
                                    onChange={(e) =>
                                        setData(
                                            "mock_subject_id",
                                            e.target.value,
                                        )
                                    }
                                    options={subjectOptions}
                                    placeholder="Choose Subject"
                                    vertical={true}
                                    className={selectGroupOverride}
                                    labelClassName={selectLabelOverride}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="w-full">
                                    <label className={labelClass}>Score:</label>
                                    <TextInput
                                        type="number"
                                        placeholder="0"
                                        value={data.student_score}
                                        onChange={(e) =>
                                            setData(
                                                "student_score",
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                        required
                                    />
                                </div>
                                <div className="w-full">
                                    <label className={labelClass}>
                                        Total Score:
                                    </label>
                                    <TextInput
                                        type="number"
                                        placeholder="0"
                                        value={data.total_score}
                                        onChange={(e) =>
                                            setData(
                                                "total_score",
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
                                {processing ? "Saving..." : "Update Scores"}
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
                            Are you sure you want to update the mock board
                            scores for <br />
                            <strong>{studentName}</strong>?
                        </>
                    }
                />
            </div>
        </div>
    );
}
