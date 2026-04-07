import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head, router } from "@inertiajs/react"; // <-- Added router
import UpdateBoardGradesForm from "@/Components/Forms/UpdateBoardGradesForm";

export default function BoardGradesEntry({
    student,
    subjectOptions,
    currentGrades,
}) {
    const { data, setData, put, processing, errors } = useForm({
        student_number: student?.student_number || "",
        subject_id: "",
        subject_grade: "",
    });

    const handleSubmit = () => {
        if (student?.student_id) {
            put(route("board-grades.update", student.student_id), {
                onSuccess: () => {
                    // Grab the exact filters the user used to generate the table
                    const saved = localStorage.getItem("academicFilterData");
                    const filters = saved ? JSON.parse(saved) : {};
                    
                    // Route directly back to the board subjects table
                    router.get(route('board.subject.grades'), filters);
                }
            });
        }
    };

    const fullName = student
        ? `${student.student_lname}, ${student.student_fname}`
        : "Unknown Student";

    return (
        <AuthenticatedLayout>
            <Head title="Update Board Subject Grades" />
            <div className="w-full max-w-7xl mx-auto px-4 py-2">
                <UpdateBoardGradesForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    submit={handleSubmit} 
                    studentName={fullName}
                    subjectOptions={subjectOptions} 
                    currentGrades={currentGrades} 
                />
            </div>
        </AuthenticatedLayout>
    );
}