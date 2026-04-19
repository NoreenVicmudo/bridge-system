import React, { useState, useEffect } from "react";
import CustomSelectGroup from "@/Components/SelectGroup";
import TextInput from "@/Components/TextInput";

export default function RemoveUserModal({
    isOpen,
    onClose,
    selectedUsers,
    onSuccess, 
}) {
    const [mode, setMode] = useState("single");
    const [animate, setAnimate] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [singleReason, setSingleReason] = useState("");
    const [singleOtherReason, setSingleOtherReason] = useState("");
    const [multiReasons, setMultiReasons] = useState({});

    const REASON_OPTIONS = [
        { value: "User resigned", label: "User resigned" },
        { value: "Moved to other department", label: "Moved to other department" },
        { value: "Position changed", label: "Position changed" },
        { value: "Other", label: "Other (please specify)" },
    ];

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
            setMode("single");
            setSingleReason("");
            setSingleOtherReason("");
            setDeleting(false);

            const initMulti = {};
            selectedUsers.forEach((user) => {
                initMulti[user.id] = { reason: "", otherReason: "" };
            });
            setMultiReasons(initMulti);
        }
    }, [isOpen, selectedUsers]);

    const closeModal = () => {
        setAnimate(false);
        setTimeout(onClose, 300);
    };

    const handleMultiReasonChange = (userId, field, value) => {
        setMultiReasons((prev) => ({
            ...prev,
            [userId]: { ...prev[userId], [field]: value },
        }));
    };

    const isReadyToRemove = () => {
        if (mode === "single") {
            if (singleReason === "") return false;
            if (singleReason === "Other" && singleOtherReason.trim() === "") return false;
            return true;
        }
        return (
            selectedUsers.length > 0 &&
            selectedUsers.every(u => {
                const r = multiReasons[u.id];
                if (!r || r.reason === "") return false;
                if (r.reason === "Other" && r.otherReason.trim() === "") return false;
                return true;
            })
        );
    };

    const handleConfirm = () => {
        if (!isReadyToRemove()) return;
        setDeleting(true);
        const payload = { reason_mode: mode };
        if (mode === "single") {
            payload.reason = singleReason === "Other" ? singleOtherReason : singleReason;
        } else {
            const compiledReasons = {};
            selectedUsers.forEach(u => {
                const r = multiReasons[u.id];
                compiledReasons[u.id] = r.reason === "Other" ? r.otherReason : r.reason;
            });
            payload.per_reasons = compiledReasons;
        }
        if (onSuccess) onSuccess(payload, () => setDeleting(false));
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 transition-all duration-300 ${animate ? "bg-gray-900/60 backdrop-blur-sm" : "bg-transparent backdrop-blur-none pointer-events-none"}`}>
            <style>{`
                .modal-scroll-area::-webkit-scrollbar { width: 6px; }
                .modal-scroll-area::-webkit-scrollbar-thumb { background-color: #5c297c; border-radius: 10px; }
                .modal-scroll-area::-webkit-scrollbar-track { background: transparent; }
            `}</style>

            {/* Modal Card */}
            <div className={`bg-white rounded-2xl w-[95%] max-w-[600px] shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden transition-all duration-300 transform ${animate ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
                
                {/* STICKY HEADER */}
                <div className="bg-red-50 p-6 border-b border-red-100 flex items-start gap-4 rounded-t-2xl relative z-[100] flex-shrink-0">
                    <div className="bg-red-100 p-3 rounded-full shrink-0">
                        <i className="bi bi-exclamation-triangle-fill text-2xl text-red-500"></i>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-800">Remove Users</h2>
                        <p className="text-gray-500 text-sm mt-1">
                            Removing <strong className="text-red-600">{selectedUsers.length}</strong> record(s).
                        </p>
                    </div>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <i className="bi bi-x-lg text-lg"></i>
                    </button>
                </div>

                {/* THE UNIFIED SCROLL AREA */}
                <div className="flex-1 overflow-y-auto modal-scroll-area overflow-x-visible flex flex-col relative">
                    
                    <div className="p-6 pb-2">
                        {/* Mode Toggle */}
                        <div className="flex bg-gray-100 p-1 rounded-lg mb-6 relative z-[90]">
                            <button onClick={() => setMode("single")} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === "single" ? "bg-white text-[#5c297c] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                                Single Reason
                            </button>
                            <button onClick={() => setMode("multiple")} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === "multiple" ? "bg-white text-[#5c297c] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                                Specific Reasons
                            </button>
                        </div>

                        {/* MODE CONTENT */}
                        {mode === "single" ? (
                            <div className="flex flex-col gap-4 animate-fade-in relative z-[80]">
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Target Users:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedUsers.map((u) => (
                                            <span key={u.id} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-white border border-gray-200 text-[#5c297c]">
                                                {u.username}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="relative z-[110]">
                                    <CustomSelectGroup
                                        label="Reason for removal"
                                        value={singleReason}
                                        onChange={(e) => setSingleReason(e.target.value)}
                                        options={REASON_OPTIONS}
                                        vertical={true}
                                        className="!mb-0"
                                    />
                                    {singleReason === "Other" && (
                                        <div className="mt-2 animate-fade-in-up">
                                            <TextInput
                                                type="text"
                                                placeholder="Please specify the reason"
                                                value={singleOtherReason}
                                                onChange={(e) => setSingleOtherReason(e.target.value)}
                                                className="w-full border-gray-300 focus:border-[#ed1c24] focus:ring-[#ed1c24] text-sm"
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="h-4"></div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 animate-fade-in pb-4">
                                {selectedUsers.map((user, index) => (
                                    <div 
                                        key={user.id} 
                                        // CRITICAL: Reverse Z-index so top items overlap bottom items
                                        style={{ zIndex: selectedUsers.length - index + 10 }} 
                                        className="flex flex-col p-4 border border-gray-200 rounded-lg bg-white transition-all relative"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex flex-col max-w-[50%]">
                                                <span className="text-sm font-bold text-gray-800 truncate">{user.name}</span>
                                                <span className="text-xs text-gray-500">{user.username}</span>
                                            </div>
                                            <div className="w-[200px] relative z-[120]">
                                                <CustomSelectGroup
                                                    value={multiReasons[user.id]?.reason || ""}
                                                    onChange={(e) => handleMultiReasonChange(user.id, "reason", e.target.value)}
                                                    options={REASON_OPTIONS}
                                                    placeholder="Select reason..."
                                                    vertical={true}
                                                    className="!mb-0 !gap-0"
                                                />
                                            </div>
                                        </div>
                                        {multiReasons[user.id]?.reason === "Other" && (
                                            <div className="animate-fade-in-up w-full flex justify-end">
                                                <TextInput
                                                    type="text"
                                                    placeholder="Specify reason"
                                                    value={multiReasons[user.id]?.otherReason || ""}
                                                    onChange={(e) => handleMultiReasonChange(user.id, "otherReason", e.target.value)}
                                                    className="w-[200px] border-gray-300 focus:border-[#ed1c24] focus:ring-[#ed1c24] text-sm py-1.5"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* FOOTER (Now scrolls with content and sits at bottom via mt-auto) */}
                    <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 mt-auto relative z-10 rounded-b-2xl">
                        <button onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!isReadyToRemove() || deleting}
                            className={`px-5 py-2.5 text-sm font-bold text-white rounded-lg shadow-md transition-all flex items-center gap-2 ${isReadyToRemove() && !deleting ? "bg-[#ed1c24] hover:bg-[#c4151c]" : "bg-gray-400 cursor-not-allowed opacity-70"}`}
                        >
                            {deleting ? (
                                <div className="loader w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <><i className="bi bi-trash"></i> Confirm Removal</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}