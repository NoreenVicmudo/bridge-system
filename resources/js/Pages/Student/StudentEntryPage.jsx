import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head, usePage } from "@inertiajs/react";
import StudentForm from "@/Components/Forms/StudentForm";
import { pre } from "motion/react-client";

export default function StudentEntryPage({ student = null, prefilledId = null, options }) {
    // 1. Logic Check: If 'student' prop exists, we are in Edit mode.
    const { auth } = usePage().props;
    const user = auth.user;
    const queryParams = new URLSearchParams(window.location.search);
    const isEdit = !!student;

    const mode = queryParams.get('mode') || 'masterlist';
    const enrollmentContext = {};
    if (mode === 'section') {
        enrollmentContext.academic_year = queryParams.get('academic_year');
        enrollmentContext.semester = queryParams.get('semester');
        enrollmentContext.college = queryParams.get('college');
        enrollmentContext.program = queryParams.get('program');
        enrollmentContext.year_level = queryParams.get('year_level');
        enrollmentContext.section = queryParams.get('section');
    } else if (mode === 'batch') {
        enrollmentContext.college_id = queryParams.get('college_id');
        enrollmentContext.program_id = queryParams.get('program_id');
        enrollmentContext.year = queryParams.get('year');
        enrollmentContext.batch_number = queryParams.get('batch_number');
    }

    // 2. Initialize the form
    // If editing, use student data. If adding, use empty strings (or prefilledId).
    const { data, setData, post, put, processing, errors } = useForm({
        student_number: isEdit ? student.student_number : (prefilledId || queryParams.get('prefilledId') || ""),
        last_name: isEdit ? student.last_name : "",
        first_name: isEdit ? student.first_name : "",
        middle_name: isEdit ? student.middle_name : "",
        suffix: isEdit ? student.suffix : "",
        college: isEdit ? student.college : (user.college_id || queryParams.get('college') || ""),
        program: isEdit ? student.program : (user.program_id || queryParams.get('program') || ""),
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

        academic_year: queryParams.get('academic_year') || "",
        semester: queryParams.get('semester') || "",
        year_level: queryParams.get('year_level') || "",
        section: queryParams.get('section') || "",
        // batch fields
        college_id: queryParams.get('college_id') || "",
        program_id: queryParams.get('program_id') || "",
        batch_year: queryParams.get('year') || "",
        batch_number: queryParams.get('batch_number') || "",
    });

    // 3. Handle Submit based on mode
    const handleSubmit = (e) => {
        if (e && typeof e.preventDefault === 'function') {
            e.preventDefault();
        }
        
        if (isEdit) {
            put(route("students.update", student.id));
        } else {
            post(route("students.store"));
        }
    };

    console.log(prefilledId);

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
                    mode={mode}
                    enrollmentContext={enrollmentContext}
                    user={user}
                />
            </div>
        </AuthenticatedLayout>
    );
}
