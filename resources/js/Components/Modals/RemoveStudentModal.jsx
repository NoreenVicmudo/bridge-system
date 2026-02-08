import React, { useState, useEffect } from "react";

export default function RemoveStudentModal({ isOpen, onClose, selectedStudents }) {
    const [mode, setMode] = useState("single"); 
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (isOpen) setAnimate(true);
    }, [isOpen]);

    // --- NEW CLOSE LOGIC ---
    const closeModal = () => {
        setAnimate(false); 
        setTimeout(() => {
            onClose(); 
        }, 300);
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[1000] flex items-center justify-center transition-all duration-300 ${animate ? "bg-gray-900/60 backdrop-blur-sm" : "bg-transparent backdrop-blur-none pointer-events-none"}`}>
            
            <div className={`bg-white rounded-2xl w-[90%] max-w-[600px] shadow-2xl relative flex flex-col overflow-hidden transition-all duration-300 transform ${animate ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
                
                {/* Caution Header */}
                <div className="bg-red-50 p-6 border-b border-red-100 flex items-start gap-4">
                    <div className="bg-red-100 p-3 rounded-full">
                        <i className="bi bi-exclamation-triangle-fill text-2xl text-red-500"></i>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-800">Remove Students</h2>
                        <p className="text-gray-500 text-sm mt-1">
                            You are about to remove <strong className="text-red-600">{selectedStudents.length}</strong> student record(s). This action cannot be undone.
                        </p>
                    </div>
                    {/* Close Button */}
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <i className="bi bi-x-lg text-lg"></i>
                    </button>
                </div>

                <div className="p-6">
                    {/* Mode Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                        <button 
                            onClick={() => setMode("single")}
                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === "single" ? "bg-white text-[#5c297c] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Single Reason
                        </button>
                        <button 
                            onClick={() => setMode("multiple")}
                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === "multiple" ? "bg-white text-[#5c297c] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Specific Reasons
                        </button>
                    </div>

                    {/* --- MODE: SINGLE REASON --- */}
                    {mode === "single" && (
                        <div className="flex flex-col gap-4 animate-fade-in">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Selected Students:</p>
                                <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto custom-scrollbar">
                                    {selectedStudents.map(s => (
                                        <span key={s.id} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-white border border-gray-200 text-[#5c297c]">
                                            {s.student_number} - {s.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Reason for Removal</label>
                                <select className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none transition-all">
                                    <option value="">Select a reason...</option>
                                    <option value="Transferred">Transferred out</option>
                                    <option value="Dropped">Dropped / Withdrawn</option>
                                    <option value="Error">Entry Error</option>
                                    <option value="Graduated">Graduated</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* --- MODE: MULTIPLE REASONS --- */}
                    {mode === "multiple" && (
                        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 animate-fade-in">
                            {selectedStudents.map(student => (
                                <div key={student.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-purple-200 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-800">{student.name}</span>
                                        <span className="text-xs text-gray-500">{student.student_number}</span>
                                    </div>
                                    <select className="w-[180px] px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-[#5c297c] focus:border-[#5c297c] outline-none">
                                        <option value="">Reason...</option>
                                        <option value="Transferred">Transferred</option>
                                        <option value="Dropped">Dropped</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button 
                        onClick={closeModal} // Uses new close logic
                        className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        className="px-5 py-2.5 text-sm font-bold text-white bg-red-500 rounded-lg shadow-md hover:bg-red-600 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
                    >
                        <i className="bi bi-trash"></i>
                        Confirm Removal
                    </button>
                </div>
            </div>
        </div>
    );
}