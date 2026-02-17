import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head } from "@inertiajs/react";
import StudentForm from "@/Components/Forms/StudentForm";

export default function StudentEntryPage({
    student = null,
    prefilledId = null,
    options,
}) {
    // 1. Logic Check: If 'student' prop exists, we are in Edit mode.
    const isEdit = !!student;

    // 2. Initialize the form
    // If editing, use student data. If adding, use empty strings (or prefilledId).
    const { data, setData, post, put, processing, errors } = useForm({
        student_number: isEdit ? student.student_number : prefilledId || "",
        last_name: isEdit ? student.last_name : "",
        first_name: isEdit ? student.first_name : "",
        middle_name: isEdit ? student.middle_name : "",
        suffix: isEdit ? student.suffix : "",
        college: isEdit ? student.college : "",
        program: isEdit ? student.program : "",
        birthdate: isEdit ? student.birthdate : "",
        sex: isEdit ? student.sex : "",
        socioeconomic_status: isEdit ? student.socioeconomic_status : "",
        living_arrangement: isEdit ? student.living_arrangement : "",
        house_no: isEdit ? student.house_no : "",
        street: isEdit ? student.street : "",
        barangay: isEdit ? student.barangay : "",
        city: isEdit ? student.city : "",
        province: isEdit ? student.province : "",
        postal_code: isEdit ? student.postal_code : "",
        work_status: isEdit ? student.work_status : "",
        scholarship: isEdit ? student.scholarship : "",
        language: isEdit ? student.language : "",
        last_school_type: isEdit ? student.last_school_type : "",
    });

    // 3. Handle Submit based on mode
    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route("students.update", student.id));
        } else {
            post(route("students.store"));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={isEdit ? "Edit Student" : "Add Student"} />
            <div className="w-full max-w-7xl mx-auto px-4 py-2">
                {/* The StudentForm we built handles all the design */}
                <StudentForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    submit={handleSubmit}
                    isEdit={isEdit}
                    options={options}
                />
            </div>
        </AuthenticatedLayout>
    );
}
