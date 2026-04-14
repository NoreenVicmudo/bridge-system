import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
// You will need to build this component similarly to your UpdateUserForm
import CreateUserForm from "@/Components/Forms/CreateUserForm"; 

export default function CreateUser({ colleges, programs }) {
    const { data, setData, post, processing, errors } = useForm({
        fname: "",
        lname: "",
        username: "",
        email: "",
        password: "",
        college_id: "",
        program_id: "",
        level: "",
    });

    const handleSubmit = () => {
        post(route("users.store"));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Create New User" />
            <div className="w-full max-w-7xl mx-auto px-4 py-2">
                <CreateUserForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    submit={handleSubmit}
                    collegeOptions={colleges}
                    programOptions={programs}
                />
            </div>
        </AuthenticatedLayout>
    );
}