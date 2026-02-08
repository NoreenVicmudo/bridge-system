import React, { useState, useEffect } from "react";

export default function AddStudentModal({ isOpen, onClose }) {
    const [view, setView] = useState("options");
    const [checkStatus, setCheckStatus] = useState("idle");
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
            setView("options");
            setCheckStatus("idle");
        }
    }, [isOpen]);

    // --- NEW CLOSE LOGIC (Animation first, then unmount) ---
    const closeModal = () => {
        setAnimate(false); // 1. Start Fade Out
        setTimeout(() => {
            onClose();     // 2. Unmount after 300ms
        }, 300);
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[1000] flex items-center justify-center transition-all duration-300 ${animate ? "bg-gray-900/60 backdrop-blur-sm" : "bg-transparent backdrop-blur-none pointer-events-none"}`}>
            
            {/* Modal Card */}
            <div className={`bg-white rounded-2xl w-[90%] max-w-[500px] p-0 shadow-2xl relative flex flex-col overflow-hidden transition-all duration-300 transform ${animate ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
                
                {/* Header */}
                <div className="bg-[#5c297c] p-6 text-center relative">
                    <h2 className="text-2xl font-bold text-white tracking-wide">Add New Student</h2>
                    <p className="text-purple-200 text-sm mt-1">Choose how you want to add records</p>
                    
                    {/* Close Button (X) */}
                    <button 
                        onClick={closeModal} // Uses new close logic
                        className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/20 rounded-full p-1 transition-all"
                    >
                        <i className="bi bi-x-lg text-xl"></i>
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-8">
                    
                    {/* --- VIEW 1: INITIAL OPTIONS --- */}
                    {view === "options" && (
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setView("import")}
                                className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-gray-100 rounded-xl hover:border-[#5c297c] hover:bg-purple-50 group transition-all duration-300"
                            >
                                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-[#5c297c] transition-colors">
                                    <i className="bi bi-file-earmark-excel text-2xl text-[#5c297c] group-hover:text-white transition-colors"></i>
                                </div>
                                <span className="text-gray-700 font-bold group-hover:text-[#5c297c]">Import File</span>
                            </button>

                            <button 
                                onClick={() => setView("manual")}
                                className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-gray-100 rounded-xl hover:border-[#5c297c] hover:bg-purple-50 group transition-all duration-300"
                            >
                                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-[#5c297c] transition-colors">
                                    <i className="bi bi-person-plus text-2xl text-[#5c297c] group-hover:text-white transition-colors"></i>
                                </div>
                                <span className="text-gray-700 font-bold group-hover:text-[#5c297c]">Manual Entry</span>
                            </button>
                        </div>
                    )}

                    {/* --- VIEW 2: IMPORT FILE --- */}
                    {view === "import" && (
                        <div className="flex flex-col gap-5 animate-fade-in-up">
                            <div className="border-2 border-dashed border-[#5c297c]/30 rounded-xl p-10 text-center bg-gray-50 hover:bg-[#5c297c]/5 transition-colors cursor-pointer group">
                                <i className="bi bi-cloud-arrow-up text-5xl text-[#5c297c] mb-3 block group-hover:scale-110 transition-transform duration-300"></i>
                                <p className="text-gray-600 font-medium">Drag & Drop your Excel file here</p>
                                <p className="text-sm text-gray-400 mt-1 mb-4">Supports .xlsx, .csv</p>
                                <span className="px-5 py-2 bg-white border border-[#5c297c] text-[#5c297c] font-bold rounded-lg text-sm group-hover:bg-[#5c297c] group-hover:text-white transition-all">
                                    Browse Files
                                </span>
                            </div>
                            <button onClick={() => setView("options")} className="text-gray-400 hover:text-gray-600 text-sm font-medium self-center">
                                ← Back to Options
                            </button>
                        </div>
                    )}

                    {/* --- VIEW 3: MANUAL ENTRY --- */}
                    {view === "manual" && (
                        <div className="flex flex-col gap-5 animate-fade-in-up">
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                <label className="block text-sm font-bold text-[#5c297c] mb-2">Check Student ID</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="e.g. 2023-1005" 
                                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c297c] focus:border-transparent outline-none transition-all"
                                    />
                                    <button 
                                        onClick={() => {
                                            setCheckStatus("loading");
                                            setTimeout(() => setCheckStatus(Math.random() > 0.5 ? "exists" : "not_exists"), 800);
                                        }}
                                        className="px-6 py-2.5 bg-[#5c297c] text-white font-bold rounded-lg hover:bg-[#4a1f63] shadow-md hover:shadow-lg transition-all"
                                    >
                                        {checkStatus === "loading" ? <div className="loader-dots">...</div> : "Check"}
                                    </button>
                                </div>
                            </div>

                            {/* Status Messages */}
                            {checkStatus === "exists" && (
                                <div className="flex items-center gap-3 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 animate-pulse">
                                    <i className="bi bi-exclamation-circle-fill text-xl"></i>
                                    <span className="text-sm font-medium">Student ID already exists!</span>
                                </div>
                            )}

                            {checkStatus === "not_exists" && (
                                <div className="flex flex-col gap-3 items-center animate-fade-in">
                                    <div className="flex items-center gap-2 text-green-600 font-medium">
                                        <i className="bi bi-check-circle-fill text-xl"></i>
                                        <span>ID is available!</span>
                                    </div>
                                    <button className="w-full py-3 bg-[#ffb736] text-white font-bold rounded-lg shadow-md hover:bg-[#e0a800] hover:scale-[1.02] transition-all">
                                        Proceed to Registration
                                    </button>
                                </div>
                            )}

                            <button onClick={() => setView("options")} className="text-gray-400 hover:text-gray-600 text-sm font-medium self-center mt-2">
                                ← Back to Options
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}