import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head, router } from "@inertiajs/react";
import UpdateAttendanceForm from "@/Components/Forms/UpdateAttendanceForm";

export default function AttendanceEntry({ student, currentAttendance }) {
    const { data, setData, put, processing, errors } = useForm({
        student_number: student?.student_number || "",
        attended: currentAttendance?.attended || 0,
        total: currentAttendance?.total || 0,
    });

    const handleSubmit = () => {
        if (student?.student_id) {
            put(route("review.attendance.update", student.student_id), {
                onSuccess: () => {
                    const saved = localStorage.getItem("academicFilterData");
                    router.get(route('review.attendance'), saved ? JSON.parse(saved) : {});
                }
            });
        }
    };

    const fullName = student ? `${student.student_lname}, ${student.student_fname}` : "Unknown Student";

    return (
        <AuthenticatedLayout>
            <Head title="Update Review Attendance" />
            <div className="w-full max-w-7xl mx-auto px-4 py-2">
                <UpdateAttendanceForm
                    data={data} setData={setData} errors={errors} processing={processing}
                    submit={handleSubmit} studentName={fullName} currentAttendance={currentAttendance} 
                />
            </div>
        </AuthenticatedLayout>
    );
}