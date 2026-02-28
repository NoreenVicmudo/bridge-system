import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head } from "@inertiajs/react";
import UpdateAttendanceForm from "@/Components/Forms/UpdateAttendanceForm";

export default function AttendanceEntry({ student, currentAttendance }) {
    // currentAttendance should be: { attended: number, total: number }
    const { data, setData, put, processing, errors } = useForm({
        student_number: student?.student_number || "",
        attended: currentAttendance?.attended || "",
        total: currentAttendance?.total || "",
    });

    const handleSubmit = () => {
        if (student?.id) {
            put(route("review-attendance.update", student.id));
        }
    };

    const fullName = student
        ? `${student.last_name}, ${student.first_name}`
        : "";

    return (
        <AuthenticatedLayout>
            <Head title="Update Review Attendance" />
            <div className="w-full max-w-7xl mx-auto px-4 py-2">
                <UpdateAttendanceForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    submit={handleSubmit}
                    studentName={fullName}
                    currentAttendance={currentAttendance}
                />
            </div>
        </AuthenticatedLayout>
    );
}
