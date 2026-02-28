import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head } from "@inertiajs/react";
import UpdateSimExamForm from "@/Components/Forms/UpdateSimExamForm";

export default function SimExamResultsEntry({
    student,
    simulationOptions,
    currentResults,
}) {
    const { data, setData, put, processing, errors } = useForm({
        student_number: student?.student_number || "",
        simulation_id: "",
        score: "",
    });

    const handleSubmit = () => {
        if (student?.id) {
            put(route("simulation-exams.update", student.id));
        }
    };

    const fullName = student
        ? `${student.last_name}, ${student.first_name}`
        : "";

    return (
        <AuthenticatedLayout>
            <Head title="Update Simulation Exam Results" />
            <div className="w-full max-w-7xl mx-auto px-4 py-2">
                <UpdateSimExamForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    submit={handleSubmit}
                    studentName={fullName}
                    simulationOptions={simulationOptions} // [{ value, label }]
                    currentResults={currentResults} // { simulation_id: score }
                />
            </div>
        </AuthenticatedLayout>
    );
}
