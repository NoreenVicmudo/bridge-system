import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head, router } from "@inertiajs/react";
import UpdatePerformanceForm from "@/Components/Forms/UpdatePerformanceForm";

export default function PerformanceRatingEntry({ student, categoryOptions, currentRatings }) {
    const { data, setData, put, processing, errors } = useForm({
        student_number: student?.student_number || "",
        category_id: "",
        rating: "",
    });

    const handleSubmit = () => {
        if (student?.student_id) { // FIXED ID
            put(route("performance-rating.update", student.student_id), {
                onSuccess: () => {
                    // FIXED NAVIGATION
                    const saved = localStorage.getItem("academicFilterData");
                    const filters = saved ? JSON.parse(saved) : {};
                    router.get(route('performance.rating'), filters);
                }
            });
        }
    };

    // FIXED NAME
    const fullName = student ? `${student.student_lname}, ${student.student_fname}` : "Unknown Student";

    return (
        <AuthenticatedLayout>
            <Head title="Update Performance Rating" />
            <div className="w-full max-w-7xl mx-auto px-4 py-2">
                <UpdatePerformanceForm
                    data={data} setData={setData} errors={errors} processing={processing}
                    submit={handleSubmit} studentName={fullName}
                    categoryOptions={categoryOptions} currentRatings={currentRatings} 
                />
            </div>
        </AuthenticatedLayout>
    );
}