import React, { useEffect } from "react";
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

    // If editing an existing record, pre-fill
    useEffect(() => {
        if (gwaRecords.length > 0) {
            const record = gwaRecords[0];
            setData({
                student_number: student.student_number,
                year_level: record.year_level,   // was 'academic_year'
                semester: record.semester,
                gwa: record.gwa,
            });
        }
    }, [gwaRecords]);

    const handleSubmit = () => {
        if (student?.id) {
            put(route("gwa.update", student.id));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Update GWA" />
            <div className="max-w-2xl mx-auto py-8">
                <UpdateGWAForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    submit={handleSubmit}
                    studentName={`${student?.last_name}, ${student?.first_name}`}
                    gwaRecords={gwaRecords}
                />
            </div>
        </AuthenticatedLayout>
    );
}