import React, { useState, useMemo } from "react";
import TextInput from "@/Components/TextInput";
import CustomSelectGroup from "@/Components/SelectGroup";
import ConfirmSaveModal from "@/Components/Modals/ConfirmSaveModal";

export default function CreateUserForm({
    data,
    setData,
    errors = {},
    processing = false,
    submit,
    collegeOptions = [],
    programOptions = [],
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const inputClass =
        "w-full border-gray-300 rounded-[5px] shadow-sm text-sm p-2 focus:border-[#ffb736] focus:ring-[#ffb736] focus:ring-1 focus:outline-none transition-colors duration-200 placeholder:text-gray-400";
    const labelClass = "block mb-0.5 font-bold text-sm text-[#5c297c]";
    const errorClass = "text-[#ed1c24] text-[11px] font-bold mt-1";
    const selectGroupOverride =
        "!flex-col !items-start !gap-0.5 mb-0 w-full !whitespace-nowrap";
    const selectLabelOverride =
        "!w-full !text-left !font-bold !text-[#5c297c] !mb-0 !whitespace-nowrap";

    const positionOptions = [
        { value: "Super Admin", label: "Super Admin" },
        { value: "Admin", label: "Admin" },
        { value: "Academic Affairs", label: "Academic Affairs" },
        { value: "Dean", label: "Dean" },
        { value: "Administrative Assistant", label: "Administrative Assistant" },
        { value: "Program Head", label: "Program Head" },
    ];

    const needsCollege = [
        "Dean",
        "Administrative Assistant",
        "Program Head",
    ].includes(data.position);
    const needsProgram = data.position === "Program Head";

    const handlePositionChange = (e) => {
        const newPos = e.target.value;
        const willNeedCollege = [
            "Dean",
            "Administrative Assistant",
            "Program Head",
        ].includes(newPos);
        const willNeedProgram = newPos === "Program Head";

        setData((prev) => ({
            ...prev,
            position: newPos,
            college_id: willNeedCollege ? prev.college_id : "",
            program_id: willNeedProgram ? prev.program_id : "",
        }));
    };

    const handleCollegeChange = (e) => {
        const selectedCollegeId = e.target.value;
        setData((prev) => ({
            ...prev,
            college_id: selectedCollegeId,
            program_id: "", 
        }));
    };

    const filteredPrograms = useMemo(() => {
        if (!data.college_id) return [];
        return programOptions
            .filter(
                (p) =>
                    p.college_id &&
                    p.college_id.toString() === data.college_id.toString(),
            )
            .map((p) => ({ value: p.value.toString(), label: p.label }));
    }, [data.college_id, programOptions]);

    const isFormValid =
        data.fname.trim() !== "" &&
        data.lname.trim() !== "" &&
        data.username.trim() !== "" &&
        data.email.trim() !== "" &&
        data.password.trim() !== "" &&
        data.position !== "" &&
        (!needsCollege || data.college_id !== "") &&
        (!needsProgram || data.program_id !== "");

    const openConfirmModal = (e) => {
        e.preventDefault();
        if (isFormValid) setIsModalOpen(true);
    };

    return (
        // 🧠 FIXED: Stripped outer wrappers. Just returns the form structure.
        <div className="w-full font-montserrat text-left text-[#5c297c]">
            <form
                onSubmit={openConfirmModal}
                className="flex flex-col gap-4"
            >
                <div className="bg-purple-50/30 p-4 rounded-lg border border-purple-100/50 space-y-4">
                    <h3 className="text-[11px] font-bold mb-2 uppercase tracking-widest opacity-70">
                        Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="w-full">
                            <label className={labelClass}>
                                First Name:{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <TextInput
                                type="text"
                                value={data.fname}
                                onChange={(e) =>
                                    setData("fname", e.target.value)
                                }
                                className={inputClass}
                                placeholder="e.g. Juan"
                                required
                            />
                            {errors.fname && (
                                <p className={errorClass}>
                                    {errors.fname}
                                </p>
                            )}
                        </div>
                        <div className="w-full">
                            <label className={labelClass}>
                                Last Name:{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <TextInput
                                type="text"
                                value={data.lname}
                                onChange={(e) =>
                                    setData("lname", e.target.value)
                                }
                                className={inputClass}
                                placeholder="e.g. Dela Cruz"
                                required
                            />
                            {errors.lname && (
                                <p className={errorClass}>
                                    {errors.lname}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-purple-50/30 p-4 rounded-lg border border-purple-100/50 space-y-4">
                    <h3 className="text-[11px] font-bold mb-2 uppercase tracking-widest opacity-70">
                        Account Credentials
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="w-full">
                            <label className={labelClass}>
                                Username:{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <TextInput
                                type="text"
                                value={data.username}
                                onChange={(e) =>
                                    setData("username", e.target.value)
                                }
                                className={inputClass}
                                placeholder="Enter unique username"
                                required
                            />
                            {errors.username && (
                                <p className={errorClass}>
                                    {errors.username}
                                </p>
                            )}
                        </div>
                        <div className="w-full">
                            <label className={labelClass}>
                                Email Address:{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <TextInput
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                className={inputClass}
                                placeholder="name@mcu.edu.ph"
                                required
                            />
                            {errors.email && (
                                <p className={errorClass}>
                                    {errors.email}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="w-full">
                        <label className={labelClass}>
                            Password:{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <TextInput
                            type="password"
                            value={data.password}
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                            className={inputClass}
                            placeholder="Minimum 8 characters"
                            required
                        />
                        {errors.password && (
                            <p className={errorClass}>
                                {errors.password}
                            </p>
                        )}
                    </div>
                </div>

                <div className="bg-purple-50/30 p-4 rounded-lg border border-purple-100/50 space-y-4">
                    <h3 className="text-[11px] font-bold mb-2 uppercase tracking-widest opacity-70">
                        Access & Roles
                    </h3>
                    <div className="space-y-3">
                        <CustomSelectGroup
                            label={
                                <span>
                                    Position:{" "}
                                    <span className="text-red-500">*</span>
                                </span>
                            }
                            value={data.position}
                            onChange={handlePositionChange}
                            options={positionOptions}
                            placeholder="Select Position"
                            vertical={true}
                            className={selectGroupOverride}
                            labelClassName={selectLabelOverride}
                        />
                        {errors.position && (
                            <p className={errorClass}>
                                {errors.position}
                            </p>
                        )}

                        {needsCollege && (
                            <div className="animate-fade-in-up">
                                <CustomSelectGroup
                                    label={
                                        <span>
                                            College:{" "}
                                            <span className="text-red-500">*</span>
                                        </span>
                                    }
                                    value={data.college_id}
                                    onChange={handleCollegeChange}
                                    options={collegeOptions}
                                    placeholder="Select College"
                                    vertical={true}
                                    className={selectGroupOverride}
                                    labelClassName={selectLabelOverride}
                                />
                                {errors.college_id && (
                                    <p className={errorClass}>
                                        {errors.college_id}
                                    </p>
                                )}
                            </div>
                        )}

                        {needsProgram && (
                            <div className="animate-fade-in-up">
                                <CustomSelectGroup
                                    label={
                                        <span>
                                            Program:{" "}
                                            <span className="text-red-500">*</span>
                                        </span>
                                    }
                                    value={data.program_id}
                                    onChange={(e) =>
                                        setData("program_id", e.target.value)
                                    }
                                    options={filteredPrograms}
                                    disabled={!data.college_id}
                                    placeholder={
                                        !data.college_id
                                            ? "Select College First"
                                            : "Select Program"
                                    }
                                    vertical={true}
                                    className={selectGroupOverride}
                                    labelClassName={selectLabelOverride}
                                />
                                {errors.program_id && (
                                    <p className={errorClass}>
                                        {errors.program_id}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                    <button
                        type="submit"
                        disabled={processing || !isFormValid}
                        className={`px-10 py-3 text-sm font-bold text-white rounded-[6px] transition-all duration-300 shadow-md flex items-center justify-center gap-2 ${!isFormValid ? "bg-gray-400 cursor-not-allowed opacity-70" : "bg-[#5c297c] hover:bg-[#ffb736]"}`}
                    >
                        {processing ? (
                            <>
                                <div className="loader w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>{" "}
                                Saving...
                            </>
                        ) : (
                            "Create User"
                        )}
                    </button>
                </div>
            </form>

            <ConfirmSaveModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={submit}
                message={
                    <>
                        Are you sure you want to create a new account for{" "}
                        <br />
                        <strong>{data.username}</strong>?
                    </>
                }
            />
        </div>
    );
}