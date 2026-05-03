import React, { useEffect, useState } from "react";
import BackgroundLayout from "@/Components/BackgroundLayout";
import { toast } from "react-toastify";
import { usePage, useForm, Link } from "@inertiajs/react"; // 🧠 ALREADY HAS: Link

export default function LoginPage() {
    const { errors, flash } = usePage().props;
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors: formErrors } = useForm({
        username: '',
        password: '',
    });

    useEffect(() => {
        if (errors?.microsoft) toast.error(errors.microsoft);
        else if (errors?.email) toast.error(errors.email);
        else if (flash?.error) toast.error(flash.error);
    }, [errors, flash]);

    const submit = (e) => {
        e.preventDefault();
        post('/login'); 
    };

    return (
        <BackgroundLayout>
            <div className="flex items-center justify-center min-h-screen p-6">
                <div className="flex flex-col md:flex-row bg-white rounded-lg shadow-[0_10px_40px_10px_rgba(0,0,0,0.1)] w-full max-w-[900px] min-h-[450px] overflow-hidden">
                    
                    {/* Left Column: Logo */}
                    <div className="w-full md:w-1/2 p-6 md:p-12 flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-100">
                        <img src="/purple_logo.webp" alt="Bridge Logo" className="w-full max-w-[320px] min-w-[120px] h-auto object-contain block" />
                    </div>

                    {/* Right Column: Form */}
                    <div className="w-full md:w-1/2 flex-1 p-8 md:p-12 flex flex-col justify-center items-center bg-white relative">
                        <form onSubmit={submit} className="w-full max-w-[350px] flex flex-col">                        

                            <div className="relative mb-6">
                                <input id="username" type="text" name="username" className="peer w-full p-3 border-2 border-[#5c297c] rounded-lg text-gray-800 outline-none focus:border-[#ffb736] focus:shadow-[0_4px_10px_rgba(255,183,54,0.2)] transition-all bg-transparent placeholder-transparent" placeholder=" " value={data.username} onChange={(e) => setData('username', e.target.value)} required />
                                <label htmlFor="username" className="absolute left-3 -translate-y-1/2 bg-white px-1 pointer-events-none transition-all duration-300 top-0 text-sm text-[#ffb736] peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-[#5c297c] peer-focus:top-0 peer-focus:text-sm peer-focus:text-[#ffb736]">Username</label>
                                {formErrors.username && <span className="text-[#ed1c24] text-xs font-bold mt-1 block">{formErrors.username}</span>}
                            </div>

                            <div className="relative mb-2">
                                <input id="password" type={showPassword ? "text" : "password"} name="password" className="peer w-full p-3 pr-10 border-2 border-[#5c297c] rounded-lg text-gray-800 outline-none focus:border-[#ffb736] focus:shadow-[0_4px_10px_rgba(255,183,54,0.2)] transition-all bg-transparent placeholder-transparent" placeholder=" " value={data.password} onChange={(e) => setData('password', e.target.value)} required />
                                <label htmlFor="password" className="absolute left-3 -translate-y-1/2 bg-white px-1 pointer-events-none transition-all duration-300 top-0 text-sm text-[#ffb736] peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-[#5c297c] peer-focus:top-0 peer-focus:text-sm peer-focus:text-[#ffb736]">Password</label>
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5c297c] hover:text-[#ffb736] transition-colors focus:outline-none"><i className={`bi ${showPassword ? "bi-eye" : "bi-eye-slash"} text-lg`}></i></button>
                            </div>
                            {formErrors.password && <span className="text-[#ed1c24] text-xs font-bold mt-1 mb-2 block">{formErrors.password}</span>}

                            <button type="submit" disabled={processing} className="w-full mt-6 bg-[#5c297c] hover:bg-[#ffb736] text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 shadow-md flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed">
                                {processing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Log In"}
                            </button>

                            {/* 🧠 ADDED: Back to SSO Link */}
                            <div className="text-center mt-6">
                                <Link href="/login" className="text-sm text-gray-400 hover:text-[#5c297c] font-medium transition-colors flex items-center justify-center gap-2">
                                    <i className="bi bi-arrow-left"></i> Back to Teams Login
                                </Link>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </BackgroundLayout>
    );
}