import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head } from "@inertiajs/react";
import UpdateReviewCenterForm from "@/Components/Forms/UpdateReviewCenterForm";

export default function ReviewCenterEntry({ student }) {
    // student prop should contain: student_number, fname, lname, review_center, batch_id, etc.
    const { data, setData, put, processing, errors } = useForm({
        student_number: student?.student_number || "",
        review_center: student?.review_center || "",
        batch_id: student?.batch_id || "", // Hidden dependency from your PHP code
    });

    const handleSubmit = () => {
        if (student?.batch_id) {
            put(route("review-center.update", student.batch_id));
        }
    };

    const fullName = student ? `${student.lname}, ${student.fname}` : "";

    return (
        <AuthenticatedLayout>
            <Head title="Update Review Center" />
            <div className="w-full max-w-7xl mx-auto px-4 py-2">
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
        </AuthenticatedLayout>
    );
}
