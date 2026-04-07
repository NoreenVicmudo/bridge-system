import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head, router } from "@inertiajs/react"; // Added router
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
        // FIXED: Use student_id (DB primary key) and added navigation logic
        if (student?.student_id) {
            put(route("retakes.update", student.student_id), {
                onSuccess: () => {
                    // Pull saved filters from localStorage to return to the exact table view
                    const saved = localStorage.getItem("academicFilterData");
                    const filters = saved ? JSON.parse(saved) : {};
                    
                    // Route back to the info page with current filters
                    router.get(route('retakes.info'), filters);
                }
            });
        }
    };

    // FIXED: Use student_lname and student_fname
    const fullName = student
        ? `${student.student_lname}, ${student.student_fname}`
        : "Unknown Student";

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
                    subjectOptions={subjectOptions}
                    currentRetakes={currentRetakes}
                />
            </div>
        </AuthenticatedLayout>
    );
}