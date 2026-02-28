import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head } from "@inertiajs/react";
import UpdateRecognitionForm from "@/Components/Forms/UpdateRecognitionForm";

export default function RecognitionEntry({ student, awardCount }) {
    const { data, setData, put, processing, errors } = useForm({
        student_number: student?.student_number || "",
        award_count: awardCount || 0,
    });

    const handleSubmit = () => {
        if (student?.id) {
            put(route("academic-recognition.update", student.id));
        }
    };

    const fullName = student
        ? `${student.last_name}, ${student.first_name}`
        : "";

    return (
        <AuthenticatedLayout>
            <Head title="Update Academic Recognition" />
            <div className="w-full max-w-7xl mx-auto px-4 py-2">
                <UpdateRecognitionForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    submit={handleSubmit}
                    studentName={fullName}
                    currentCount={awardCount}
                />
            </div>
        </AuthenticatedLayout>
    );
}
