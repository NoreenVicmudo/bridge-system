import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head } from "@inertiajs/react";
import UpdateGWAForm from "@/Components/Forms/UpdateGWAForm";

export default function UpdateGWAPage({ student, gwaRecords = [] }) {
    const { data, setData, put, processing, errors } = useForm({
        student_number: student?.student_number || "",
        year_level: "",
        semester: "",
        gwa: "",
    });

    const handleSubmit = () => {
        if (student?.id) {
            put(route("gwa.update", student.id));
        }
    };

    const fullName = student
        ? `${student.last_name}, ${student.first_name}`
        : "";

    return (
        <AuthenticatedLayout>
            <Head title="Update GWA" />
            <div className="w-full max-w-7xl mx-auto px-4 py-2">
                <UpdateGWAForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    submit={handleSubmit}
                    studentName={fullName}
                    gwaRecords={gwaRecords}
                />
            </div>
        </AuthenticatedLayout>
    );
}
