import React from "react";
import { toast } from "react-toastify"; // <-- Import toast

export default function ExportButton({ endpoint }) {
    const handleExport = () => {
        // 1. Reassure the user instantly so they don't click twice
        toast.info("Preparing export... Your download will begin shortly.", {
            position: "bottom-right", // Keeps it out of the way of the browser's own download popup
            autoClose: 3000,
            hideProgressBar: true,
        });

        // 2. Trigger the actual download
        const queryParams = typeof window !== "undefined" ? window.location.search : "";
        window.location.href = `${endpoint}${queryParams}`;
    };

    return (
        <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-5 h-[40px] bg-white text-[#5c297c] border border-[#5c297c] rounded-[5px] text-sm font-bold hover:bg-[#5c297c] hover:text-white transition-all duration-300 shadow-sm shrink-0"
        >
            <i className="bi bi-filetype-csv text-lg leading-none"></i>
            <span className="leading-none">Export</span>
        </button>
    );
}