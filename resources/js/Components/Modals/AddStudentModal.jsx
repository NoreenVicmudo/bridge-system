import React, { useState, useEffect } from "react";
import { router, useForm } from "@inertiajs/react";
import axios from "axios"; // Make sure to have axios installed, or use standard fetch!

export default function AddStudentModal({ isOpen, onClose, filterMode = 'section', currentFilters = {} }) {
    const [view, setView] = useState("options");
    const [checkStatus, setCheckStatus] = useState("idle");
    const [animate, setAnimate] = useState(false);
    
    // Track the actual input value
    const [studentNumberInput, setStudentNumberInput] = useState("");

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
            setView("options");
            setCheckStatus("idle");
            setStudentNumberInput(""); // Reset input on open
        }
    }, [isOpen]);

    const closeModal = () => {
        setAnimate(false);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    // --- THE REAL DATABASE CHECK ---
    const handleCheck = async () => {
        if (!studentNumberInput.trim()) return;
        
        setCheckStatus("loading");
        
        try {
            // Ask Laravel if this student exists
            const response = await axios.get(`/api/check-student/${studentNumberInput}`);
            setCheckStatus(response.data.exists ? "exists" : "not_exists");
        } catch (error) {
            console.error("Error checking student ID:", error);
            setCheckStatus("idle"); // Reset on error
        }
    };

    // --- THE REAL REDIRECTION ---
    const handleProceed = () => {
        closeModal();
        const params = new URLSearchParams({
            prefilledId: studentNumberInput,
            mode: filterMode,
        });

        if (filterMode === 'section') {
            params.append('academic_year', currentFilters.academic_year || '');
            params.append('semester', currentFilters.semester || '');
            params.append('college', currentFilters.college || '');
            params.append('program', currentFilters.program || '');
            params.append('year_level', currentFilters.year_level || '');
            params.append('section', currentFilters.section || '');
        } else {
            params.append('college_id', currentFilters.batch_college || '');
            params.append('program_id', currentFilters.batch_program || '');
            params.append('year', currentFilters.batch_year || '');
            params.append('batch_number', currentFilters.board_batch || '');
        }

        router.get('/student-entry', params.toString());
    };

    // FILE UPLOAD - Using axios instead of Inertia's useForm
    const [importFile, setImportFile] = useState(null);
    const [importProcessing, setImportProcessing] = useState(false);
    const [importError, setImportError] = useState(null);

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        if (!importFile) return;
        
        setImportProcessing(true);
        setImportError(null);
        
        const formData = new FormData();
        formData.append('file', importFile);
        
        let endpoint;
        if (filterMode === 'section') {
            endpoint = route('students.import');
            formData.append('academic_year', currentFilters.academic_year || '');
            formData.append('semester', currentFilters.semester || '');
            formData.append('college', currentFilters.college || '');
            formData.append('program', currentFilters.program || '');
            formData.append('year_level', currentFilters.year_level || '');
            formData.append('section', currentFilters.section || '');
        } else {
            endpoint = route('students.import.batch');
            formData.append('college_id', currentFilters.batch_college || '');
            formData.append('program_id', currentFilters.batch_program || '');
            formData.append('year', currentFilters.batch_year || '');
            formData.append('batch_number', currentFilters.board_batch || '');
        }
        
        try {
            const response = await axios.post(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-Requested-With': 'XMLHttpRequest',
                    // Remove X-Inertia header to avoid redirect handling
                }
            });
            if (response.data.success) {
                alert(response.data.message);
                closeModal();
                // Refresh the page to show updated table data
                window.location.reload();
            } else {
                alert('Import failed: ' + response.data.message);
            }
        } catch (error) {
            console.error('Import error:', error);
            const message = error.response?.data?.message || 'Import failed. Please check the file format.';
            alert(message);
            setImportError(message);
        } finally {
            setImportProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[1000] flex items-center justify-center transition-all duration-300 ${animate ? "bg-gray-900/60 backdrop-blur-sm" : "bg-transparent backdrop-blur-none pointer-events-none"}`}>
            <div className={`bg-white rounded-2xl w-[90%] max-w-[500px] p-0 shadow-2xl relative flex flex-col overflow-hidden transition-all duration-300 transform ${animate ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
                
                <div className="bg-[#5c297c] p-6 text-center relative">
                    <h2 className="text-2xl font-bold text-white tracking-wide">Add New Student</h2>
                    <p className="text-purple-200 text-sm mt-1">Choose how you want to add records</p>
                    <button onClick={closeModal} className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/20 rounded-full p-1 transition-all">
                        <i className="bi bi-x-lg text-xl"></i>
                    </button>
                </div>

                <div className="p-8">
                    {view === "options" && (
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setView("import")} className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-gray-100 rounded-xl hover:border-[#5c297c] hover:bg-purple-50 group transition-all duration-300">
                                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-[#5c297c] transition-colors">
                                    <i className="bi bi-file-earmark-excel text-2xl text-[#5c297c] group-hover:text-white transition-colors"></i>
                                </div>
                                <span className="text-gray-700 font-bold group-hover:text-[#5c297c]">Import File</span>
                            </button>

                            <button onClick={() => setView("manual")} className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-gray-100 rounded-xl hover:border-[#5c297c] hover:bg-purple-50 group transition-all duration-300">
                                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-[#5c297c] transition-colors">
                                    <i className="bi bi-person-plus text-2xl text-[#5c297c] group-hover:text-white transition-colors"></i>
                                </div>
                                <span className="text-gray-700 font-bold group-hover:text-[#5c297c]">Manual Entry</span>
                            </button>
                        </div>
                    )}

                    {view === "import" && (
                        <div className="flex flex-col gap-5 animate-fade-in-up">
                            <div className="bg-purple-50 p-5 rounded-lg border border-purple-100 text-center">
                                <i className="bi bi-cloud-arrow-up text-4xl text-[#5c297c] mb-2 block"></i>
                                <h3 className="font-bold text-[#5c297c] mb-1">Upload CSV File</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Enrolling students to: <strong>{currentFilters.section || "Selected Section"}</strong>
                                </p>
                                
                                <form onSubmit={handleImportSubmit} className="flex flex-col gap-3">
                                    <input 
                                        type="file" 
                                        accept=".csv"
                                        onChange={(e) => setImportFile(e.target.files[0])}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-100 file:text-[#5c297c] hover:file:bg-purple-200 cursor-pointer"
                                        required
                                    />
                                    <button 
                                        type="submit"
                                        disabled={importProcessing || !importFile}
                                        className="mt-2 w-full py-2.5 bg-[#5c297c] text-white font-bold rounded-lg hover:bg-[#4a1f63] transition-all disabled:opacity-50"
                                    >
                                        {importProcessing ? "Uploading & Processing..." : "Import Students"}
                                    </button>
                                </form>
                            </div>

                            <button onClick={() => setView("options")} className="text-gray-400 hover:text-gray-600 text-sm font-medium self-center mt-2">
                                ← Back to Options
                            </button>
                        </div>
                    )}

                    {view === "manual" && (
                        <div className="flex flex-col gap-5 animate-fade-in-up">
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                <label className="block text-sm font-bold text-[#5c297c] mb-2">Check Student ID</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={studentNumberInput}
                                        onChange={(e) => setStudentNumberInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                                        placeholder="e.g. 2025-1005" 
                                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c297c] focus:border-transparent outline-none transition-all"
                                    />
                                    <button 
                                        onClick={handleCheck}
                                        disabled={!studentNumberInput.trim() || checkStatus === "loading"}
                                        className="px-6 py-2.5 bg-[#5c297c] text-white font-bold rounded-lg hover:bg-[#4a1f63] shadow-md hover:shadow-lg transition-all disabled:opacity-60"
                                    >
                                        {checkStatus === "loading" ? "..." : "Check"}
                                    </button>
                                </div>
                            </div>

                            {/* UX UPGRADE: Don't show an error if they exist. Show an "Enroll" prompt! */}
                            {checkStatus === "exists" && (
                                <div className="flex flex-col gap-3 items-center animate-fade-in">
                                    <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 w-full justify-center rounded-lg border border-blue-100">
                                        <i className="bi bi-info-circle-fill text-xl"></i>
                                        <span className="text-sm font-medium">Student found! You can proceed to enroll them.</span>
                                    </div>
                                    <button onClick={handleProceed} className="w-full py-3 bg-[#ffb736] text-white font-bold rounded-lg shadow-md hover:bg-[#e0a800] hover:scale-[1.02] transition-all">
                                        Proceed to Enroll
                                    </button>
                                </div>
                            )}

                            {checkStatus === "not_exists" && (
                                <div className="flex flex-col gap-3 items-center animate-fade-in">
                                    <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 w-full justify-center rounded-lg border border-green-100">
                                        <i className="bi bi-check-circle-fill text-xl"></i>
                                        <span className="text-sm font-medium">New Student! Proceed to create profile.</span>
                                    </div>
                                    <button onClick={handleProceed} className="w-full py-3 bg-[#ffb736] text-white font-bold rounded-lg shadow-md hover:bg-[#e0a800] hover:scale-[1.02] transition-all">
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