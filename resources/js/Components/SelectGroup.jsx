import { useState, useEffect, useRef } from "react";

export default function CustomSelectGroup({
    label,
    value,
    onChange,
    options = [],
    placeholder = "Select",
    disabled = false, // 1. Add disabled prop
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange({ target: { value: optionValue } });
        setIsOpen(false);
    };

    const selectedLabel =
        options.find((opt) => opt.value === value)?.label || placeholder;

    return (
        <div
            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4"
            ref={dropdownRef}
        >
            <label
                className={`w-full sm:w-[120px] font-bold text-sm shrink-0 ${disabled ? "text-gray-400" : "text-[#5c297c]"}`}
            >
                {label}
            </label>

            <div className="relative flex-1 w-full">
                <button
                    type="button"
                    // 2. Disable interaction
                    disabled={disabled}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    className={`
                        w-full px-3 py-2 text-left text-sm 
                        bg-white border rounded-[5px] 
                        flex items-center justify-between
                        transition-colors duration-300
                        ${/* 3. Style changes for disabled state */ ""}
                        ${
                            disabled
                                ? "bg-gray-100 border-gray-300 cursor-not-allowed text-gray-400"
                                : isOpen
                                  ? "border-[#ffb736] ring-1 ring-[#ffb736]"
                                  : "border-[#5c297c]"
                        }
                        ${!disabled && value ? "text-slate-700" : "text-gray-400"}
                    `}
                >
                    <span className="truncate">{selectedLabel}</span>
                    <svg
                        className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""} ${disabled ? "text-gray-300" : "text-[#5c297c]"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </button>

                {/* Dropdown list logic remains the same... */}
                <div
                    className={`absolute z-50 w-full mt-1 bg-white rounded-[5px] shadow-lg grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100 border border-[#5c297c]" : "grid-rows-[0fr] opacity-0 border-none pointer-events-none"}`}
                >
                    <div className="overflow-hidden min-h-0">
                        {/* Styles ... */}
                        <style jsx>{`
                            .custom-scrollbar::-webkit-scrollbar {
                                width: 8px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-track {
                                background: #f1f1f1;
                                border-radius: 4px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-thumb {
                                background: #5c297c;
                                border-radius: 4px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                                background: #4a2163;
                            }
                        `}</style>
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
                                    {option.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
