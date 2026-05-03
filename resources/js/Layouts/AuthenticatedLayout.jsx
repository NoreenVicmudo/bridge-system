import { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react"; // <-- Added usePage
import Sidebar from "@/Components/Sidebar";
import BackgroundLayout from "@/Components/BackgroundLayout";
import NProgress from "nprogress";
import { toast } from "react-toastify"; // <-- Added toastify

export default function AuthenticatedLayout({
    children,
    defaultCollapsed = false,
}) {
    // 1. Grab any flash messages sent from the Laravel backend
    const { flash } = usePage().props;

    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        if (defaultCollapsed) return false;
        if (typeof window !== "undefined") {
            return window.innerWidth > 768;
        }
        return false;
    });

    // 2. Global Toast Listener: Watches for backend messages and pops the toast!
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    useEffect(() => {
        const handleResize = () => {
            if (defaultCollapsed) return;
            if (window.innerWidth > 768) {
                setIsSidebarOpen(true);
            } else {
                setIsSidebarOpen(false);
            }
        };

        window.addEventListener("resize", handleResize);

        // NProgress Configuration
        NProgress.configure({ 
            showSpinner: false, 
            speed: 400, 
            minimum: 0.2,
            trickleSpeed: 200 
        });

        let finishTimeout;

        const start = router.on("start", (event) => {
            if (event.detail.visit.url.pathname === "/main") {
                return;
            }
            clearTimeout(finishTimeout);
            NProgress.start();
        });

        const finish = router.on("finish", () => {
            finishTimeout = setTimeout(() => {
                NProgress.done();
            }, 250);
        });

        return () => {
            window.removeEventListener("resize", handleResize);
            start();
            finish();
            clearTimeout(finishTimeout);
        };
    }, [defaultCollapsed]);

    return (
        <BackgroundLayout>
            <style>{`
                #nprogress .bar { background: #ffb736 !important; height: 4px !important; }
                #nprogress .peg { box-shadow: 0 0 10px #ffb736, 0 0 5px #ffb736 !important; }
            `}</style>

            <header className="fixed top-0 left-0 right-0 h-20 bg-[#5c297c] flex items-center px-6 shadow-md z-40 transition-all duration-300">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="text-white hover:text-[#ffb736] transition-colors p-2"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>
            </header>

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                alwaysOverlay={defaultCollapsed}
            />

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