import React, { useState, useEffect } from "react";

export default function TermsOfServiceModal({ isOpen, onAccept }) {
    const [isChecked, setIsChecked] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [animate, setAnimate] = useState(false);

    // Handle entrance animation
    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
            setIsChecked(false);
            setIsProcessing(false);
        } else {
            setAnimate(false);
        }
    }, [isOpen]);

    const handleAccept = () => {
        setIsProcessing(true);
        // Add a slight delay for better UX before calling the parent function
        setTimeout(() => {
            if (onAccept) onAccept();
        }, 500);
    };

    if (!isOpen && !animate) return null;

    return (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 font-montserrat transition-all duration-300 ${animate ? "bg-gray-900/60 backdrop-blur-sm opacity-100" : "bg-transparent opacity-0 pointer-events-none"}`}>
            
            {/* Custom Scrollbar for this modal */}
            <style>{`
                .tos-scrollbar::-webkit-scrollbar { width: 6px; }
                .tos-scrollbar::-webkit-scrollbar-thumb { background-color: #5c297c; border-radius: 6px; }
                .tos-scrollbar::-webkit-scrollbar-track { background: transparent; }
            `}</style>

            <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden transition-all duration-300 transform ${animate ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}`}>
                
                {/* Header */}
                <div className="pt-8 pb-4 px-6 text-center border-b border-gray-100 flex-shrink-0">
                    <h2 className="text-3xl font-bold text-[#5c297c] tracking-tight">
                        Terms of Service
                    </h2>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto tos-scrollbar p-6 md:p-8 text-gray-700 space-y-6">
                    <div className="text-center text-gray-500 mb-6">
                        <p className="mb-1">By using this service, you agree to our Terms of Service and Privacy Policy.</p>
                        <p>Please read them carefully before proceeding.</p>
                    </div>

                    <div className="space-y-6 max-w-3xl mx-auto text-sm md:text-base leading-relaxed">
                        <div>
                            <h4 className="font-bold text-gray-900 text-base mb-1">User Responsibility</h4>
                            <p>Users must provide accurate and truthful information during registration and while using the system.</p>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-gray-900 text-base mb-1">Account Security</h4>
                            <p>Users are responsible for keeping their login credentials secure. Report unauthorized access immediately.</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 text-base mb-1">Data Usage</h4>
                            <p>Your data will only be used for academic support, tracking, and internal analytics. It won't be shared publicly.</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 text-base mb-1">Acceptable Use</h4>
                            <p>No spamming, hacking, or misuse of system features. Violations may lead to suspension or banning.</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 text-base mb-1">System Availability</h4>
                            <p>We aim for 24/7 access but can't guarantee uninterrupted service. Scheduled maintenance will be announced.</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 text-base mb-1">Privacy</h4>
                            <p>Your data is protected under our privacy policy. Only authorized personnel (admins, deans, IT) can access it.</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 text-base mb-1">Modifications</h4>
                            <p>We may update features or policies. Continued use means you accept those changes.</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 text-base mb-1">Consent</h4>
                            <p>By signing up, you agree to the collection and use of your data as described.</p>
                        </div>
                    </div>

                    {/* Agreement Checkbox */}
                    <div className="mt-8 p-4 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-center">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input 
                                    type="checkbox" 
                                    className="peer appearance-none w-6 h-6 border-2 border-[#5c297c] rounded bg-white checked:bg-[#5c297c] checked:border-[#5c297c] transition-all cursor-pointer shadow-sm"
                                    checked={isChecked}
                                    onChange={(e) => setIsChecked(e.target.checked)}
                                />
                                <svg className="absolute w-4 h-4 text-white left-1 top-1 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="font-semibold text-[#5c297c] select-none group-hover:text-gray-900 transition-colors">
                                I agree to the Terms of Service and Privacy Policy
                            </span>
                        </label>
                    </div>
                </div>

                {/* Footer Actions (Centered Single Button) */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-center items-center flex-shrink-0 rounded-b-2xl">
                    <button 
                        onClick={handleAccept}
                        disabled={!isChecked || isProcessing}
                        className={`w-full sm:w-[250px] px-8 py-3 rounded-lg font-bold text-white shadow-md transition-all flex items-center justify-center gap-2
                            ${isChecked && !isProcessing 
                                ? "bg-[#5c297c] hover:bg-[#ffb736] hover:-translate-y-0.5" 
                                : "bg-gray-300 cursor-not-allowed opacity-70"
                            }`}
                    >
                        {isProcessing ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            "Accept"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}