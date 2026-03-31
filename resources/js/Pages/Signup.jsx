import React, { useEffect } from "react";
import { Head, Link, useForm, router } from "@inertiajs/react";
import BackgroundLayout from "@/Components/BackgroundLayout";
import CustomSelectGroup from "@/Components/SelectGroup";
import NProgress from "nprogress";

export default function SignUp({ colleges, positions }) {
    const { data, setData, post, processing, errors } = useForm({
        college: "",
        position: "",
    });

    useEffect(() => {
        // Snappier Configuration
        NProgress.configure({ 
            showSpinner: false, 
            speed: 300, 
            trickleSpeed: 100, // Makes it move faster
            minimum: 0.3 
        });

        let finishTimeout;

        const handleStart = () => {
            clearTimeout(finishTimeout);
            NProgress.start();
        };

        const handleFinish = () => {
            // Short debounce to ensure redirects don't "double-jump"
            finishTimeout = setTimeout(() => {
                NProgress.done();
            }, 100); 
        };

        const handleBrowserNav = () => {
            NProgress.done();
            NProgress.remove();
        };

        const removeStart = router.on("start", handleStart);
        const removeFinish = router.on("finish", handleFinish);
        window.addEventListener("popstate", handleBrowserNav);

        return () => {
            removeStart();
            removeFinish();
            window.removeEventListener("popstate", handleBrowserNav);
            clearTimeout(finishTimeout);
            NProgress.done();
        };
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("signup.store"));
    };

    return (
        <BackgroundLayout>
            <Head title="BRIDGE - Sign Up" />

            <Link
                href={route("login")}
                className="fixed top-5 left-5 flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-md text-slate-600 bg-white hover:bg-[#ffb736] hover:text-white hover:border-[#ffb736] transition-all z-10 font-medium shadow-sm"
            >
                <i className="bi bi-arrow-left"></i> Back
            </Link>

            <div className="flex items-center justify-center min-h-screen p-4 font-montserrat">
                <div className="w-full max-w-[500px] bg-white p-8 rounded-xl shadow-2xl animate-fade-in overflow-visible">
                    <h2 className="text-2xl font-bold text-[#5c297c] mb-8 text-left border-b pb-2">
                        Select Affiliation
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-2 text-left overflow-visible">
                        <CustomSelectGroup
                            label="Select College"
                            value={data.college}
                            onChange={(e) => setData("college", e.target.value)}
                            options={colleges}
                            placeholder="Choose your college"
                            vertical={true}
                            error={errors.college}
                            className="signup-purple-scroll"
                        />

                        <CustomSelectGroup
                            label="Select Position"
                            value={data.position}
                            onChange={(e) => setData("position", e.target.value)}
                            options={positions}
                            placeholder="Choose your position"
                            vertical={true}
                            error={errors.position}
                            className="signup-purple-scroll"
                        />

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={processing || !data.college || !data.position}
                                className={`w-full max-w-[260px] mx-auto block font-bold py-3 rounded-lg transition-all shadow-md active:translate-y-1 flex justify-center items-center gap-3
                                    ${!data.college || !data.position
                                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                            : "bg-[#5c297c] hover:bg-[#ffb736] text-white cursor-pointer"
                                    }`}
                            >
                                {processing ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <span className="tracking-wide uppercase text-sm">Continue</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </BackgroundLayout>
    );
}