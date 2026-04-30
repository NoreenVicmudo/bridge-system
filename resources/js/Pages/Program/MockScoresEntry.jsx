import React, { useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head, router } from "@inertiajs/react";
import UpdateMockScoresForm from "@/Components/Forms/UpdateMockScoresForm";

export default function MockScoresEntry({ student, subjectOptions, currentScores, examPeriod = "Default" }) {
    const rawStudent = student?.data || student || {};
    const safeStudentId = rawStudent.student_number || "No ID Found";
    const safeStudentName = rawStudent.lname 
        ? `${rawStudent.lname}, ${rawStudent.fname}` 
        : "Unknown Student";

    // 🧠 Add exam_period to the form state
    const { data, setData, put, processing, errors, reset } = useForm({
        mock_subject_id: "",
        score: "",
        exam_period: examPeriod, 
    });

    const handleBack = () => {
        const saved = localStorage.getItem("programFilterData");
        if (saved) {
            router.get(route('mock.board.scores'), JSON.parse(saved));
        } else {
            window.history.back(); 
        }
    };

    const handleSubmit = () => {
        if (rawStudent.batch_id) {
            put(route("mock-scores.update", rawStudent.batch_id), {
                preserveScroll: true,
                onSuccess: () => {
                    reset('score'); 
                }
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Update Mock Board Scores" />
            <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
                <div className="flex items-center justify-between mb-6 bg-white p-5 rounded-[10px] shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-gray-100">
                    <div>
                        <h2 className="text-2xl md:text-[26px] font-bold text-[#5c297c]">Mock Board Scores Entry</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Recording scores for <span className="font-bold text-gray-800">{safeStudentId}</span>
                        </p>
                    </div>
                    <button onClick={handleBack} className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-600 border border-gray-300 rounded-[6px] hover:bg-gray-50 hover:text-[#5c297c] hover:border-[#5c297c] transition-all duration-300 text-sm font-bold shadow-sm group">
                        <i className="bi bi-arrow-left transition-transform group-hover:-translate-x-1"></i> 
                        Back
                    </button>
                </div>

                <div className="bg-white rounded-[10px] shadow-[0_6px_25px_rgba(0,0,0,0.1)] p-6 md:p-8">
                    <UpdateMockScoresForm
                        data={data} setData={setData} errors={errors} processing={processing} submit={handleSubmit}
                        studentName={safeStudentName} studentNumber={safeStudentId} 
                        subjectOptions={subjectOptions} currentScores={currentScores} 
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}