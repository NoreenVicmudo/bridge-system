import React, { useState, useEffect, useRef } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";
import { toast } from "react-toastify";

export default function MockAddStudentModal({ isOpen, onClose, currentFilter, subjectHeaders = [], onImportSuccess }) {
    const [view, setView] = useState("options");
    const [animate, setAnimate] = useState(false);
    const [studentNumber, setStudentNumber] = useState("");
    const [checkStatus, setCheckStatus] = useState("idle");
    const [importFile, setImportFile] = useState(null);
    const [importProcessing, setImportProcessing] = useState(false);
    const [importError, setImportError] = useState(null);

    const fileInputRef = useRef(null); 

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
            setView("options");
            setStudentNumber("");
            setCheckStatus("idle");
            setImportFile(null);
            setImportError(null);
            document.body.style.overflow = "hidden"; 
        } else {
            document.body.style.overflow = "unset"; 
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const closeModal = () => {
        setAnimate(false);
        setTimeout(onClose, 300);
    };

    const handleCheckStudent = async () => {
        if (!studentNumber.trim()) return;
        setCheckStatus("loading");
        try {
            const response = await axios.get(route('api.check.student', studentNumber));
            setCheckStatus(response.data.exists ? "exists" : "not_exists");
        } catch {
            setCheckStatus("error");
            toast.error("Failed to communicate with server."); 
        }
    };

    const handleProceedToEdit = () => {
        router.get(route('mock.scores.entry'), { 
            student_number: studentNumber,
            calendar_year: currentFilter.calendar_year,
            batch_number: currentFilter.batch_number
        });
        closeModal();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImportFile(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        if (!importFile) return;
        setImportProcessing(true);
        setImportError(null);

        const formData = new FormData();
        formData.append('file', importFile);
        formData.append('filter', JSON.stringify(currentFilter));
        
        try {
            const response = await axios.post(route('mock-scores.import'), formData, { 
                headers: { 'Content-Type': 'multipart/form-data' } 
            });
            if (response.data.success) {
                toast.success(response.data.message); 
                if (onImportSuccess) onImportSuccess();
                closeModal();
                router.reload({ only: ['students'] });
            } else {
                toast.error(response.data.message); 
                setImportError(response.data.message);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Import failed. Please check the file format.';
            toast.error(errorMsg); 
            setImportError(errorMsg);
        } finally {
            setImportProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 p-4 ${animate ? "bg-gray-900/60 backdrop-blur-sm" : "bg-transparent backdrop-blur-none pointer-events-none"}`}>
            <div className={`bg-white rounded-2xl w-full max-w-[500px] p-0 shadow-2xl relative flex flex-col overflow-hidden transition-all duration-300 transform ${animate ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
                <div className="bg-[#5c297c] p-6 text-center relative shrink-0">
                    <h2 className="text-2xl font-bold text-white tracking-wide">Manage Mock Board Scores</h2>
                    <p className="text-purple-200 text-sm mt-1">Import CSV or edit a student's scores</p>
                    <button onClick={closeModal} className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/20 rounded-full p-1 transition-all">
                        <i className="bi bi-x-lg text-xl"></i>
                    </button>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto max-h-[70vh] flex-1">
                    {view === "options" && (
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setView("import")} className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-gray-100 rounded-xl hover:border-[#5c297c] hover:bg-purple-50 group transition-all duration-300">
                                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-[#5c297c] transition-colors">
                                    <i className="bi bi-file-earmark-excel text-2xl text-[#5c297c] group-hover:text-white transition-colors"></i>
                                </div>
                                <span className="text-gray-700 font-bold group-hover:text-[#5c297c]">Import CSV</span>
                            </button>
                            <button onClick={() => setView("manual")} className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-gray-100 rounded-xl hover:border-[#5c297c] hover:bg-purple-50 group transition-all duration-300">
                                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-[#5c297c] transition-colors">
                                    <i className="bi bi-pencil-square text-2xl text-[#5c297c] group-hover:text-white transition-colors"></i>
                                </div>
                                <span className="text-gray-700 font-bold group-hover:text-[#5c297c]">Edit Student</span>
                            </button>
                        </div>
                    )}

                    {view === "import" && (
                        <form onSubmit={handleImportSubmit} className="flex flex-col gap-4 animate-fade-in-up">
                            <div className="text-center mb-1">
                                <h3 className="font-bold text-[#5c297c] text-lg">Upload Mock Scores Data</h3>
                                <p className="text-xs text-gray-600 mt-1">
                                    Expected columns: <strong>student_number</strong> + Exact subject names like <strong>"{subjectHeaders[0] || 'Subject 1'} (%)"</strong>.
                                </p>
                            </div>

                            <label className="border-2 border-dashed border-[#5c297c]/30 rounded-xl p-10 text-center bg-gray-50 hover:bg-[#5c297c]/5 transition-colors cursor-pointer group relative block">
                                <input 
                                    type="file" 
                                    accept=".csv"
                                    ref={fileInputRef} // 🧠 FIXED: Attached ref
                                    onChange={handleFileChange}
                                    className="hidden"                                    
                                />
                                <i className="bi bi-cloud-arrow-up text-5xl text-[#5c297c] mb-3 block group-hover:scale-110 transition-transform duration-300"></i>
                                
                                {importFile ? (
                                    <p className="text-[#5c297c] font-bold truncate px-4">{importFile.name}</p>
                                ) : (
                                    <p className="text-gray-600 font-medium">Drag & Drop your CSV file here</p>
                                )}
                                
                                <p className="text-sm text-gray-400 mt-1 mb-4">Supports .csv</p>
                                
                                <span className="px-5 py-2 bg-white border border-[#5c297c] text-[#5c297c] font-bold rounded-lg text-sm group-hover:bg-[#5c297c] group-hover:text-white transition-all inline-block">
                                    {importFile ? "Change File" : "Browse Files"}
                                </span>
                            </label>

                            {importError && <div className="text-red-500 text-xs font-medium text-center">{importError}</div>}

                            <button 
                                type="submit"
                                disabled={importProcessing || !importFile}
                                className="w-full py-3 bg-[#5c297c] text-white font-bold rounded-lg shadow-md hover:bg-[#4a1f63] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {importProcessing ? "Uploading & Processing..." : "Import Records"}
                            </button>

                            <button 
                                type="button" 
                                onClick={() => { setView("options"); setImportFile(null); setImportError(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} 
                                className="text-gray-400 hover:text-gray-600 text-sm font-medium self-center mt-1"
                            >
                                ← Back to Options
                            </button>
                        </form>
                    )}

                    {view === "manual" && (
                        <div className="flex flex-col gap-5 animate-fade-in-up">
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                <label className="block text-sm font-bold text-[#5c297c] mb-2">Check Student ID</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={studentNumber}
                                        onChange={(e) => setStudentNumber(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCheckStudent()}
                                        placeholder="e.g. 2025-1005" 
                                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c297c] focus:border-transparent outline-none transition-all"
                                    />
                                    <button 
                                        onClick={handleCheckStudent}
                                        disabled={!studentNumber.trim() || checkStatus === "loading"}
                                        className="px-6 py-2.5 bg-[#5c297c] text-white font-bold rounded-lg hover:bg-[#4a1f63] shadow-md transition-all disabled:opacity-60"
                                    >
                                        {checkStatus === "loading" ? "..." : "Check"}
                                    </button>
                                </div>
                            </div>

                            {checkStatus === "exists" && (
                                <div className="flex flex-col gap-3 items-center animate-fade-in">
                                    <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 w-full justify-center rounded-lg border border-blue-100">
                                        <i className="bi bi-info-circle-fill text-xl"></i>
                                        <span className="text-sm font-medium">Student found! Proceed to update scores.</span>
                                    </div>
                                    <button 
                                        onClick={handleProceedToEdit} 
                                        className="w-full py-3 bg-[#ffb736] text-white font-bold rounded-lg shadow-md hover:bg-[#e0a800] hover:scale-[1.02] transition-all"
                                    >
                                        Proceed to Entry
                                    </button>
                                </div>
                            )}

                            {checkStatus === "not_exists" && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 w-full justify-center rounded-lg border border-red-100 animate-fade-in">
                                    <i className="bi bi-exclamation-triangle-fill text-xl"></i>
                                    <span className="text-sm font-medium">Student not found in the masterlist.</span>
                                </div>
                            )}

                            {checkStatus === "error" && (
                                <div className="p-3 bg-red-50 text-red-700 w-full text-center rounded-lg border border-red-100 text-sm font-medium">
                                    Error communicating with server.
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