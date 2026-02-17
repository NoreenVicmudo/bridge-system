import React from "react";
import TextInput from "@/Components/TextInput";
import CustomSelectGroup from "@/Components/SelectGroup";

export default function StudentForm({
    data,
    setData,
    errors,
    processing,
    submit,
    isEdit = false,
    options = {},
}) {
    const safeOptions = {
        colleges: options?.colleges || [],
        livingArrangements: options?.livingArrangements || [],
        languages: options?.languages || [],
        programs: options?.programs || {},
    };

    const availablePrograms = safeOptions.programs[data.college] || [];
    const showOtherLanguage = data.language === "Others";

    const handleCollegeChange = (e) => {
        setData((prev) => ({
            ...prev,
            college: e.target.value,
            program: "",
        }));
    };

    // Unified Input style: Strictly yellow focus (#ffb736)
    const inputClass =
        "w-full border-gray-300 rounded-[5px] shadow-sm text-sm p-2 " +
        "focus:border-[#ffb736] focus:ring-[#ffb736] focus:ring-1 focus:outline-none " +
        "transition-colors duration-200 placeholder:text-gray-400";

    // Unified Label style: Purple (#5c297c), bold
    const labelClass = "block mb-0.5 font-bold text-sm text-[#5c297c]";

    // SELECT GROUP OVERRIDES: Forced vertical layout and disabled label wrapping
    const selectGroupOverride =
        "!flex-col !items-start !gap-0.5 mb-0 w-full !whitespace-nowrap";
    const selectLabelOverride =
        "!w-full !text-left !font-bold !text-[#5c297c] !mb-0 !whitespace-nowrap";

    const handleBack = () => {
        // Check where the user came from using the browser's referrer string
        const referrer = document.referrer;

        if (referrer.includes("student-masterlist")) {
            window.location.href = "/student-masterlist";
        } else {
            // Default fallback to student-information
            window.location.href = "/student-information";
        }
    };

    // Define which fields are strictly required for the ADD process
    const isFormValid = () => {
        if (isEdit) return true; // In edit mode, everything is always "valid" to submit

        // List of required fields based on your provided form structure
        const requiredFields = [
            "student_number",
            "last_name",
            "first_name",
            "middle_name",
            "college",
            "program",
            "birthdate",
            "sex",
            "socioeconomic_status",
            "living_arrangement",
            "house_no",
            "street",
            "barangay",
            "city",
            "province",
            "postal_code",
            "work_status",
            "scholarship",
            "language",
            "last_school_type",
        ];

        // Check if every required field has a value
        return requiredFields.every(
            (field) => data[field] && data[field].toString().trim() !== "",
        );
    };

    return (
        /* WRAPPER: items-start and minimal py to keep the card high up */
        /* Changed h-[calc(100vh-60px)] to a safer h-[calc(100vh-100px)] to account for headers */
        <div className="flex justify-center w-full px-4 py-0 h-[calc(100vh-100px)] items-start overflow-hidden">
            {/* CONTAINER: Reduced py/px and set a strict max-h to prevent browser scroll */}
            <div className="w-full max-w-2xl bg-white rounded-[10px] shadow-[0_6px_25px_rgba(0,0,0,0.1)] px-6 py-4 md:px-8 md:py-5 flex flex-col max-h-full my-2">
                <h2 className="text-center text-xl md:text-2xl font-bold text-[#5c297c] mb-3 font-montserrat flex-shrink-0">
                    {isEdit
                        ? "Edit Student Information"
                        : "Student Information"}
                </h2>

                {/* SCROLLABLE FORM AREA: pr-2 provides space for the custom scrollbar */}
                <div
                    className="overflow-y-auto overflow-x-hidden pr-2 flex-1 custom-form-scrollbar"
                    style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "#5c297c transparent",
                    }}
                >
                    <style>{`
                        .custom-form-scrollbar::-webkit-scrollbar { width: 4px; }
                        .custom-form-scrollbar::-webkit-scrollbar-thumb { background-color: #5c297c; border-radius: 6px; }
                        .custom-form-scrollbar::-webkit-scrollbar-track { background: transparent; }
                        /* Ensure no ring conflict */
                        input:focus { box-shadow: 0 0 0 1px #ffb736 !important; border-color: #ffb736 !important; }
                    `}</style>

                    <form onSubmit={submit} className="flex flex-col gap-3 p-1">
                        <div className="w-full">
                            <label className={labelClass}>Student ID:</label>
                            <TextInput
                                value={data.student_number}
                                onChange={(e) =>
                                    setData("student_number", e.target.value)
                                }
                                className={`${inputClass} bg-gray-100 cursor-not-allowed text-gray-500`}
                                readOnly={true}
                            />
                            {errors.student_number && (
                                <div className="text-red-500 text-xs mt-0.5">
                                    {errors.student_number}
                                </div>
                            )}
                        </div>

                        <div className="w-full">
                            <label className={labelClass}>Full Name:</label>
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_0.6fr] gap-2">
                                <TextInput
                                    placeholder="Last Name"
                                    value={data.last_name}
                                    onChange={(e) =>
                                        setData("last_name", e.target.value)
                                    }
                                    className={inputClass}
                                    required
                                />
                                <TextInput
                                    placeholder="First Name"
                                    value={data.first_name}
                                    onChange={(e) =>
                                        setData("first_name", e.target.value)
                                    }
                                    className={inputClass}
                                    required
                                />
                                <TextInput
                                    placeholder="Middle Name"
                                    value={data.middle_name}
                                    onChange={(e) =>
                                        setData("middle_name", e.target.value)
                                    }
                                    className={inputClass}
                                    required
                                />
                                <TextInput
                                    placeholder="Suffix"
                                    value={data.suffix}
                                    onChange={(e) =>
                                        setData("suffix", e.target.value)
                                    }
                                    className={inputClass}
                                />
                            </div>
                            {errors.last_name && (
                                <span className="text-red-500 text-xs">
                                    {errors.last_name}
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <CustomSelectGroup
                                label="College:"
                                value={data.college}
                                onChange={handleCollegeChange}
                                options={safeOptions.colleges}
                                placeholder="Select College"
                                className={selectGroupOverride}
                                labelClassName={selectLabelOverride}
                            />
                            <CustomSelectGroup
                                label="Program:"
                                value={data.program}
                                onChange={(e) =>
                                    setData("program", e.target.value)
                                }
                                options={availablePrograms}
                                disabled={!data.college}
                                placeholder={
                                    !data.college
                                        ? "Select College First"
                                        : "Select Program"
                                }
                                className={selectGroupOverride}
                                labelClassName={selectLabelOverride}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="w-full">
                                <label className={labelClass}>Birthdate:</label>
                                <TextInput
                                    type="date"
                                    value={data.birthdate}
                                    onChange={(e) =>
                                        setData("birthdate", e.target.value)
                                    }
                                    onClick={(e) =>
                                        e.target.showPicker &&
                                        e.target.showPicker()
                                    }
                                    className={`${inputClass} cursor-pointer`}
                                    required
                                />
                            </div>
                            <CustomSelectGroup
                                label="Sex:"
                                value={data.sex}
                                onChange={(e) => setData("sex", e.target.value)}
                                options={[
                                    { value: "Male", label: "Male" },
                                    { value: "Female", label: "Female" },
                                ]}
                                placeholder="Select Sex"
                                className={selectGroupOverride}
                                labelClassName={selectLabelOverride}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="w-full">
                                <label className={labelClass}>
                                    Socioeconomic Status (PHP):
                                </label>
                                <TextInput
                                    type="number"
                                    placeholder="Amount in PHP"
                                    value={data.socioeconomic_status}
                                    onChange={(e) =>
                                        setData(
                                            "socioeconomic_status",
                                            e.target.value,
                                        )
                                    }
                                    className={inputClass}
                                    required
                                />
                            </div>
                            <CustomSelectGroup
                                label="Living Arrangement:"
                                value={data.living_arrangement}
                                onChange={(e) =>
                                    setData(
                                        "living_arrangement",
                                        e.target.value,
                                    )
                                }
                                options={safeOptions.livingArrangements}
                                placeholder="Select Living Arrangement"
                                className={selectGroupOverride}
                                labelClassName={selectLabelOverride}
                            />
                        </div>

                        <div className="w-full">
                            <label className={labelClass}>Address:</label>
                            <div className="flex flex-col gap-2">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <TextInput
                                        placeholder="House No."
                                        value={data.house_no}
                                        onChange={(e) =>
                                            setData("house_no", e.target.value)
                                        }
                                        className={inputClass}
                                        required
                                    />
                                    <TextInput
                                        placeholder="Street"
                                        value={data.street}
                                        onChange={(e) =>
                                            setData("street", e.target.value)
                                        }
                                        className={inputClass}
                                        required
                                    />
                                    <TextInput
                                        placeholder="Barangay"
                                        value={data.barangay}
                                        onChange={(e) =>
                                            setData("barangay", e.target.value)
                                        }
                                        className={inputClass}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <TextInput
                                        placeholder="City"
                                        value={data.city}
                                        onChange={(e) =>
                                            setData("city", e.target.value)
                                        }
                                        className={inputClass}
                                        required
                                    />
                                    <TextInput
                                        placeholder="Province"
                                        value={data.province}
                                        onChange={(e) =>
                                            setData("province", e.target.value)
                                        }
                                        className={inputClass}
                                        required
                                    />
                                    <TextInput
                                        placeholder="ZIP Code"
                                        value={data.postal_code}
                                        onChange={(e) =>
                                            setData(
                                                "postal_code",
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <CustomSelectGroup
                                label="Work Status:"
                                value={data.work_status}
                                onChange={(e) =>
                                    setData("work_status", e.target.value)
                                }
                                options={[
                                    { value: "Full-time", label: "Full-time" },
                                    { value: "Part-time", label: "Part-time" },
                                    {
                                        value: "Not-Working",
                                        label: "Not Working",
                                    },
                                ]}
                                placeholder="Select Work Status"
                                className={selectGroupOverride}
                                labelClassName={selectLabelOverride}
                            />
                            <CustomSelectGroup
                                label="Scholarship Status:"
                                value={data.scholarship}
                                onChange={(e) =>
                                    setData("scholarship", e.target.value)
                                }
                                options={[
                                    { value: "Internal", label: "MCU-Funded" },
                                    { value: "External", label: "External" },
                                    { value: "None", label: "None" },
                                ]}
                                placeholder="Select Scholarship Status"
                                className={selectGroupOverride}
                                labelClassName={selectLabelOverride}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <CustomSelectGroup
                                label="Language Spoken At Home:"
                                value={data.language}
                                onChange={(e) =>
                                    setData("language", e.target.value)
                                }
                                options={safeOptions.languages}
                                placeholder="Select Language"
                                className={selectGroupOverride}
                                labelClassName={selectLabelOverride}
                            />
                            <CustomSelectGroup
                                label="Last School Attended (SHS):"
                                value={data.last_school_type}
                                onChange={(e) =>
                                    setData("last_school_type", e.target.value)
                                }
                                options={[
                                    { value: "Private", label: "Private" },
                                    { value: "Public", label: "Public" },
                                ]}
                                placeholder="Select School Type"
                                className={selectGroupOverride}
                                labelClassName={selectLabelOverride}
                            />
                        </div>

                        {showOtherLanguage && (
                            <div className="w-full animate-fade-in">
                                <label className={labelClass}>
                                    If others, please specify:
                                </label>
                                <TextInput
                                    value={data.other_language}
                                    onChange={(e) =>
                                        setData(
                                            "other_language",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Enter other language"
                                    className={inputClass}
                                    required
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-2 mb-2 flex-shrink-0">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="px-6 py-2.5 text-sm font-bold text-[#666] bg-white border border-[#ddd] rounded-[6px] hover:bg-[#ffb736] hover:text-white transition-all duration-300"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={processing || !isFormValid()} // Disabled if processing OR if form isn't valid
                                className={`px-5 py-2 text-sm font-bold text-white rounded-[6px] transition-all duration-300 shadow-md 
                                    ${
                                        !isFormValid() && !isEdit
                                            ? "bg-gray-400 cursor-not-allowed opacity-50"
                                            : "bg-[#5c297c] hover:bg-[#ffb736]"
                                    }`}
                            >
                                {processing
                                    ? "Saving..."
                                    : isEdit
                                      ? "Update Student"
                                      : "Add Student"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
