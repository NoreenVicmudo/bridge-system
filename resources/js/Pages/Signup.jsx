import React from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import BackgroundLayout from "@/Components/BackgroundLayout";
import CustomSelectGroup from "@/Components/SelectGroup"; // Importing your fixed component

// Sample data defined outside to keep the component clean
const SAMPLE_COLLEGES = [
    { value: 1, label: "College of Arts and Sciences" },
    { value: 2, label: "College of Nursing" },
    { value: 3, label: "College of Information Technology" },
    { value: 4, label: "College of Business and Accountancy" },
];

const SAMPLE_POSITIONS = [
    { value: 1, label: "Dean" },
    { value: 2, label: "Department Head" },
    { value: 3, label: "Faculty Member" },
    { value: 4, label: "IT Administrator" },
];

export default function SignUp({
    colleges = SAMPLE_COLLEGES,
    positions = SAMPLE_POSITIONS,
}) {
    const { data, setData, post, processing, errors } = useForm({
        college: "",
        position: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("signup.store"));
    };

    return (
        <BackgroundLayout>
            <Head title="BRIDGE - Sign Up" />

            {/* Unified Purple Scrollbar Styling */}
            <style>{`
                .signup-purple-scroll ul::-webkit-scrollbar { width: 6px; }
                .signup-purple-scroll ul::-webkit-scrollbar-thumb { background-color: #5c297c; border-radius: 10px; }
                .signup-purple-scroll ul::-webkit-scrollbar-track { background: transparent; }
            `}</style>

            <Link
                href={route("login")}
                className="fixed top-5 left-5 flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-md text-slate-600 bg-white hover:bg-[#ffb736] hover:text-white hover:border-[#ffb736] transition-all z-10 font-medium shadow-sm"
            >
                <i className="bi bi-arrow-left"></i> Back
            </Link>

            <div className="flex items-center justify-center min-h-screen p-4 font-montserrat">
                <div className="w-full max-w-[500px] bg-white p-8 rounded-xl shadow-2xl animate-fade-in overflow-visible">
                    <h2 className="text-2xl font-bold text-[#5c297c] mb-8 text-left border-b pb-2">
                        Select Affiliation
                    </h2>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-2 text-left overflow-visible"
                    >
                        {/* College Dropdown using your CustomSelectGroup */}
                        <CustomSelectGroup
                            label="Select College"
                            value={data.college}
                            onChange={(e) => setData("college", e.target.value)}
                            options={colleges}
                            placeholder="Choose your college"
                            vertical={true} // Labels on top
                            error={errors.college}
                            className="signup-purple-scroll"
                        />

                        {/* Position Dropdown using your CustomSelectGroup */}
                        <CustomSelectGroup
                            label="Select Position"
                            value={data.position}
                            onChange={(e) =>
                                setData("position", e.target.value)
                            }
                            options={positions}
                            placeholder="Choose your position"
                            vertical={true} // Labels on top
                            error={errors.position}
                            className="signup-purple-scroll"
                        />

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={
                                    processing ||
                                    !data.college ||
                                    !data.position
                                }
                                className={`w-full max-w-[260px] mx-auto block font-bold py-3 rounded-lg transition-all shadow-md active:translate-y-1 flex justify-center items-center gap-3
                                    ${
                                        !data.college || !data.position
                                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                            : "bg-[#5c297c] hover:bg-[#ffb736] text-white cursor-pointer"
                                    }`}
                            >
                                {processing ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <span className="tracking-wide uppercase text-sm">
                                        Continue
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </BackgroundLayout>
    );
}
