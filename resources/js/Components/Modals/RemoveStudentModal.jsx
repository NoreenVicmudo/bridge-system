import React, { useState, useEffect } from "react";
import axios from "axios";
import CustomSelectGroup from "@/Components/SelectGroup";

export default function RemoveStudentModal({
    isOpen,
    onClose,
    selectedStudents,
    onSuccess, // optional callback after deletion
}) {
    const [mode, setMode] = useState("single");
    const [animate, setAnimate] = useState(false);
    const [singleReason, setSingleReason] = useState("");
    const [individualReasons, setIndividualReasons] = useState({});
    const [deleting, setDeleting] = useState(false);

    const REASON_OPTIONS = [
        { value: "Transferred", label: "Transferred out" },
        { value: "Dropped", label: "Dropped / Withdrawn" },
        { value: "Error", label: "Entry Error" },
        { value: "Graduated", label: "Graduated" },
    ];

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
            setSingleReason("");
            setIndividualReasons({});
            setDeleting(false);
        }
    }, [isOpen]);

    const closeModal = () => {
        setAnimate(false);
        setTimeout(onClose, 300);
    };

    const isReadyToRemove = () => {
        if (mode === "single") return singleReason !== "";
        return (
            selectedStudents.length > 0 &&
            selectedStudents.every(s => individualReasons[s.id] && individualReasons[s.id] !== "")
        );
    };

    const handleConfirm = async () => {
        if (!isReadyToRemove()) return;

        setDeleting(true);
        try {
            const payload = {
                students: selectedStudents.map(s => s.id),
                reason_mode: mode,
                location: window.location.pathname.includes("masterlist") ? "MASTERLIST" : "STUDENT_INFO",
            };
            if (mode === "single") {
                payload.reason = singleReason;
            } else {
                payload.per_reasons = individualReasons;
            }

            const response = await axios.post(route('students.bulk-destroy'), payload);
            if (response.data.success) {
                alert(`Successfully deleted ${response.data.deleted_count} student(s).`);
                if (onSuccess) onSuccess();
                closeModal();
                window.location.reload();
            } else {
                alert('Deletion failed: ' + response.data.message);
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('An error occurred while deleting students.');
        } finally {
            setDeleting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[1000] flex items-center justify-center transition-all duration-300 ${animate ? "bg-gray-900/60 backdrop-blur-sm" : "bg-transparent pointer-events-none"}`}>
            <style>{`
                .modal-scroll-area::-webkit-scrollbar, 
                .modal-scroll-area ul::-webkit-scrollbar { width: 6px; }
                .modal-scroll-area::-webkit-scrollbar-thumb, 
                .modal-scroll-area ul::-webkit-scrollbar-thumb { background-color: #5c297c; border-radius: 10px; }
                .modal-scroll-area::-webkit-scrollbar-track, 
                .modal-scroll-area ul::-webkit-scrollbar-track { background: transparent; }
            `}</style>

            <div className={`bg-white rounded-2xl w-[95%] max-w-[600px] shadow-2xl relative flex flex-col transition-all duration-300 transform overflow-visible ${animate ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
                {/* Header */}
                <div className="bg-red-50 p-6 border-b border-red-100 flex items-start gap-4 rounded-t-2xl relative z-[100]">
                    <div className="bg-red-100 p-3 rounded-full shrink-0">
                        <i className="bi bi-exclamation-triangle-fill text-2xl text-red-500"></i>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-800">Remove Students</h2>
                        <p className="text-gray-500 text-sm mt-1">
                            Removing <strong className="text-red-600">{selectedStudents.length}</strong> record(s).
                        </p>
                    </div>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                        <i className="bi bi-x-lg text-lg"></i>
                    </button>
                </div>

                <div className="p-6 overflow-visible">
                    {/* Mode Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-lg mb-6 relative z-[100]">
                        <button onClick={() => setMode("single")} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === "single" ? "bg-white text-[#5c297c] shadow-sm" : "text-gray-500"}`}>
                            Single Reason
                        </button>
                        <button onClick={() => setMode("multiple")} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === "multiple" ? "bg-white text-[#5c297c] shadow-sm" : "text-gray-500"}`}>
                            Specific Reasons
                        </button>
                    </div>

                    {/* Scrollable Area */}
                    <div className="modal-scroll-area max-h-[350px] overflow-y-auto overflow-x-visible pr-2">
                        {mode === "single" ? (
                            <div className="flex flex-col gap-4 animate-fade-in relative z-[90]">
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Target Students:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedStudents.map((s) => (
                                            <span key={s.id} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-white border border-gray-200 text-[#5c297c]">
                                                {s.student_number}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <CustomSelectGroup
                                    label="Reason"
                                    value={singleReason}
                                    onChange={(e) => setSingleReason(e.target.value)}
                                    options={REASON_OPTIONS}
                                    vertical={true}
                                    className="!mb-0"
                                />
                                <div className="h-32"></div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 animate-fade-in pb-40">
                                {selectedStudents.map((student) => (
                                    <div key={student.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg relative z-10 hover:z-[60] bg-white transition-all">
                                        <div className="flex flex-col max-w-[50%]">
                                            <span className="text-sm font-bold text-gray-800 truncate">{student.name}</span>
                                            <span className="text-xs text-gray-500">{student.student_number}</span>
                                        </div>
                                        <div className="w-[180px]">
                                            <CustomSelectGroup
                                                value={individualReasons[student.id] || ""}
                                                onChange={(e) => setIndividualReasons(prev => ({ ...prev, [student.id]: e.target.value }))}
                                                options={REASON_OPTIONS}
                                                placeholder="Reason..."
                                                vertical={true}
                                                className="!mb-0 !gap-0"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl relative z-[100]">
                    <button onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100">
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!isReadyToRemove() || deleting}
                        className={`px-5 py-2.5 text-sm font-bold text-white rounded-lg shadow-md transition-all flex items-center gap-2 ${isReadyToRemove() && !deleting ? "bg-red-500 hover:bg-red-600" : "bg-gray-400 cursor-not-allowed opacity-70"}`}
                    >
                        {deleting ? (
                            <div className="loader w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <><i className="bi bi-trash"></i> Confirm Removal</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}