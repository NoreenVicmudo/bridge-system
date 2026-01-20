import { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
import Sidebar from "@/Components/Sidebar";
import LoadingScreen from "@/Components/LoadingScreen";

export default function AuthenticatedLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // 1. CHANGE: Start with 'true' so it shows on reload
    const [isLoading, setIsLoading] = useState(true);

    // 2. Loading Logic
    useEffect(() => {
        // Handle the initial page load (turn off loader after mount)
        const initialLoadTimer = setTimeout(() => setIsLoading(false), 800); // 0.8s delay for smoothness

        // Inertia Event Listeners (for Sidebar navigation)
        const start = router.on("start", () => setIsLoading(true));
        const finish = router.on("finish", () =>
            setTimeout(() => setIsLoading(false), 500)
        );

        return () => {
            clearTimeout(initialLoadTimer);
            start();
            finish();
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#f9f9f9] font-montserrat text-slate-800">
            {/* GLOBAL LOADER */}
            <LoadingScreen visible={isLoading} />

            {/* HEADER */}
            <header className="fixed top-0 left-0 right-0 h-20 bg-[#5c297c] flex items-center px-6 shadow-md z-40">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="text-white hover:text-[#ffb736] transition-colors p-2"
                >
                    <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 6h16M4 12h16M4 18h16"
                        ></path>
                    </svg>
                </button>
            </header>

            {/* SIDEBAR */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* MAIN CONTENT */}
            <main className="pt-20">{children}</main>
        </div>
    );
}
