import React, { useState } from "react";
import axios from "axios";

export default function GWAImportModal({ isOpen, onClose, currentFilter, maxYears, onImportSuccess }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return;
        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('filter', JSON.stringify(currentFilter));

        try {
            await axios.post(route('gwa.import'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onImportSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Import failed');
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-[#5c297c] mb-4">Import GWA CSV</h2>
                <p className="text-sm text-gray-600 mb-2">
                    Expected format: first column = student_number, then columns like <strong>1Y_1Sem, 1Y_2Sem, 2Y_1Sem, ...</strong>
                    <br />Years allowed: up to {maxYears}
                </p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="w-full mb-4"
                        required
                    />
                    {error && <div className="text-red-500 text-sm mb-3">{error}</div>}
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                        <button type="submit" disabled={uploading} className="px-4 py-2 bg-[#5c297c] text-white rounded disabled:opacity-50">
                            {uploading ? 'Uploading...' : 'Import'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}