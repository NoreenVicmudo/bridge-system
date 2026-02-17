import React from "react";
import TextInput from "@/Components/TextInput";
import CustomSelectGroup from "@/Components/SelectGroup";

export default function ReusableForm({ data, setData, submit, isEdit, options }) {
    // Standardized Label and Input Classes
    const labelClass = "block mb-0.5 font-bold text-sm text-[#5c297c]";
    const inputClass = "w-full border-gray-300 rounded-[5px] shadow-sm text-sm p-2 focus:border-[#ffb736] focus:ring-[#ffb736] focus:ring-1 focus:outline-none transition-colors duration-200";

    // SelectGroup Overrides to force labels on top and prevent wrapping
    const selectOverride = "!flex-col !items-start !gap-0.5 mb-0 w-full";
    const selectLabelOverride = "!w-full !text-left !font-bold !text-[#5c297c] !mb-0 !whitespace-nowrap";

    return (
        <div className="flex justify-center w-full px-4 py-0 h-[calc(100vh-120px)] items-start overflow-hidden">
            <div className="w-full max-w-2xl bg-white rounded-[10px] shadow-[0_6px_25px_rgba(0,0,0,0.1)] px-6 py-4 md:px-8 md:py-5 flex flex-col max-h-full my-2">
                
                <h2 className="text-center text-xl md:text-2xl font-bold text-[#5c297c] mb-3 flex-shrink-0">
                    {/* Dynamic Title based on your specific metric */}
                    {isEdit ? "Update Metric" : "Add Metric Entry"}
                </h2>

                <div className="overflow-y-auto overflow-x-hidden pr-2 flex-1 custom-form-scrollbar">
                    <form onSubmit={submit} className="flex flex-col gap-3 p-1">
                        {/* Example Field for Academic Profile */}
                        <div className="w-full">
                            <label className={labelClass}>Metric Field Name:</label>
                            <TextInput 
                                className={inputClass}
                                value={data.metric_value}
                                onChange={(e) => setData("metric_value", e.target.value)}
                            />
                        </div>

                        {/* Example Dropdown using your existing CustomSelectGroup */}
                        <CustomSelectGroup
                            label="Program Metric Category:"
                            value={data.category}
                            options={options.categories}
                            className={selectOverride}
                            labelClassName={selectLabelOverride}
                            onChange={(e) => setData("category", e.target.value)}
                        />

                        {/* Standardized Buttons */}
                        <div className="flex justify-end gap-3 mt-2 mb-2 flex-shrink-0">
                            <button type="button" onClick={() => window.history.back()} className="px-6 py-2.5 text-sm font-bold text-[#666] bg-white border border-[#ddd] rounded-[6px] hover:bg-[#ffb736] hover:text-white transition-all duration-300">
                                Back
                            </button>
                            <button type="submit" className="px-5 py-2 text-sm font-bold text-white bg-[#5c297c] rounded-[6px] hover:bg-[#ffb736] transition-all duration-300 shadow-md">
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}