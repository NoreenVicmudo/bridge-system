import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, Head } from "@inertiajs/react";
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
            <div className="w-full max-w-7xl mx-auto px-4 py-2">
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
        </AuthenticatedLayout>
    );
}