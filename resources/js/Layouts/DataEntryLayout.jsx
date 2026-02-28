import React from 'react';
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataEntryTabs from "@/Components/DataEntryTabs";
import { Head, usePage } from '@inertiajs/react';

export default function DataEntryLayout({ children, title }) {
    // Safe fallback for user level
    const { auth = {} } = usePage().props;
    const userLevel = auth?.user?.level ?? 0; 

    return (
        <AuthenticatedLayout>
            <Head title={`BRIDGE - ${title}`} />
            
            {/* 1. Global Scrollbar Style embedded to ensure consistency across all child pages */}
            <style>{`
                .custom-form-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-form-scrollbar::-webkit-scrollbar-thumb { background-color: #5c297c; border-radius: 6px; }
                .custom-form-scrollbar::-webkit-scrollbar-track { background: rgba(92, 41, 124, 0.05); border-radius: 6px;}
            `}</style>

            {/* 2. STRICT HEIGHT: h-[calc(100vh-80px)] prevents the browser window from scrolling */}
            <div className="flex justify-center w-full px-4 py-4 h-[calc(100vh-80px)] items-start overflow-hidden font-montserrat">
                
                {/* 3. CARD CONTAINER: h-full ensures the white card strictly fits the screen */}
                <div className="w-full max-w-4xl bg-white rounded-[10px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-purple-50 flex flex-col h-full max-h-full">
                    
                    {/* Header/Tabs section: flex-shrink-0 prevents it from being squished */}
                    <div className="p-6 pb-0 flex-shrink-0 z-10 bg-white rounded-t-[10px]">
                        <h2 className="text-center text-2xl md:text-3xl font-bold text-[#5c297c] mb-6">
                            Additional Entry
                        </h2>
                        <DataEntryTabs userLevel={userLevel} />
                    </div>

                    {/* 4. SCROLLABLE CONTENT: flex-1 takes up the exact remaining height inside the card */}
                    <div className="p-6 overflow-y-auto overflow-x-hidden flex-1 custom-form-scrollbar bg-slate-50/50 rounded-b-[10px]">
                        {children}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}