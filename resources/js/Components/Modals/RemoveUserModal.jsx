import React, { useState, useEffect } from "react";
import CustomSelectGroup from "@/Components/SelectGroup";
import TextInput from "@/Components/TextInput";

export default function RemoveUserModal({
    isOpen,
    onClose,
    selectedUsers,
    onSuccess,
}) {
    const [animate, setAnimate] = useState(false);

    const [deleteMode, setDeleteMode] = useState("single"); // "single" or "multiple"

    // Single mode states
    const [singleReason, setSingleReason] = useState("");
    const [singleOtherReason, setSingleOtherReason] = useState("");

    // Multiple mode state: { userId: { reason, otherReason } }
    const [multiReasons, setMultiReasons] = useState({});

    const reasonOptions = [
        { value: "User resigned", label: "User resigned" },
        {
            value: "Moved to other department",
            label: "Moved to other department",
        },
        { value: "Position changed", label: "Position changed" },
        { value: "Other", label: "Other (please specify)" },
    ];

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
            setDeleteMode("single");
            setSingleReason("");
            setSingleOtherReason("");

            // Initialize multi reasons
            const initMulti = {};
            selectedUsers.forEach((user) => {
                initMulti[user.id] = { reason: "", otherReason: "" };
            });
            setMultiReasons(initMulti);
        }
    }, [isOpen, selectedUsers]);

    const handleClose = () => {
        setAnimate(false);
        setTimeout(() => onClose(), 300);
    };

    const handleMultiReasonChange = (userId, field, value) => {
        setMultiReasons((prev) => ({
            ...prev,
            [userId]: { ...prev[userId], [field]: value },
        }));
    };

    const handleSubmit = () => {
        // Here you would compile the data and send it to your Laravel backend
        // console.log("Deleting:", deleteMode === "single" ? singleReason : multiReasons);

        setAnimate(false);
        setTimeout(() => {
            if (onSuccess) onSuccess();
        }, 300);
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-[1000] flex items-center justify-center transition-all duration-300 ${animate ? "bg-gray-900/60 backdrop-blur-sm" : "bg-transparent backdrop-blur-none pointer-events-none"}`}
        >
            <div
                className={`bg-white rounded-2xl w-[90%] max-w-[500px] p-0 shadow-2xl relative flex flex-col overflow-hidden transition-all duration-300 transform ${animate ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
            >
                {/* Header */}
                <div className="bg-[#ed1c24] p-5 text-center relative">
                    <h2 className="text-xl font-bold text-white tracking-wide">
                        Remove User(s)
                    </h2>
                </div>

                <div className="p-6">
                    <p className="text-gray-600 text-sm mb-4">
                        You are about to delete{" "}
                        <strong>{selectedUsers.length}</strong> selected
                        user(s). Please provide a reason for this action.
                    </p>

                    {/* Radio Toggles */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                className="accent-[#ed1c24] w-4 h-4"
                                checked={deleteMode === "single"}
                                onChange={() => setDeleteMode("single")}
                            />
                            <span className="text-sm font-medium text-gray-700">
                                One reason for all
                            </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                className="accent-[#ed1c24] w-4 h-4"
                                checked={deleteMode === "multiple"}
                                onChange={() => setDeleteMode("multiple")}
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Separate reasons
                            </span>
                        </label>
                    </div>

                    {/* Single Reason View */}
                    {deleteMode === "single" && (
                        <div className="animate-fade-in space-y-3">
                            <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-sm text-[#ed1c24] max-h-24 overflow-y-auto custom-form-scrollbar mb-2">
                                <span className="font-bold block mb-1">
                                    Users to be deleted:
                                </span>
                                {selectedUsers.map((u) => (
                                    <div key={u.id}>
                                        • {u.name} ({u.username})
                                    </div>
                                ))}
                            </div>

                            <CustomSelectGroup
                                label="Select a reason:"
                                value={singleReason}
                                onChange={(e) =>
                                    setSingleReason(e.target.value)
                                }
                                options={reasonOptions}
                                vertical={true}
                            />
                            {singleReason === "Other" && (
                                <div className="mt-2 animate-fade-in-up">
                                    <TextInput
                                        type="text"
                                        placeholder="Please specify the reason"
                                        value={singleOtherReason}
                                        onChange={(e) =>
                                            setSingleOtherReason(e.target.value)
                                        }
                                        className="w-full border-gray-300 focus:border-[#ed1c24] focus:ring-[#ed1c24]"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Multiple Reason View */}
                    {deleteMode === "multiple" && (
                        <div className="animate-fade-in space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-form-scrollbar">
                            {selectedUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
                                >
                                    <p className="font-bold text-[#5c297c] mb-2">
                                        {user.name}{" "}
                                        <span className="font-normal text-gray-500 text-xs ml-1">
                                            ({user.username})
                                        </span>
                                    </p>

                                    <CustomSelectGroup
                                        label="Reason:"
                                        value={
                                            multiReasons[user.id]?.reason || ""
                                        }
                                        onChange={(e) =>
                                            handleMultiReasonChange(
                                                user.id,
                                                "reason",
                                                e.target.value,
                                            )
                                        }
                                        options={reasonOptions}
                                        vertical={true}
                                    />

                                    {multiReasons[user.id]?.reason ===
                                        "Other" && (
                                        <div className="mt-2 animate-fade-in-up">
                                            <TextInput
                                                type="text"
                                                placeholder="Specify reason"
                                                value={
                                                    multiReasons[user.id]
                                                        ?.otherReason || ""
                                                }
                                                onChange={(e) =>
                                                    handleMultiReasonChange(
                                                        user.id,
                                                        "otherReason",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full border-gray-300 focus:border-[#ed1c24] focus:ring-[#ed1c24] text-sm py-1.5"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-100">
                        <button
                            onClick={handleClose}
                            className="px-5 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-5 py-2 text-sm font-bold text-white bg-[#ed1c24] rounded-lg hover:bg-[#c4151c] shadow-md transition-all"
                        >
                            Confirm and Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
