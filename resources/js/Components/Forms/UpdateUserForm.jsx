import React, { useState, useMemo } from "react";
import TextInput from "@/Components/TextInput";
import CustomSelectGroup from "@/Components/SelectGroup";
import ConfirmSaveModal from "@/Components/Modals/ConfirmSaveModal";
import { router } from "@inertiajs/react";

export default function UpdateUserForm({
    data, setData, errors = {}, processing = false, submit, user,
    collegeOptions = [], programOptions = [],
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const inputClass = "w-full border-gray-300 rounded-[5px] shadow-sm text-sm p-2 focus:border-[#ffb736] focus:ring-[#ffb736] focus:ring-1 focus:outline-none transition-colors duration-200 placeholder:text-gray-400";
    const labelClass = "block mb-0.5 font-bold text-sm text-[#5c297c]";
    const selectGroupOverride = "!flex-col !items-start !gap-0.5 mb-0 w-full !whitespace-nowrap";
    const selectLabelOverride = "!w-full !text-left !font-bold !text-[#5c297c] !mb-0 !whitespace-nowrap";

    const positionOptions = [
        { value: "Super Admin", label: "Super Admin" },
        { value: "Admin", label: "Admin" },
        { value: "Academic Affairs", label: "Academic Affairs" },
        { value: "Dean", label: "Dean" },
        { value: "Administrative Assistant", label: "Administrative Assistant" },
        { value: "Program Head", label: "Program Head" },
    ];

    const needsCollege = ["Dean", "Administrative Assistant", "Program Head"].includes(data.position);
    const needsProgram = data.position === "Program Head";

    const handlePositionChange = (e) => {
        const newPos = e.target.value;
        const willNeedCollege = ["Dean", "Administrative Assistant", "Program Head"].includes(newPos);
        const willNeedProgram = newPos === "Program Head";
        
        setData(prev => ({
            ...prev, 
            position: newPos,
            college_id: willNeedCollege ? prev.college_id : "",
            program_id: willNeedProgram ? prev.program_id : ""
        }));
    };

    const handleCollegeChange = (e) => {
        const selectedCollegeId = e.target.value;
        setData(prev => ({
            ...prev,
            college_id: selectedCollegeId,
            program_id: "" 
        }));
    };

    // 🧠 THE FIX: Force all college option values to be strings to match the form state
    const normalizedCollegeOptions = useMemo(() => {
        return collegeOptions.map(c => ({
            ...c,
            value: c.value ? String(c.value) : ""
        }));
    }, [collegeOptions]);

    const filteredPrograms = useMemo(() => {
        if (!data.college_id) return [];
        return programOptions
            .filter(p => p.college_id && String(p.college_id) === String(data.college_id))
            .map(p => ({ value: String(p.value), label: p.label }));
    }, [data.college_id, programOptions]);

    const isFormValid =
        data.fname.trim() !== "" && data.lname.trim() !== "" &&
        data.position !== "" &&
        (!needsCollege || data.college_id !== "") &&
        (!needsProgram || data.program_id !== "");

    const openConfirmModal = (e) => {
        e.preventDefault();
        if (isFormValid) setIsModalOpen(true);
    };

    const handleBack = () => {
        router.get(route('users.index')); 
    };

    return (
        <div className="flex justify-center w-full px-4 py-0 h-[calc(100vh-100px)] items-start overflow-hidden font-montserrat text-left text-[#5c297c]">
            <div className="w-full max-w-2xl bg-white rounded-[10px] shadow-[0_6px_25px_rgba(0,0,0,0.1)] px-6 py-4 md:px-8 md:py-5 flex flex-col max-h-full my-2 relative">
                <h2 className="text-center text-xl md:text-2xl font-bold mb-3 flex-shrink-0">User Information Overview</h2>
                <div className="overflow-y-auto overflow-x-hidden pr-2 flex-1 custom-form-scrollbar">
                    <style>{`.custom-form-scrollbar::-webkit-scrollbar { width: 4px; } .custom-form-scrollbar::-webkit-scrollbar-thumb { background-color: #5c297c; border-radius: 6px; } input:focus { box-shadow: 0 0 0 1px #ffb736 !important; border-color: #ffb736 !important; }`}</style>
                    <form onSubmit={openConfirmModal} className="flex flex-col gap-3 p-1">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="w-full"><label className={labelClass}>Username:</label><TextInput value={user?.user_username || ""} className={`${inputClass} bg-gray-100 cursor-not-allowed text-gray-500 font-bold`} readOnly={true} /></div>
                            <div className="w-full"><label className={labelClass}>Email:</label><TextInput value={user?.user_email || ""} className={`${inputClass} bg-gray-100 cursor-not-allowed text-gray-500 font-bold`} readOnly={true} /></div>
                        </div>
                        <div className="border-t border-gray-100 pt-3 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="w-full"><label className={labelClass}>Current College:</label><TextInput value={user?.college_name || "N/A"} className={`${inputClass} bg-gray-50 border-gray-200 uppercase`} readOnly={true} /></div>
                                <div className="w-full"><label className={labelClass}>Current Position:</label><TextInput value={user?.position_name || "N/A"} className={`${inputClass} bg-gray-50 border-gray-200 uppercase`} readOnly={true} /></div>
                            </div>
                            {user?.program_name && (
                                <div className="w-full"><label className={labelClass}>Current Program:</label><TextInput value={user?.program_name} className={`${inputClass} bg-gray-50 border-gray-200 uppercase`} readOnly={true} /></div>
                            )}
                        </div>

                        <div className="border-t border-gray-100 pt-4 bg-purple-50/30 p-3 rounded-lg mt-2">
                            <h3 className="text-[11px] font-bold mb-3 uppercase tracking-widest opacity-70">Update User Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div className="w-full"><label className={labelClass}>First Name:</label><TextInput type="text" value={data.fname} onChange={(e) => setData("fname", e.target.value)} className={inputClass} required /></div>
                                <div className="w-full"><label className={labelClass}>Last Name:</label><TextInput type="text" value={data.lname} onChange={(e) => setData("lname", e.target.value)} className={inputClass} required /></div>
                            </div>
                            <div className="space-y-3">
                                <CustomSelectGroup
                                    label="Position:" value={data.position}
                                    onChange={handlePositionChange}
                                    options={positionOptions} placeholder="Select Position" vertical={true} className={selectGroupOverride} labelClassName={selectLabelOverride}
                                />
                                
                                {needsCollege && (
                                    <div className="animate-fade-in-up">
                                        <CustomSelectGroup
                                            label="College:" value={data.college_id}
                                            onChange={handleCollegeChange}
                                            options={normalizedCollegeOptions} /* 🧠 Using normalized options */
                                            placeholder="Select College" vertical={true} className={selectGroupOverride} labelClassName={selectLabelOverride}
                                        />
                                    </div>
                                )}

                                {needsProgram && (
                                    <div className="animate-fade-in-up">
                                        <CustomSelectGroup
                                            label="Program:" value={data.program_id}
                                            onChange={(e) => setData("program_id", e.target.value)}
                                            options={filteredPrograms}
                                            disabled={!data.college_id}
                                            placeholder={!data.college_id ? "Select College First" : "Select Program"}
                                            vertical={true} className={selectGroupOverride} labelClassName={selectLabelOverride}
                                        />
                                    </div>
                                )}
                            </div>
                            <p className="text-[#ed1c24] text-xs font-bold italic mt-4 bg-red-50 p-2 rounded border border-red-100">
                                <i className="bi bi-exclamation-triangle-fill mr-1"></i> WARNING: Editing user data will affect their access.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 mt-4 mb-2 flex-shrink-0">
                            <button type="button" onClick={handleBack} className="px-6 py-2.5 text-sm font-bold text-[#666] bg-white border border-[#ddd] rounded-[6px] hover:bg-[#ffb736] hover:text-white transition-all duration-300 shadow-sm font-montserrat">
                                Back
                            </button>
                            <button type="submit" disabled={processing || !isFormValid} className={`px-6 py-2.5 text-sm font-bold text-white rounded-[6px] transition-all duration-300 shadow-md flex items-center gap-2 ${!isFormValid ? "bg-gray-400 cursor-not-allowed opacity-70" : "bg-[#5c297c] hover:bg-[#ffb736] cursor-pointer"}`}>
                                {processing ? <><div className="loader w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Saving...</> : "Update User"}
                            </button>
                        </div>
                    </form>
                </div>
                <ConfirmSaveModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={submit} message={<>Are you sure you want to update the information and access level for <br /><strong>{user?.user_username}</strong>?</>} />
            </div>
        </div>
    );
}