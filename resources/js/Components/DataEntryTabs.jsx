import React from "react";
import { Link, usePage } from "@inertiajs/react";

export default function DataEntryTabs({ userLevel }) {
    const { url } = usePage();

    // Helper to check if a tab is active
    const isActive = (path) => url.startsWith(path);

    const linkBaseClass =
        "relative px-5 py-3 text-[#5c297c] font-semibold transition-colors duration-300 hover:text-[#ffb736] flex items-center justify-center gap-2 group";
    const activeClass = "text-[#ffb736]";

    return (
        <nav className="flex justify-start md:justify-center gap-4 md:gap-8 p-4 border-b-2 border-purple-100 bg-gradient-to-br from-white to-slate-50 rounded-t-xl mb-6 overflow-x-auto">
            {/* 1. Student Information: Everyone sees this */}
            <Link
                href="/student-additional"
                className={`${linkBaseClass} ${isActive("/student-additional") ? activeClass : ""}`}
            >
                <span className="hidden md:inline">Student Information</span>
                <i className="bi bi-person inline md:hidden text-lg"></i>
                <span
                    className={`absolute bottom-[-2px] left-0 h-[3px] bg-[#ffb736] transition-all duration-300 ${isActive("/student-additional") ? "w-full" : "w-0 group-hover:w-full"}`}
                ></span>
            </Link>

            {/* 2. Academic Profile & Program Metrics: Super Admin (0), Dean (2), Program Head (3) */}
            {[0, 2, 3].includes(userLevel) && (
                <>
                    <Link
                        href="/academic-additional"
                        className={`${linkBaseClass} ${isActive("/academic-additional") ? activeClass : ""}`}
                    >
                        <span className="hidden md:inline">
                            Academic Profile
                        </span>
                        <i className="bi bi-journal-text inline md:hidden text-lg"></i>
                        <span
                            className={`absolute bottom-[-2px] left-0 h-[3px] bg-[#ffb736] transition-all duration-300 ${isActive("/academic-additional") ? "w-full" : "w-0 group-hover:w-full"}`}
                        ></span>
                    </Link>

                    <Link
                        href="/program-additional"
                        className={`${linkBaseClass} ${isActive("/program-additional") ? activeClass : ""}`}
                    >
                        <span className="hidden md:inline">
                            Program Metrics
                        </span>
                        <i className="bi bi-bar-chart inline md:hidden text-lg"></i>
                        <span
                            className={`absolute bottom-[-2px] left-0 h-[3px] bg-[#ffb736] transition-all duration-300 ${isActive("/program-additional") ? "w-full" : "w-0 group-hover:w-full"}`}
                        ></span>
                    </Link>
                </>
            )}
        </nav>
    );
}
