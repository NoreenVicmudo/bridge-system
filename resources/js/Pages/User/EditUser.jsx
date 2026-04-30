import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head, Link } from "@inertiajs/react";
import UpdateUserForm from "@/Components/Forms/UpdateUserForm";

export default function EditUser({ user, colleges, programs }) {
    const { data, setData, put, processing, errors } = useForm({
        fname: user?.user_firstname || "",
        lname: user?.user_lastname || "",
        position: user?.user_position || "",
        college_id: user?.user_college ? String(user.user_college) : "",
        program_id: user?.user_program ? String(user.user_program) : "",
    });

    const handleSubmit = () => {
        if (user?.user_id) {
            put(route("users.update", user.user_id));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Update User - ${user?.user_username}`} />
            
            {/* 🧠 FIXED: Uses identical wrapper styling as CreateUser and StudentEntryPage */}
            <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
                
                {/* Unified Header */}
                <div className="flex items-center justify-between mb-6 bg-white p-5 rounded-[10px] shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-gray-100 font-montserrat">
                    <div>
                        <h2 className="text-2xl md:text-[26px] font-bold text-[#5c297c]">
                            Edit User Information
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Updating record for <span className="font-bold text-gray-800">{user?.user_username}</span>
                        </p>
                    </div>
                    <Link 
                        href={route('users.index')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-600 border border-gray-300 rounded-[6px] hover:bg-gray-50 hover:text-[#5c297c] hover:border-[#5c297c] transition-all duration-300 text-sm font-bold shadow-sm group inline-flex"
                    >
                        <i className="bi bi-arrow-left transition-transform group-hover:-translate-x-1"></i> 
                        Back
                    </Link>
                </div>

                {/* Form Wrapper */}
                <div className="bg-white rounded-[10px] shadow-[0_6px_25px_rgba(0,0,0,0.1)] p-6 md:p-8">
                    <UpdateUserForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        submit={handleSubmit}
                        user={user}
                        collegeOptions={colleges} 
                        programOptions={programs} 
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}