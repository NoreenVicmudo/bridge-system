import React, { useState, useEffect } from "react";
import TextInput from "@/Components/TextInput";
import CustomSelectGroup from "@/Components/SelectGroup";
import ConfirmSaveModal from "@/Components/Modals/ConfirmSaveModal";

export default function UpdateBoardScoresForm({
    data, setData, errors = {}, processing = false, submit,
    studentName, studentNumber, subjectOptions = [], currentScores = {} 
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const inputClass = "w-full border-gray-300 rounded-[5px] shadow-sm text-sm p-2 focus:border-[#ffb736] focus:ring-[#ffb736] focus:ring-1 focus:outline-none transition-colors duration-200";
    const labelClass = "block mb-0.5 font-bold text-sm text-[#5c297c]";

    // 🧠 Form is only valid if Exam Period is also provided!
    const isFormValid = data.mock_subject_id && data.score !== "" && data.exam_period;

    useEffect(() => {
        if (data.mock_subject_id) {
            setData("score", currentScores[data.mock_subject_id] ?? "");
        }
    }, [data.mock_subject_id]);

    const handleConfirm = () => {
        setIsModalOpen(false);
        submit();
    };

    return (
        <div className="w-full font-montserrat text-left text-[#5c297c]">
            <form onSubmit={(e) => { e.preventDefault(); if (isFormValid) setIsModalOpen(true); }} className="flex flex-col gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Student ID:</label>
                        <TextInput value={studentNumber} className={`${inputClass} bg-gray-100 cursor-not-allowed font-bold`} readOnly />
                    </div>
                    <div>
                        <label className={labelClass}>Student Name:</label>
                        <TextInput value={studentName} className={`${inputClass} bg-gray-100 cursor-not-allowed font-bold`} readOnly />
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mt-2">
                    <label className={labelClass}>Previous {data.exam_period || 'Exam'} Results:</label>
                    <div className="space-y-2 mt-2">
                        {subjectOptions.map((sub) => (
                            <div key={sub.value} className="flex items-center gap-2">
                                <input type="text" value={sub.label} className={`${inputClass} bg-gray-50 border-gray-200`} readOnly />
                                <input type="text" value={currentScores[sub.value] !== undefined ? `${currentScores[sub.value]}%` : "-"} className={`${inputClass} text-center w-24 bg-gray-50 border-gray-200 font-bold`} readOnly />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-5 bg-purple-50/30 p-4 rounded-lg mt-3">
                    <h3 className="text-[11px] font-bold mb-4 uppercase tracking-widest opacity-70">Update Board Exam Score</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* 🧠 NEW: EXAM PERIOD DROPDOWN */}
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
                                className="w-full mb-0" 
                                vertical={true} 
                            />
                        </div>
                        
                        <div>
                            <CustomSelectGroup 
                                label="Select Subject:" 
                                value={data.mock_subject_id} 
                                onChange={(e) => setData("mock_subject_id", e.target.value)} 
                                options={subjectOptions} 
                                className="w-full mb-0" 
                                vertical={true} 
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Percentage Score (%):</label>
                        <TextInput 
                            type="number" 
                            step="0.01" 
                            max="100" 
                            placeholder="0.00" 
                            value={data.score} 
                            onChange={(e) => setData("score", e.target.value)} 
                            className={inputClass} 
                            required 
                        />
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <button 
                        type="submit" 
                        disabled={!isFormValid || processing} 
                        className={`px-10 py-3 text-sm font-bold text-white rounded-[6px] shadow-md transition-all ${
                            !isFormValid ? "bg-gray-400 opacity-70 cursor-not-allowed" : "bg-[#5c297c] hover:bg-[#ffb736]"
                        }`}
                    >
                        {processing ? "Saving..." : "Save Score"}
                    </button>
                </div>
            </form>
            
            <ConfirmSaveModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onConfirm={handleConfirm} 
                message={<>Update <strong>{data.exam_period}</strong> board exam scores for <br/><strong>{studentName}</strong>?</>} 
            />
        </div>
    );
}