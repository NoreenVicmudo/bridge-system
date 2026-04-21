import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head, router } from "@inertiajs/react";
import UpdateBoardGradesForm from "@/Components/Forms/UpdateBoardGradesForm";

export default function BoardGradesEntry({ student, subjectOptions, currentGrades }) {
    const safeStudentId = student?.student_number || "No ID Found";
    const safeStudentName = student
        ? `${student.student_lname}, ${student.student_fname}`
        : "Unknown Student";

    const { data, setData, put, processing, errors } = useForm({
        student_number: safeStudentId,
        subject_id: "",
        subject_grade: "",
    });

    const handleBack = () => {
        const saved = localStorage.getItem("academicFilterData");
        const filters = saved ? JSON.parse(saved) : {};
        router.get(route('board.subject.grades'), filters);
    };

    const handleSubmit = () => {
        if (student?.student_id) {
            put(route("board-grades.update", student.student_id), {
                preserveScroll: true,
                onSuccess: () => {
                    // Stay on page for quick corrections
                }
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Update Board Subject Grades" />
            
            <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
                {/* Unified Header */}
                <div className="flex items-center justify-between mb-6 bg-white p-5 rounded-[10px] shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-gray-100 font-montserrat">
                    <div>
                        <h2 className="text-2xl md:text-[26px] font-bold text-[#5c297c]">Board Grades Entry</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Updating record for <span className="font-bold text-gray-800">{safeStudentId}</span>
                        </p>
                    </div>
                    <button 
                        onClick={handleBack}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-600 border border-gray-300 rounded-[6px] hover:bg-gray-50 hover:text-[#5c297c] hover:border-[#5c297c] transition-all duration-300 text-sm font-bold shadow-sm group"
                    >
                        <i className="bi bi-arrow-left transition-transform group-hover:-translate-x-1"></i> 
                        Back to List
                    </button>
                </div>

                {/* Form Wrapper */}
                <div className="bg-white rounded-[10px] shadow-[0_6px_25px_rgba(0,0,0,0.1)] p-6 md:p-8">
                    <UpdateBoardGradesForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        submit={handleSubmit} 
                        studentName={safeStudentName}
                        studentNumber={safeStudentId}
                        subjectOptions={subjectOptions} 
                        currentGrades={currentGrades} 
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}