import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head, usePage, router } from "@inertiajs/react";
import StudentForm from "@/Components/Forms/StudentForm";

export default function StudentEntryPage({ student = null, prefilledId = null, options }) {
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

    const { data, setData, post, put, processing, errors } = useForm({
        student_number: isEdit ? student.student_number : (prefilledId || queryParams.get('prefilledId') || ""),
        last_name: isEdit ? student.last_name : "",
        first_name: isEdit ? student.first_name : "",
        middle_name: isEdit ? student.middle_name : "",
        suffix: isEdit ? student.suffix : "",
        college: isEdit ? student.college : (user.college_id || (queryParams.get('college') ? parseInt(queryParams.get('college')) : "")),
        program: isEdit ? student.program : (user.program_id || (queryParams.get('program') ? parseInt(queryParams.get('program')) : "")),
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
        
        college_id: queryParams.get('college_id') ? parseInt(queryParams.get('college_id')) : "",
        program_id: queryParams.get('program_id') ? parseInt(queryParams.get('program_id')) : "",
        batch_year: queryParams.get('year') || "",
        batch_number: queryParams.get('batch_number') || "",

        mode: mode,
    });

    const handleBack = (e) => {
        if (e) e.preventDefault();
        if (mode === 'section' && enrollmentContext.academic_year) {
            router.get(route('student.info'), {
                mode: 'section',
                academic_year: enrollmentContext.academic_year,
                semester: enrollmentContext.semester,
                college: enrollmentContext.college,
                program: enrollmentContext.program,
                year_level: enrollmentContext.year_level,
                section: enrollmentContext.section,
            });
        } else if (mode === 'batch' && enrollmentContext.college_id) {
            router.get(route('student.info'), {
                mode: 'batch',
                batch_college: enrollmentContext.college_id, 
                batch_program: enrollmentContext.program_id,
                batch_year: enrollmentContext.year,
                board_batch: enrollmentContext.batch_number,
            });
        } else {
            router.get(route('student.masterlist'));
        }
    };

    const handleSubmit = (e) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        
        if (isEdit) {
            put(route("students.update", student.id));
        } else {
            if (mode === 'masterlist') {
                post(route("students.masterlist.store"));
            } else {
                post(route("students.store"));
            }
        }
    };

    const displayId = data.student_number || "New Student";

    return (
        <AuthenticatedLayout>
            <Head title={isEdit ? "Edit Student" : "Add Student"} />
            
            {/* 🧠 FIXED: Uses identical wrapper styling as AttendanceEntry.jsx */}
            <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
                
                {/* Unified Header */}
                <div className="flex items-center justify-between mb-6 bg-white p-5 rounded-[10px] shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-gray-100 font-montserrat">
                    <div>
                        <h2 className="text-2xl md:text-[26px] font-bold text-[#5c297c]">
                            {isEdit ? "Edit Student Information" : "Add Student Information"}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {isEdit ? "Updating record for " : "Creating record for "}
                            <span className="font-bold text-gray-800">{displayId}</span>
                        </p>
                    </div>
                    <button 
                        onClick={handleBack}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-600 border border-gray-300 rounded-[6px] hover:bg-gray-50 hover:text-[#5c297c] hover:border-[#5c297c] transition-all duration-300 text-sm font-bold shadow-sm group"
                    >
                        <i className="bi bi-arrow-left transition-transform group-hover:-translate-x-1"></i> 
                        Back
                    </button>
                </div>

                {/* Form Wrapper */}
                <div className="bg-white rounded-[10px] shadow-[0_6px_25px_rgba(0,0,0,0.1)] p-6 md:p-8">
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
            </div>
        </AuthenticatedLayout>
    );
}