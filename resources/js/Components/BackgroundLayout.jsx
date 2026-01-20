export default function BackgroundLayout({ children }) {
    return (
        // 1. Main Container (acts like 'body' with bg-white)
        <div className="relative min-h-screen w-full bg-white text-slate-900 font-montserrat">
            {/* 2. The Dotted Pattern */}
            <div className="absolute inset-0 h-full w-full bg-[radial-gradient(#ccc_1px,transparent_1px)] [background-size:20px_20px]"></div>

            {/* 3. The White Fade Overlay (matches your body::after) */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_top,rgba(255,255,255,0)_0%,rgba(255,255,255,1)_50%)]"></div>

            {/* 4. Your Page Content */}
            <div className="relative z-10">{children}</div>
        </div>
    );
}
