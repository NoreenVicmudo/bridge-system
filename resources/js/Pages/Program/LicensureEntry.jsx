import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head } from "@inertiajs/react";
import UpdateLicensureForm from "@/Components/Forms/UpdateLicensureForm";

export default function LicensureEntry({ student }) {
    const { data, setData, put, processing, errors } = useForm({
        student_number: student?.student_number || "",
        batch_id: student?.batch_id || "",
        exam_result: student?.exam_result || "",
        exam_date_taken: student?.exam_date_taken || "",
    });

    const handleSubmit = () => {
        if (student?.batch_id) {
            put(route("licensure-exams.update", student.batch_id));
        }
    };

    const fullName = student ? `${student.lname}, ${student.fname}` : "";

    return (
        <AuthenticatedLayout>
            <Head title="Update Licensure Exam Result" />
            <div className="w-full max-w-7xl mx-auto px-4 py-2">
                <UpdateLicensureForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    submit={handleSubmit}
                    studentName={fullName}
                    currentResult={student?.exam_result}
                    currentDate={student?.exam_date_taken}
                />
            </div>
        </AuthenticatedLayout>
    );
}
