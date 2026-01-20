import { useRef, useLayoutEffect, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Link } from "@inertiajs/react";

export default function Main({ auth }) {
    return (
        <AuthenticatedLayout>
            {/* --- HERO SECTION (Unchanged) --- */}
            <section className="relative h-[80vh] w-full overflow-hidden">
                <div className="absolute inset-0 bg-[url('main.webp')] bg-cover bg-center bg-fixed">
                    <div className="absolute inset-0 bg-black/50"></div>
                </div>

                <div className="absolute bottom-12 right-6 md:bottom-20 md:right-16 z-10 flex flex-col items-end text-right text-white max-w-[95%]">
                    <span className="font-bold text-2xl md:text-4xl mb-2 text-white drop-shadow-[0_5px_10px_rgba(0,0,0,0.7)]">
                        Welcome to
                    </span>
                    <SameWidthHeader />
                </div>
            </section>

            {/* --- MODULES SECTION --- */}
            <section className="relative py-20 px-6 bg-white overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#ccc_1px,transparent_1px)] [background-size:20px_20px] opacity-70"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent pointer-events-none"></div>

                <div className="relative z-10 max-w-7xl mx-auto">
                    {/* CHANGED: Used Flexbox with justify-center to center the last row elements */}
                    <div className="flex flex-wrap justify-center gap-6">
                        {/* 1. Student Information */}
                        <ModuleCard
                            href="/student-info"
                            title="Student Information"
                            desc="Access comprehensive student data and records"
                        >
                            {/* Icon: User Graduate */}
                            <svg
                                className="w-8 h-8"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
                            </svg>
                        </ModuleCard>

                        {/* 2. Academic Profile */}
                        <ModuleCard
                            href="/academic-profile"
                            title="Academic Profile"
                            desc="Access student academic performance metrics"
                        >
                            {/* Icon: Book */}
                            <svg
                                className="w-8 h-8"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
                            </svg>
                        </ModuleCard>

                        {/* 3. Program Metrics */}
                        <ModuleCard
                            href="/program-metrics"
                            title="Program Metrics"
                            desc="Analyze student board preparations"
                        >
                            {/* Icon: Chart Line */}
                            <svg
                                className="w-8 h-8"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
                            </svg>
                        </ModuleCard>

                        {/* 4. Generate Reports */}
                        <ModuleCard
                            href="/reports"
                            title="Generate Reports"
                            desc="Create detailed reports and analytics"
                        >
                            {/* Icon: File Alt */}
                            <svg
                                className="w-8 h-8"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                            </svg>
                        </ModuleCard>

                        {/* 5. User Management */}
                        <ModuleCard
                            href="/users"
                            title="User Management"
                            desc="Manage user accounts and permissions"
                        >
                            {/* Icon: Tools */}
                            <svg
                                className="w-8 h-8"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
                            </svg>
                        </ModuleCard>

                        {/* 6. Additional Entry */}
                        <ModuleCard
                            href="/student-entry"
                            title="Additional Entry"
                            desc="Add new data and information"
                        >
                            {/* Icon: Plus */}
                            <svg
                                className="w-8 h-8"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                            </svg>
                        </ModuleCard>

                        {/* 7. Transaction Logs */}
                        <ModuleCard
                            href="/transaction-logs"
                            title="Transaction Logs"
                            desc="Track system activities and changes"
                        >
                            {/* Icon: Book Open */}
                            <svg
                                className="w-8 h-8"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
                            </svg>
                        </ModuleCard>
                    </div>
                </div>
            </section>
        </AuthenticatedLayout>
    );
}

// --- Header Component (Unchanged) ---
function SameWidthHeader() {
    const bridgeRef = useRef(null);
    const line1Ref = useRef(null);
    const line2Ref = useRef(null);

    const adjustWidths = () => {
        if (!bridgeRef.current || !line1Ref.current || !line2Ref.current)
            return;

        const targetWidth = bridgeRef.current.getBoundingClientRect().width;

        const scaleLine = (element) => {
            element.style.transform = "none";
            element.style.width = "max-content";
            const currentWidth = element.getBoundingClientRect().width;
            const scaleFactor = targetWidth / currentWidth;
            element.style.transformOrigin = "right center";
            element.style.transform = `scale(${scaleFactor})`;
        };

        scaleLine(line1Ref.current);
        scaleLine(line2Ref.current);
    };

    useLayoutEffect(() => {
        adjustWidths();
        window.addEventListener("resize", adjustWidths);
        const timeoutId = setTimeout(adjustWidths, 50);
        return () => {
            window.removeEventListener("resize", adjustWidths);
            clearTimeout(timeoutId);
        };
    }, []);

    return (
        <div className="flex flex-col items-end w-full max-w-full">
            <h1
                ref={bridgeRef}
                className="font-extrabold leading-[0.8] tracking-tight text-white text-[clamp(3rem,11vw,7.5rem)] w-fit origin-right whitespace-nowrap drop-shadow-[0_5px_10px_rgba(0,0,0,0.7)]"
            >
                BRIDGE
            </h1>
            <div className="mt-2 md:mt-3 lg:mt-5 w-max origin-right">
                <p
                    ref={line1Ref}
                    className="font-medium text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)] text-sm md:text-base lg:text-lg whitespace-nowrap origin-right block"
                >
                    Board Readiness Intelligence
                </p>
            </div>
            <div className="mt-1 md:mt-2 lg:mt-3 w-max origin-right">
                <p
                    ref={line2Ref}
                    className="font-medium text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)] text-sm md:text-base lg:text-lg whitespace-nowrap origin-right block"
                >
                    and Data Governance Engine
                </p>
            </div>
        </div>
    );
}

// --- Updated Module Card ---
// Now accepts 'children' for the SVG Icon and handles width for Flexbox centering
function ModuleCard({ href, children, title, desc }) {
    return (
        <Link
            href={href}
            // w-72 sets a fixed width so they look uniform in the centered flex layout
            // grow-0 ensures they don't stretch weirdly
            className="group relative bg-white border border-gray-100 rounded-2xl p-8 flex flex-col items-center text-center shadow-[0_4px_6px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_30px_rgba(92,41,124,0.15)] hover:-translate-y-2 transition-all duration-300 w-full sm:w-72 md:w-80"
        >
            <div className="w-20 h-20 rounded-full bg-[#5c297c] group-hover:bg-[#ffb736] group-hover:scale-110 flex items-center justify-center mb-6 transition-all duration-300 text-white">
                {children}
            </div>
            <h3 className="text-[#5c297c] text-xl font-bold mb-2 group-hover:text-[#5c297c]">
                {title}
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
        </Link>
    );
}
