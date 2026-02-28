import React, { useState, useEffect } from "react";

export default function ConfirmSaveModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Save",
    message = "Are you sure you want to save these changes?",
}) {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
        }
    }, [isOpen]);

    const handleClose = () => {
        setAnimate(false);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleConfirm = () => {
        setAnimate(false);
        setTimeout(() => {
            onConfirm();
            onClose();
        }, 300);
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-[2000] flex items-center justify-center transition-all duration-300 ${animate ? "bg-black/40 backdrop-blur-sm" : "bg-transparent backdrop-blur-none"}`}
        >
            <div
                className={`bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center transition-all duration-300 transform font-montserrat ${animate ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
            >
                <div className="w-16 h-16 bg-purple-100 text-[#5c297c] rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="bi bi-question-lg text-3xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {title}
                </h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed px-2">
                    {message}
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={handleClose}
                        className="px-6 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-300 ease-in-out uppercase tracking-wider"
                    >
                        No, Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-8 py-2 text-xs font-bold text-white bg-[#5c297c] rounded-lg hover:bg-[#ffb736] transition-all duration-300 shadow-md ease-in-out uppercase tracking-wider"
                    >
                        Yes, Save
                    </button>
                </div>
            </div>
        </div>
    );
}
