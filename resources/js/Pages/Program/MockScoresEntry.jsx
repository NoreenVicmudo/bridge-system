import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head } from "@inertiajs/react";
import UpdateMockScoresForm from "@/Components/Forms/UpdateMockScoresForm";

export default function MockScoresEntry({
    student,
    subjectOptions,
    studentScores,
    totalScores,
}) {
    const { data, setData, put, processing, errors } = useForm({
        student_number: student?.student_number || "",
        batch_id: student?.batch_id || "",
        mock_subject_id: "",
        student_score: "",
        total_score: "",
    });

    const handleSubmit = () => {
        if (student?.batch_id) {
            put(route("mock-scores.update", student.batch_id));
        }
    };

    const fullName = student ? `${student.lname}, ${student.fname}` : "";

    return (
        <AuthenticatedLayout>
            <Head title="Update Mock Board Scores" />
            <div className="w-full max-w-7xl mx-auto px-4 py-2">
                <UpdateMockScoresForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    submit={handleSubmit}
                    studentName={fullName}
                    subjectOptions={subjectOptions} // [{ value, label }]
                    studentScores={studentScores} // { mock_subject_id: score }
                    totalScores={totalScores} // { mock_subject_id: total }
                />
            </div>
        </AuthenticatedLayout>
    );
}
