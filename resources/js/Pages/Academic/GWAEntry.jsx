import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head, router } from "@inertiajs/react"; // <-- Added router
import UpdateGWAForm from "@/Components/Forms/UpdateGWAForm";

export default function UpdateGWAPage({ student, gwaRecords = [] }) {
    const { data, setData, put, processing, errors } = useForm({
        student_number: student?.student_number || "",
        year_level: "",
        semester: "",
        gwa: "",
    });

    const handleSubmit = () => {
        if (student?.student_id) { 
            put(route("gwa.update", student.student_id), {
                onSuccess: () => {
                    // Grab the exact filters the user used to generate the table
                    const saved = localStorage.getItem("academicFilterData");
                    const filters = saved ? JSON.parse(saved) : {};
                    
                    // Route directly back to the table with fresh data
                    router.get(route('gwa.info'), filters);
                }
            });
        }
    };

    const fullName = student 
        ? `${student.student_lname}, ${student.student_fname}` 
        : "Unknown Student";

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
                    studentName={fullName}
                    gwaRecords={gwaRecords}
                />
            </div>
        </AuthenticatedLayout>
    );
}