import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head, router } from "@inertiajs/react";
import UpdateSimExamForm from "@/Components/Forms/UpdateSimExamForm";

export default function SimExamResultsEntry({ student, simulationOptions, currentResults }) {
    const { data, setData, put, processing, errors } = useForm({
        student_number: student?.student_number || "",
        simulation_id: "",
        score: "",
        exam_period: "Default",
    });

    const handleSubmit = () => {
        if (student?.student_id) { // FIXED ID
            put(route("simulation-exam.update", student.student_id), {
                onSuccess: () => {
                    // FIXED NAVIGATION
                    const saved = localStorage.getItem("academicFilterData");
                    const filters = saved ? JSON.parse(saved) : {};
                    router.get(route('simulation.exam'), filters);
                }
            });
        }
    };

    // FIXED NAME
    const fullName = student ? `${student.student_lname}, ${student.student_fname}` : "Unknown Student";

    return (
        <AuthenticatedLayout>
            <Head title="Update Simulation Exam Results" />
            <div className="w-full max-w-7xl mx-auto px-4 py-2">
                <UpdateSimExamForm
                    data={data} setData={setData} errors={errors} processing={processing}
                    submit={handleSubmit} studentName={fullName}
                    simulationOptions={simulationOptions} currentResults={currentResults} 
                />
            </div>
        </AuthenticatedLayout>
    );
}