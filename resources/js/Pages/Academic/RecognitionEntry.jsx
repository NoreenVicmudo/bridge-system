import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head, router } from "@inertiajs/react";
import UpdateRecognitionForm from "@/Components/Forms/UpdateRecognitionForm";

export default function RecognitionEntry({ student, awardCount }) {
    const { data, setData, put, processing, errors } = useForm({
        student_number: student?.student_number || "",
        award_count: awardCount || 0,
    });

    const handleSubmit = () => {
        if (student?.student_id) { // FIXED ID
            put(route("academic.recognition.update", student.student_id), {
                onSuccess: () => {
                    const saved = localStorage.getItem("academicFilterData");
                    router.get(route('academic.recognition'), saved ? JSON.parse(saved) : {});
                }
            });
        }
    };

    const fullName = student ? `${student.student_lname}, ${student.student_fname}` : "Unknown Student";

    return (
        <AuthenticatedLayout>
            <Head title="Update Academic Recognition" />
            <div className="w-full max-w-7xl mx-auto px-4 py-2">
                <UpdateRecognitionForm
                    data={data} setData={setData} errors={errors} processing={processing}
                    submit={handleSubmit} studentName={fullName} currentCount={awardCount}
                />
            </div>
        </AuthenticatedLayout>
    );
}