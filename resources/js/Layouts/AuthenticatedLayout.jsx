import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import Sidebar from "@/Components/Sidebar";
import LoadingScreen from "@/Components/LoadingScreen";
import BackgroundLayout from "@/Components/BackgroundLayout";

export default function AuthenticatedLayout({
    children,
    defaultCollapsed = false, // If TRUE, behaves like MAIN PAGE (Overlay). If FALSE, behaves like INFO PAGE (Push).
}) {
    // 1. STATE INITIALIZATION
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        // Main Page: Always Start Closed
        if (defaultCollapsed) return false;

        // Rest of Pages: Start Open on Desktop, Closed on Mobile
        if (typeof window !== "undefined") {
            return window.innerWidth > 768;
        }
        return false;
    });

    const [isLoading, setIsLoading] = useState(true);

    // 2. RESIZE HANDLER
    useEffect(() => {
        const handleResize = () => {
            if (defaultCollapsed) return; // Don't auto-open Main Page on resize

            if (window.innerWidth > 768) {
                setIsSidebarOpen(true);
            } else {
                setIsSidebarOpen(false);
            }
        };

        window.addEventListener("resize", handleResize);

        // Loading Logic
        const initialLoadTimer = setTimeout(() => setIsLoading(false), 800);
        const start = router.on("start", () => setIsLoading(true));
        const finish = router.on("finish", () =>
            setTimeout(() => setIsLoading(false), 500)
        );

        return () => {
            window.removeEventListener("resize", handleResize);
            clearTimeout(initialLoadTimer);
            start();
            finish();
        };
    }, [defaultCollapsed]);

    return (
        <BackgroundLayout>
            <LoadingScreen visible={isLoading} />

            <header className="fixed top-0 left-0 right-0 h-20 bg-[#5c297c] flex items-center px-6 shadow-md z-40 transition-all duration-300">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
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

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                // If defaultCollapsed is true (Main Page), force overlay behavior on all screens
                alwaysOverlay={defaultCollapsed}
            />

            {/* MAIN CONTENT */}
            {/* Logic: Only push content if the Sidebar is open AND we are NOT on the main page (Overlay mode) */}
            <main
                className={`
                    pt-20 
                    min-h-screen
                    transition-all duration-300 ease-in-out
                    ${!defaultCollapsed && isSidebarOpen ? "md:pl-[260px]" : ""}
                `}
            >
                {children}
            </main>
        </BackgroundLayout>
    );
}
