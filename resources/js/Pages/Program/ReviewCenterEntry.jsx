import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head, router } from "@inertiajs/react"; 
import UpdateReviewCenterForm from "@/Components/Forms/UpdateReviewCenterForm";

export default function ReviewCenterEntry({ student }) {
    const safeStudentId = student?.student_number || "No ID Found";
    const fullName = student ? `${student.lname}, ${student.fname}` : "Unknown Student";

    const { data, setData, put, processing, errors } = useForm({
        student_number: safeStudentId,
        review_center: student?.review_center || "",
        batch_id: student?.batch_id || "", 
    });

    const handleSubmit = () => {
        if (student?.batch_id) {
            put(route("review.center.update", student.batch_id), {
                preserveScroll: true,
                onSuccess: () => {
                    // We don't redirect on success to allow quick corrections
                }
            });
        }
    };

    // Navigation handler that remembers where the user came from
    const handleBack = () => {
        const saved = localStorage.getItem("programFilterData");
        router.get(route('review.center'), saved ? JSON.parse(saved) : {});
    };

    return (
        <AuthenticatedLayout>
            <Head title="Update Review Center" />
            
            <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
                {/* Unified Header */}
                <div className="flex items-center justify-between mb-6 bg-white p-5 rounded-[10px] shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-gray-100">
                    <div>
                        <h2 className="text-2xl md:text-[26px] font-bold text-[#5c297c]">Review Center Entry</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Updating record for <span className="font-bold text-gray-800">{safeStudentId}</span>
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
                    <UpdateReviewCenterForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        submit={handleSubmit}
                        studentName={fullName}
                        currentReviewCenter={student?.review_center}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}