export default function LoadingScreen({ visible }) {
    // NOTE: We removed the "if (!visible) return null;" check so the element
    // stays in the DOM long enough for the CSS transition to finish.

    return (
        <div
            // Use template literals to toggle opacity classes based on 'visible' state
            className={`fixed inset-0 z-[9999] bg-[#5c297c] flex flex-col items-center justify-center transition-opacity duration-300 ease-in-out ${
                visible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
        >
            {/* Logo */}
            <img
                src="/white_logo.webp" // Ensure this path is correct for your setup
                alt="MCU Logo"
                // CHANGED: Increased size (w-40) and changed animation (animate-bounce)
                className="w-40 h-auto mb-8 animate-bounce"
            />

            {/* Loading Dots */}
            <div className="flex space-x-2">
                <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.5s]"></div>
                <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
            </div>
        </div>
    );
}
