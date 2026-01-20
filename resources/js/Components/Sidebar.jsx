import { useState } from "react";
import { Link, usePage } from "@inertiajs/react";

export default function Sidebar({ isOpen, onClose }) {
    const { auth } = usePage().props;
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Helper to close profile when clicking the overlay
    const closeProfile = () => setIsProfileOpen(false);

    return (
        <>
            {/* 1. Mobile Sidebar Overlay (Closes Sidebar) */}
            <div
                className={`fixed inset-0 bg-black/50 z-[1001] transition-opacity duration-300 ${
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                onClick={onClose}
            />

            {/* 2. Global Veil (Covers the REST OF THE SCREEN when profile is open) */}
            <div
                className={`fixed inset-0 bg-black/50 z-[1003] transition-opacity duration-300 ${
                    isProfileOpen
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none"
                }`}
                onClick={closeProfile}
            />

            {/* Sidebar Container */}
            <aside
                className={`fixed top-0 left-0 h-full w-[260px] bg-[#5c297c] text-white shadow-2xl flex flex-col transform transition-all duration-300 ease-in-out ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                } ${isProfileOpen ? "z-[1005]" : "z-[1002]"}`}
            >
                {/* 3. Internal Veil (Covers SIDEBAR LINKS when profile is open) */}
                <div
                    className={`absolute inset-0 bg-black/50 z-20 transition-opacity duration-300 ${
                        isProfileOpen
                            ? "opacity-100"
                            : "opacity-0 pointer-events-none"
                    }`}
                    onClick={closeProfile}
                ></div>

                {/* LOGO AREA */}
                <div className="relative z-10 p-6 flex items-center justify-between border-b border-white/10">
                    <img
                        src="/white_logo.webp"
                        alt="Logo"
                        className="h-10 w-auto"
                    />

                    {/* Double Chevron Toggle Arrow */}
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-[#ffb736] transition-colors p-1 rounded focus:outline-none"
                        title="Collapse Menu"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                        >
                            <path
                                fillRule="evenodd"
                                d="M8.354 1.646a.5.5 0 0 1 0 .708L2.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
                            />
                            <path
                                fillRule="evenodd"
                                d="M12.354 1.646a.5.5 0 0 1 0 .708L6.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
                            />
                        </svg>
                    </button>
                </div>

                {/* MENU ITEMS */}
                <nav className="relative z-10 flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    <SidebarLink href="/" active={route().current("main")}>
                        <i className="bi bi-house-door text-lg"></i>
                        <span>Home</span>
                    </SidebarLink>

                    <SidebarLink
                        href="/student-info"
                        active={route().current("student.*")}
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            ></path>
                        </svg>
                        <span>Student Info</span>
                    </SidebarLink>

                    <SidebarLink href="/academic-profile">
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            ></path>
                        </svg>
                        <span>Academic Profile</span>
                    </SidebarLink>

                    <SidebarLink href="/program-metrics">
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"
                            ></path>
                        </svg>
                        <span>Program Metrics</span>
                    </SidebarLink>

                    <SidebarLink href="/generate-report">
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            ></path>
                        </svg>
                        <span>Generate Report</span>
                    </SidebarLink>

                    <SidebarLink href="/student-information-entry">
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                            ></path>
                        </svg>
                        <span>Additional Entry</span>
                    </SidebarLink>

                    {/* Management Section (Unconditionally Visible) */}
                    <div className="pt-4 pb-2 px-3 text-xs font-bold text-[#ffb736] uppercase tracking-wider">
                        Management
                    </div>

                    <SidebarLink href="/transaction-logs">
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            ></path>
                        </svg>
                        <span>Transaction Logs</span>
                    </SidebarLink>

                    <SidebarLink href="/users">
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            ></path>
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            ></path>
                        </svg>
                        <span>Manage Users</span>
                    </SidebarLink>
                </nav>

                {/* 4. PROFILE SECTION (Z-30 to sit above Internal Veil) */}
                <div className="relative z-30 border-t border-white/10 p-4 bg-[#5c297c]">
                    {/* Drop-up Menu */}
                    <div
                        className={`
                        absolute bottom-full left-4 right-4 mb-2 
                        bg-[#6b358e] rounded-lg shadow-xl overflow-hidden border border-white/10
                        transform transition-all duration-300 ease-out origin-bottom
                        ${
                            isProfileOpen
                                ? "translate-y-0 opacity-100 scale-100 delay-75"
                                : "translate-y-4 opacity-0 scale-95 pointer-events-none"
                        }
                    `}
                    >
                        <Link
                            href={route("logout")}
                            method="post"
                            as="button"
                            className="w-full text-left px-4 py-3 text-sm text-white hover:bg-[#ffb736] hover:text-[#5c297c] transition-colors flex items-center gap-2"
                        >
                            <i className="bi bi-box-arrow-right"></i> Logout
                        </Link>
                    </div>

                    {/* Profile Trigger Button */}
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none relative"
                    >
                        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold shrink-0 border border-white/30">
                            {auth.user?.name.charAt(0)}
                        </div>

                        <div className="text-left flex-1 min-w-0">
                            <div className="text-sm font-bold truncate">
                                {auth.user?.name}
                            </div>
                            <div className="text-xs text-white/60 truncate">
                                {auth.user?.level === 0 ? "Admin" : "User"}
                            </div>
                        </div>

                        <svg
                            className={`w-4 h-4 text-white/50 transition-transform duration-300 ${
                                isProfileOpen ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 15l7-7 7 7"
                            ></path>
                        </svg>
                    </button>
                </div>
            </aside>
        </>
    );
}

function SidebarLink({ href, active, children }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                active
                    ? "bg-[#ffb736] text-[#5c297c] shadow-md"
                    : "hover:bg-white/10 text-white/90"
            }`}
        >
            {children}
        </Link>
    );
}
