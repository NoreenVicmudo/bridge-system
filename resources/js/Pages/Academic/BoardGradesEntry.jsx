import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head } from "@inertiajs/react";
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
        if (student?.id) {
            put(route("board-grades.update", student.id));
        }
    };

    const fullName = student
        ? `${student.last_name}, ${student.first_name}`
        : "";

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
                    subjectOptions={subjectOptions} // Array: [{ value, label }]
                    currentGrades={currentGrades} // Object: { subject_id: grade }
                />
            </div>
        </AuthenticatedLayout>
    );
}
