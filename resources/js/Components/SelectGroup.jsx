import { useState, useEffect, useRef } from "react";

export default function CustomSelectGroup({
    label,
    value,
    onChange,
    options = [],
    placeholder = "Select",
    disabled = false,
    vertical = false, // Controls if label is on top (true) or side (false)
    error = null,
    className = ""
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange({ target: { value: optionValue } });
        setIsOpen(false);
    };

    const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder;

    return (
        <div 
            // Layout: Vertical stacks label on top. Horizontal (default) puts them side-by-side.
            className={`flex ${vertical ? 'flex-col gap-1' : 'flex-col sm:flex-row sm:items-center gap-2 sm:gap-4'} mb-4 ${className}`} 
            ref={dropdownRef}
        >
            <label className={`${vertical ? 'w-full text-left' : 'w-full sm:w-[120px]'} font-bold text-sm shrink-0 text-[#5c297c]`}>
                {label}
            </label>

            <div className="relative flex-1 w-full">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    className={`
                        w-full px-3 py-2.5 text-left text-sm 
                        bg-white border rounded-[5px] 
                        flex items-center justify-between
                        transition-all duration-300
                        ${disabled 
                            ? "bg-gray-100 border-gray-300 cursor-not-allowed text-gray-400" 
                            : isOpen 
                                ? "border-[#ffb736] ring-1 ring-[#ffb736]" // Focus: Yellow
                                : "border-gray-300 hover:border-[#ffb736]" // Default Gray, Hover Yellow
                        }
                    `}
                >
                    <span className={`truncate ${!value ? 'text-gray-400' : 'text-gray-700'}`}>
                        {selectedLabel}
                    </span>
                    <svg
                        className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""} ${disabled ? "text-gray-300" : "text-[#5c297c]"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Dropdown Options */}
                <div className={`absolute z-50 w-full mt-1 bg-white rounded-[5px] shadow-lg grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100 border border-[#ffb736]" : "grid-rows-[0fr] opacity-0 border-none pointer-events-none"}`}>
                    <div className="overflow-hidden min-h-0">
                        <ul className="max-h-60 overflow-y-auto custom-scrollbar">
                            <li className="px-3 py-2 text-sm text-gray-400 cursor-default border-b border-gray-100">
                                {placeholder}
                            </li>
                            {options.map((option, index) => (
                                <li
                                    key={index}
                                    onClick={() => handleSelect(option.value)}
                                    className={`px-3 py-2 text-sm cursor-pointer transition-colors ${option.value === value ? "bg-[#5c297c] text-white" : "text-slate-700 hover:bg-[#ffb736]/20"}`}
                                >
                                    {option.label || option.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
        </div>
    );
}