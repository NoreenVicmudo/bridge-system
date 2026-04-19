import React, { useEffect } from "react";
import BackgroundLayout from "@/Components/BackgroundLayout";
import { toast } from "react-toastify";
import { usePage } from "@inertiajs/react"; // Added to read backend messages

export default function LoginPage() {
    // Grab any errors or flash messages sent from the Laravel backend
    const { errors, flash } = usePage().props;

    // Listen for errors when the page loads (like returning from a failed Microsoft login)
    useEffect(() => {
        // If the backend specifically sends an error named 'microsoft' or 'email'
        if (errors?.microsoft) {
            toast.error(errors.microsoft);
        } else if (errors?.email) {
            toast.error(errors.email);
        } 
        // If the backend sends a global error flash message
        else if (flash?.error) {
            toast.error(flash.error);
        }
    }, [errors, flash]);

    return (
        <BackgroundLayout>
            {/* 1. Main Outer Container (Centering wrapper) */}
            <div className="flex items-center justify-center min-h-screen p-6">
                {/* 2. The Card */}
                <div className="flex flex-col md:flex-row bg-white rounded-lg shadow-[0_10px_40px_10px_rgba(0,0,0,0.1)] w-full max-w-[900px] min-h-[450px] overflow-hidden">
                    {/* 3. Left Column: Logo */}
                    <div className="w-full md:w-1/2 p-6 md:p-12 flex items-center justify-center">
                        <img
                            src="/purple_logo.webp"
                            alt="Bridge Logo"
                            className="w-full max-w-[320px] min-w-[120px] h-auto object-contain block"
                        />
                    </div>

                    {/* 4. Right Column: Actions */}
                    <div className="w-full md:w-1/2 flex-1 p-6 md:p-12 flex flex-col justify-center items-center bg-white">
                        {/* 5. Microsoft Teams Button */}
                        <a
                            href="/auth/microsoft"
                            className="group relative w-full max-w-[350px] flex items-center justify-center gap-3 bg-[#5c297c] hover:bg-[#ffb736] text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 shadow-md border border-transparent"
                        >
                            {/* Microsoft / Windows Icon */}
                            <svg
                                className="w-5 h-5 shrink-0"
                                viewBox="0 0 21 21"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                            </svg>

                            <span className="tracking-wide whitespace-nowrap text-sm md:text-base">
                                Sign in with Teams
                            </span>
                        </a>

                        <p className="mt-6 text-xs text-gray-400 font-medium uppercase tracking-wider">
                            MCU Account Required
                        </p>
                    </div>
                </div>
            </div>
        </BackgroundLayout>
    );
}