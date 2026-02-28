import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head } from "@inertiajs/react";
import UpdateRetakesForm from "@/Components/Forms/UpdateRetakesForm";

export default function RetakesEntry({
    student,
    subjectOptions,
    currentRetakes,
}) {
    const { data, setData, put, processing, errors } = useForm({
        student_number: student?.student_number || "",
        general_subject_id: "",
        terms_repeated: "",
    });

    const handleSubmit = () => {
        if (student?.id) {
            put(route("back-subjects.update", student.id));
        }
    };

    const fullName = student
        ? `${student.last_name}, ${student.first_name}`
        : "";

    return (
        <AuthenticatedLayout>
            <Head title="Update Back Subjects / Retakes" />
            <div className="w-full max-w-7xl mx-auto px-4 py-2">
                <UpdateRetakesForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    submit={handleSubmit}
                    studentName={fullName}
                    subjectOptions={subjectOptions} // [{ value, label }]
                    currentRetakes={currentRetakes} // { subject_id: terms_repeated }
                />
            </div>
        </AuthenticatedLayout>
    );
}
