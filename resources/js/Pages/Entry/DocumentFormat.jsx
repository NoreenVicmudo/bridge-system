import React, { useState, useRef } from "react";
import { useForm } from "@inertiajs/react";
import DataEntryLayout from "@/Layouts/DataEntryLayout";
import CustomSelectGroup from "@/Components/SelectGroup";
import TextInput from "@/Components/TextInput";
import ConfirmSaveModal from "@/Components/Modals/ConfirmSaveModal";

export default function DocumentFormat({ colleges }) {
    const fileInputRef = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState("/assets/img/blank.png");

    const { data, setData, post, processing, errors } = useForm({
        college_id: "",
        logo: null,
        brand_color: "#5c297c",
        college_email: "",
    });

    // Handle Image Preview Generation
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData("logo", file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const removeLogo = () => {
        setData("logo", null);
        setPreviewUrl("/assets/img/blank.png");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = () => {
        // Post with forceFormData to allow file uploads
        post(route("document-format.store"), {
            forceFormData: true,
            onSuccess: () => setIsModalOpen(false),
        });
    };

    const isFormValid = data.college_id && data.college_email;

    return (
        <DataEntryLayout title="Document Format">
            <div className="max-w-2xl mx-auto animate-fade-in">
                
                {/* Unified Card Container for everything */}
                <form className="bg-white p-6 rounded-xl border border-purple-100 shadow-sm space-y-6">
                    
                    {/* 1. College Selection */}
                    <div className="w-full">
                        <CustomSelectGroup
                            label="Select College:"
                            value={data.college_id}
                            onChange={(e) => setData("college_id", e.target.value)}
                            options={colleges}
                            vertical={true}
                        />
                    </div>

                    {/* 2. Show Format Inputs ONLY if a college is selected */}
                    {data.college_id && (
                        <div className="space-y-6 animate-fade-in-up border-t border-gray-100 pt-5 mt-2">
                            
                            {/* Logo Upload */}
                            <div className="flex flex-col gap-2">
                                <label className="font-bold text-sm text-[#5c297c]">
                                    College Logo:
                                </label>
                                <div className="flex flex-col items-center gap-4">
                                    <div
                                        className="relative w-36 h-36 border-2 border-[#5c297c] rounded-xl overflow-hidden cursor-pointer group hover:border-[#ffb736] transition-colors shadow-md"
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        <img
                                            src={previewUrl}
                                            className="w-full h-full object-contain bg-slate-50"
                                            alt="Preview"
                                        />
                                        <div className="absolute inset-0 bg-[#5c297c]/80 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            <i className="bi bi-camera-fill text-3xl"></i>
                                            <span className="text-xs mt-1">
                                                Upload
                                            </span>
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleImageChange}
                                        accept="image/*"
                                    />

                                    {data.logo && (
                                        <button
                                            type="button"
                                            onClick={removeLogo}
                                            className="text-xs text-red-500 font-bold hover:underline"
                                        >
                                            <i className="bi bi-x-circle mr-1"></i>
                                            Remove Logo
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Color Picker */}
                            <div className="flex flex-col gap-2">
                                <label className="font-bold text-sm text-[#5c297c]">
                                    Brand Color (Hex Code):
                                </label>
                                <div className="flex gap-3 items-center">
                                    <input
                                        type="color"
                                        value={data.brand_color}
                                        onChange={(e) =>
                                            setData("brand_color", e.target.value)
                                        }
                                        className="w-16 h-12 rounded cursor-pointer border-0 p-0"
                                    />
                                    <TextInput
                                        type="text"
                                        value={data.brand_color}
                                        onChange={(e) =>
                                            setData("brand_color", e.target.value)
                                        }
                                        className="uppercase font-mono w-32"
                                        maxLength={7}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="flex flex-col gap-2">
                                <label className="font-bold text-sm text-[#5c297c]">
                                    College Email:
                                </label>
                                <div className="relative">
                                    <i className="bi bi-envelope absolute left-3 top-3 text-[#5c297c]"></i>
                                    <TextInput
                                        type="email"
                                        value={data.college_email}
                                        onChange={(e) =>
                                            setData("college_email", e.target.value)
                                        }
                                        className="pl-10 w-full"
                                        placeholder="college@mcu.edu.ph"
                                    />
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="flex justify-center mt-8 pt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(true)}
                                    disabled={!isFormValid || processing}
                                    className={`px-8 py-3 font-bold text-white rounded-lg transition-all shadow-md
                                        ${!isFormValid ? "bg-gray-300 cursor-not-allowed" : "bg-[#5c297c] hover:bg-[#ffb736]"}`}
                                >
                                    Save Configuration
                                </button>
                            </div>
                        </div>
                    )}
                </form>

                <ConfirmSaveModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleSubmit}
                    title="Update Document Format"
                    message="Are you sure you want to save these changes for the selected college?"
                />
            </div>
        </DataEntryLayout>
    );
}