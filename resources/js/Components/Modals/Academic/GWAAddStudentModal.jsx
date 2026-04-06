import React, { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";

export default function GWAAddStudentModal({ isOpen, onClose, currentFilter, maxYears, onImportSuccess }) {
    const [view, setView] = useState("options");
    const [animate, setAnimate] = useState(false);
    const [studentNumber, setStudentNumber] = useState("");
    const [checkStatus, setCheckStatus] = useState("idle");
    const [importFile, setImportFile] = useState(null);
    const [importProcessing, setImportProcessing] = useState(false);
    const [importError, setImportError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
            setView("options");
            setStudentNumber("");
            setCheckStatus("idle");
            setImportFile(null);
            setImportError(null);
        }
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
        }
    };

    const handleProceedToEdit = async () => {
        try {
            const res = await axios.get(route('api.get-student-id', { student_number: studentNumber }));
            router.get(route('gwa.entry'), { student_id: res.data.id });
            closeModal();
        } catch {
            alert("Student not found");
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
            await axios.post(route('gwa.import'), formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            onImportSuccess();
            closeModal();
        } catch (err) {
            setImportError(err.response?.data?.message || 'Import failed');
        } finally {
            setImportProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[1000] flex items-center justify-center transition-all duration-300 ${animate ? "bg-gray-900/60 backdrop-blur-sm" : "bg-transparent backdrop-blur-none pointer-events-none"}`}>
            <div className={`bg-white rounded-2xl w-[90%] max-w-[500px] p-0 shadow-2xl relative flex flex-col overflow-hidden transition-all duration-300 transform ${animate ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
                <div className="bg-[#5c297c] p-6 text-center relative">
                    <h2 className="text-2xl font-bold text-white tracking-wide">Manage GWA Records</h2>
                    <p className="text-purple-200 text-sm mt-1">Import CSV or edit a student's GWA</p>
                    <button onClick={closeModal} className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/20 rounded-full p-1 transition-all">
                        <i className="bi bi-x-lg text-xl"></i>
                    </button>
                </div>

                <div className="p-8">
                    {view === "options" && (
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setView("import")} className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-gray-100 rounded-xl hover:border-[#5c297c] hover:bg-purple-50 group transition">
                                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-[#5c297c] transition">
                                    <i className="bi bi-file-earmark-excel text-2xl text-[#5c297c] group-hover:text-white"></i>
                                </div>
                                <span className="text-gray-700 font-bold group-hover:text-[#5c297c]">Import CSV</span>
                            </button>
                            <button onClick={() => setView("manual")} className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-gray-100 rounded-xl hover:border-[#5c297c] hover:bg-purple-50 group transition">
                                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-[#5c297c] transition">
                                    <i className="bi bi-pencil-square text-2xl text-[#5c297c] group-hover:text-white"></i>
                                </div>
                                <span className="text-gray-700 font-bold group-hover:text-[#5c297c]">Edit Student GWA</span>
                            </button>
                        </div>
                    )}

                    {view === "import" && (
                        <div className="flex flex-col gap-5">
                            <div className="bg-purple-50 p-5 rounded-lg border">
                                <p className="text-sm text-gray-600 mb-4">
                                    CSV format: first column = student_number, then columns like <strong>1Y_1Sem, 1Y_2Sem, ...</strong><br />
                                    Years allowed: up to {maxYears}
                                </p>
                                <form onSubmit={handleImportSubmit} className="flex flex-col gap-3">
                                    <input type="file" accept=".csv" onChange={(e) => setImportFile(e.target.files[0])} required className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-100 file:text-[#5c297c] hover:file:bg-purple-200" />
                                    {importError && <div className="text-red-500 text-sm">{importError}</div>}
                                    <button type="submit" disabled={importProcessing || !importFile} className="mt-2 w-full py-2.5 bg-[#5c297c] text-white font-bold rounded-lg hover:bg-[#4a1f63] disabled:opacity-50">
                                        {importProcessing ? "Uploading..." : "Import"}
                                    </button>
                                </form>
                            </div>
                            <button onClick={() => setView("options")} className="text-gray-400 hover:text-gray-600 text-sm font-medium self-center">← Back</button>
                        </div>
                    )}

                    {view === "manual" && (
                        <div className="flex flex-col gap-5">
                            <div className="bg-purple-50 p-4 rounded-lg border">
                                <label className="block text-sm font-bold text-[#5c297c] mb-2">Student Number</label>
                                <div className="flex gap-2">
                                    <input type="text" value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCheckStudent()} placeholder="e.g. 2025-10001" className="flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#5c297c]" />
                                    <button onClick={handleCheckStudent} disabled={!studentNumber.trim() || checkStatus === "loading"} className="px-6 py-2.5 bg-[#5c297c] text-white font-bold rounded-lg hover:bg-[#4a1f63] disabled:opacity-60">
                                        {checkStatus === "loading" ? "..." : "Check"}
                                    </button>
                                </div>
                                {checkStatus === "exists" && (
                                    <div className="mt-3 p-2 bg-green-50 text-green-700 rounded-lg text-sm flex justify-between items-center">
                                        <span>Student found – edit GWA.</span>
                                        <button onClick={handleProceedToEdit} className="px-3 py-1 bg-green-600 text-white rounded text-xs">Proceed</button>
                                    </div>
                                )}
                                {checkStatus === "not_exists" && <div className="mt-3 p-2 bg-red-50 text-red-700 rounded-lg text-sm">Student not found. No creation allowed.</div>}
                                {checkStatus === "error" && <div className="mt-3 p-2 bg-red-50 text-red-700 rounded-lg text-sm">Error checking student.</div>}
                            </div>
                            <button onClick={() => setView("options")} className="text-gray-400 hover:text-gray-600 text-sm font-medium self-center">← Back</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}