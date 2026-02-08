export default function BackgroundLayout({ children }) {
    return (
        <div className="relative min-h-screen w-full bg-white text-slate-900 font-montserrat">
            {/* 1. The Dotted Pattern (Matches your CSS) */}
            <div className="absolute inset-0 h-full w-full bg-[radial-gradient(#ccc_1px,transparent_1px)] [background-size:20px_20px]"></div>

            {/* 2. The Fade Overlay (Matches your CSS)
                - 'to_top': Gradient moves upward.
                - 0% (Bottom): Transparent (Dots visible).
                - 50% (Middle): Solid White (Dots hidden).
            */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_top,rgba(255,255,255,0)_0%,rgba(255,255,255,1)_50%)]"></div>

            {/* 3. Page Content */}
            <div className="relative z-10">{children}</div>
        </div>
    );
}
