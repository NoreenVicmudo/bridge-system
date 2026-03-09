import React from "react";

export default function ReportToolbar({
    onOpenModal,
    onPrint,
    onExport,
    isDisabled,
}) {
    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8 no-print">
            <button
                onClick={onOpenModal}
                className="flex justify-center items-center gap-2 px-5 py-2.5 bg-[#5c297c] text-white font-bold rounded-lg hover:bg-[#ffb736] transition-all duration-300 ease-in-out shadow-md text-sm w-full sm:w-auto"
            >
                <i className="bi bi-bar-chart-line text-lg"></i>
                <span>Select Statistical Tool</span>
            </button>

            <div className="flex flex-row items-center gap-3 w-full sm:w-auto">
                <button
                    onClick={onPrint}
                    disabled={isDisabled}
                    className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-5 py-2.5 font-bold rounded-lg transition-all duration-300 ease-in-out shadow-md text-sm
                        ${isDisabled ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-[#5c297c] text-white hover:bg-[#ffb736]"}`}
                >
                    <i className="bi bi-printer text-lg"></i>
                    <span>Print</span>
                </button>

                <button
                    onClick={onExport}
                    disabled={isDisabled}
                    className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-5 py-2.5 font-bold rounded-lg transition-all duration-300 ease-in-out shadow-md text-sm
                        ${isDisabled ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-[#5c297c] text-white hover:bg-[#ffb736]"}`}
                >
                    <i className="bi bi-file-earmark-pdf text-lg"></i>
                    <span>Export</span>
                </button>
            </div>
        </div>
    );
}
