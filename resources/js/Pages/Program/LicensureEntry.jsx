import React, { useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head, router } from "@inertiajs/react";
import UpdateLicensureForm from "@/Components/Forms/UpdateLicensureForm";

export default function LicensureEntry({ student }) {
    // 1. Bulletproof Data Extraction
    const rawStudent = student?.data || student || {};
    const safeStudentId = rawStudent.student_number || "No ID Found";
    const safeStudentName = rawStudent.lname 
        ? `${rawStudent.lname}, ${rawStudent.fname}` 
        : "Unknown Student";

    const { data, setData, put, processing, errors } = useForm({
        student_number: safeStudentId,
        exam_result: rawStudent.exam_result || "",
        exam_date_taken: rawStudent.exam_date_taken || "",
    });

    // 2. Navigation handler that remembers where the user came from
    const handleBack = () => {
        const saved = localStorage.getItem("programFilterData");
        router.get(route('licensure.exam'), saved ? JSON.parse(saved) : {});
    };

    const handleSubmit = () => {
        if (rawStudent.batch_id) {
            // FIXED: Matches the 'licensure.exams.update' route in your web.php
            put(route("licensure.exams.update", rawStudent.batch_id), {
                preserveScroll: true,
                onSuccess: () => {
                    // We don't redirect on success to allow quick corrections
                }
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Update Licensure Exam Result" />
            
            <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
                {/* Unified Header */}
                <div className="flex items-center justify-between mb-6 bg-white p-5 rounded-[10px] shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-gray-100">
                    <div>
                        <h2 className="text-2xl md:text-[26px] font-bold text-[#5c297c]">Licensure Exam Entry</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Recording results for <span className="font-bold text-gray-800">{safeStudentId}</span>
                        </p>
                    </div>
                    <button 
                        onClick={handleBack}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-600 border border-gray-300 rounded-[6px] hover:bg-gray-50 hover:text-[#5c297c] hover:border-[#5c297c] transition-all duration-300 text-sm font-bold shadow-sm group"
                    >
                        <i className="bi bi-arrow-left transition-transform group-hover:-translate-x-1"></i> 
                        Back
                    </button>
                </div>

                {/* Form Wrapper */}
                <div className="bg-white rounded-[10px] shadow-[0_6px_25px_rgba(0,0,0,0.1)] p-6 md:p-8">
                    <UpdateLicensureForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        submit={handleSubmit}
                        studentName={safeStudentName}
                        studentNumber={safeStudentId} // Pass directly
                        currentResult={rawStudent.exam_result}
                        currentDate={rawStudent.exam_date_taken}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}