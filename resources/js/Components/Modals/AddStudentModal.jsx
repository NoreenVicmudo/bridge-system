import React, { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";

export default function AddStudentModal({ isOpen, onClose, filterMode = 'section', currentFilters = {} }) {
    const [view, setView] = useState("options");
    const [checkStatus, setCheckStatus] = useState("idle");
    const [animate, setAnimate] = useState(false);
    const [enrolling, setEnrolling] = useState(false);
    
    const [studentNumberInput, setStudentNumberInput] = useState("");

    // FILE UPLOAD STATES
    const [importFile, setImportFile] = useState(null);
    const [importProcessing, setImportProcessing] = useState(false);
    const [importError, setImportError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
            setView("options");
            setCheckStatus("idle");
            setStudentNumberInput("");
            setEnrolling(false);
            setImportFile(null);
            setImportProcessing(false);
            setImportError(null);
        }
    }, [isOpen]);

    // --- CLOSE LOGIC (Animation first, then unmount) ---
    const closeModal = () => {
        setAnimate(false);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    // --- MANUAL ENTRY LOGIC ---
    const handleCheck = async () => {
        if (!studentNumberInput.trim()) return;
        setCheckStatus("loading");
        try {
            const response = await axios.get(`/api/check-student/${studentNumberInput}`);
            setCheckStatus(response.data.exists ? "exists" : "not_exists");
        } catch (error) {
            console.error("Error checking student ID:", error);
            setCheckStatus("idle");
        }
    };

    const handleProceed = async () => {
        if (checkStatus === 'exists') {
            setEnrolling(true);
            try {
                const payload = {
                    student_number: studentNumberInput,
                    mode: filterMode,
                };
                if (filterMode === 'section') {
                    payload.academic_year = currentFilters.academic_year || '';
                    payload.semester = currentFilters.semester || '';
                    payload.college = currentFilters.college || '';
                    payload.program = currentFilters.program || '';
                    payload.year_level = currentFilters.year_level || '';
                    payload.section = currentFilters.section || '';
                } else {
                    payload.batch_college = currentFilters.batch_college || '';
                    payload.batch_program = currentFilters.batch_program || '';
                    payload.batch_year = currentFilters.batch_year || '';
                    payload.batch_number = currentFilters.board_batch || '';
                }
                const response = await axios.post(route('students.direct-enroll'), payload);
                if (response.data.success) {
                    alert(response.data.message);
                    closeModal();
                    window.location.reload();
                } else {
                    alert('Enrollment failed: ' + response.data.message);
                }
            } catch (error) {
                console.error('Enrollment error:', error);
                alert('Enrollment failed. Please try again.');
            } finally {
                setEnrolling(false);
            }
        } else {
            // New student: go to entry page
            const queryObject = {
                prefilledId: studentNumberInput,
                mode: filterMode,
            };

            if (filterMode === 'section') {
                queryObject.academic_year = currentFilters.academic_year || '';
                queryObject.semester = currentFilters.semester || '';
                queryObject.college = currentFilters.college || '';
                queryObject.program = currentFilters.program || '';
                queryObject.year_level = currentFilters.year_level || '';
                queryObject.section = currentFilters.section || '';
            } else {
                queryObject.college_id = currentFilters.batch_college || '';
                queryObject.program_id = currentFilters.batch_program || '';
                queryObject.year = currentFilters.batch_year || '';
                queryObject.batch_number = currentFilters.board_batch || '';
            }

            closeModal();
            router.get(route('students.create'), queryObject);
        }
    };

    // --- IMPORT LOGIC ---
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
                }
            });
            if (response.data.success) {
                alert(response.data.message);
                closeModal();
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
            
            {/* Modal Card */}
            <div className={`bg-white rounded-2xl w-[90%] max-w-[500px] p-0 shadow-2xl relative flex flex-col overflow-hidden transition-all duration-300 transform ${animate ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
                
                {/* Header */}
                <div className="bg-[#5c297c] p-6 text-center relative">
                    <h2 className="text-2xl font-bold text-white tracking-wide">Add New Student</h2>
                    <p className="text-purple-200 text-sm mt-1">Choose how you want to add records</p>
                    
                    {/* Close Button (X) */}
                    <button 
                        onClick={closeModal}
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

                    {/* --- VIEW 2: IMPORT FILE (Old Design + New Form Logic) --- */}
                    {view === "import" && (
                        <form onSubmit={handleImportSubmit} className="flex flex-col gap-4 animate-fade-in-up">
                            
                            {/* Hidden file input wrapped in the gorgeous old design label */}
                            <label className="border-2 border-dashed border-[#5c297c]/30 rounded-xl p-10 text-center bg-gray-50 hover:bg-[#5c297c]/5 transition-colors cursor-pointer group relative block">
                                <input 
                                    type="file" 
                                    accept=".csv, .xlsx"
                                    onChange={(e) => setImportFile(e.target.files[0])}
                                    className="hidden" 
                                    required 
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

                            <button 
                                type="submit"
                                disabled={importProcessing || !importFile}
                                className="w-full py-3 bg-[#5c297c] text-white font-bold rounded-lg shadow-md hover:bg-[#4a1f63] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {importProcessing ? "Uploading & Processing..." : "Import Students"}
                            </button>

                            <button type="button" onClick={() => {setView("options"); setImportFile(null);}} className="text-gray-400 hover:text-gray-600 text-sm font-medium self-center mt-1">
                                ← Back to Options
                            </button>
                        </form>
                    )}

                    {/* --- VIEW 3: MANUAL ENTRY (Old Layout + New Logic) --- */}
                    {view === "manual" && (
                        <div className="flex flex-col gap-4 animate-fade-in-up">
                            
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                <label className="block text-sm font-bold text-[#5c297c] mb-2">Check Student ID</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={studentNumberInput}
                                        onChange={(e) => {
                                            setStudentNumberInput(e.target.value);
                                            setCheckStatus("idle"); // Reset status on typing
                                        }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                                        placeholder="e.g. 2023-1005" 
                                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c297c] focus:border-transparent outline-none transition-all"
                                    />
                                    <button 
                                        onClick={handleCheck}
                                        disabled={!studentNumberInput.trim() || checkStatus === "loading"}
                                        className="px-6 py-2.5 bg-[#5c297c] text-white font-bold rounded-lg hover:bg-[#4a1f63] shadow-md hover:shadow-lg transition-all disabled:opacity-60"
                                    >
                                        {checkStatus === "loading" ? <div className="loader-dots tracking-[0.2em]">...</div> : "Check"}
                                    </button>
                                </div>
                            </div>

                            {/* Status Messages based on Backend Logic */}
                            {checkStatus === "exists" && (
                                <div className="flex flex-col gap-3 items-center animate-fade-in">
                                    <div className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 w-full justify-center rounded-lg border border-blue-100 shadow-sm">
                                        <i className="bi bi-info-circle-fill text-xl"></i>
                                        <span className="text-sm font-medium">Student found! You can proceed to enroll them.</span>
                                    </div>
                                    <button 
                                        onClick={handleProceed} 
                                        disabled={enrolling}
                                        className="w-full py-3 bg-[#ffb736] text-white font-bold rounded-lg shadow-md hover:bg-[#e0a800] hover:scale-[1.02] transition-all disabled:opacity-60 disabled:hover:scale-100"
                                    >
                                        {enrolling ? "Enrolling..." : "Proceed to Enroll"}
                                    </button>
                                </div>
                            )}

                            {checkStatus === "not_exists" && (
                                <div className="flex flex-col gap-3 items-center animate-fade-in">
                                    <div className="flex items-center gap-2 text-green-600 font-medium">
                                        <i className="bi bi-check-circle-fill text-xl"></i>
                                        <span>ID is available!</span>
                                    </div>
                                    <button 
                                        onClick={handleProceed} 
                                        className="w-full py-3 bg-[#ffb736] text-white font-bold rounded-lg shadow-md hover:bg-[#e0a800] hover:scale-[1.02] transition-all"
                                    >
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