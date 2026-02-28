import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head } from "@inertiajs/react";
import UpdatePerformanceForm from "@/Components/Forms/UpdatePerformanceForm";

export default function PerformanceRatingEntry({
    student,
    categoryOptions,
    currentRatings,
}) {
    const { data, setData, put, processing, errors } = useForm({
        student_number: student?.student_number || "",
        category_id: "",
        rating: "",
    });

    const handleSubmit = () => {
        if (student?.id) {
            put(route("performance-rating.update", student.id));
        }
    };

    const fullName = student
        ? `${student.last_name}, ${student.first_name}`
        : "";

    return (
        <AuthenticatedLayout>
            <Head title="Update Performance Rating" />
            <div className="w-full max-w-7xl mx-auto px-4 py-2">
                <UpdatePerformanceForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    submit={handleSubmit}
                    studentName={fullName}
                    categoryOptions={categoryOptions} // Array: [{ value, label }]
                    currentRatings={currentRatings} // Object: { category_id: rating }
                />
            </div>
        </AuthenticatedLayout>
    );
}
