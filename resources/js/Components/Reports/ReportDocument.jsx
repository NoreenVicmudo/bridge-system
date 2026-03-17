import React, { useEffect, useRef, forwardRef } from "react";
import Chart from "chart.js/auto";

const ReportDocument = forwardRef(
    (
        {
            reportData,
            auth,
            collegeName,
            collegeLogo,
            collegeColor,
            collegeEmail,
        },
        ref,
    ) => {
        const chartCanvasRef = useRef(null);
        const chartInstanceRef = useRef(null);

        useEffect(() => {
            if (reportData && chartCanvasRef.current) {
                if (chartInstanceRef.current) {
                    chartInstanceRef.current.destroy();
                }

                const ctx = chartCanvasRef.current.getContext("2d");

                chartInstanceRef.current = new Chart(ctx, {
                    type: reportData.chartType,
                    data: reportData.chartData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false, // Critical for instant PDF snapshots
                        plugins: {
                            legend: { display: false },
                        },
                        scales: {
                            y: { beginAtZero: true, max: 1.0 },
                        },
                    },
                });
            }

            return () => {
                if (chartInstanceRef.current)
                    chartInstanceRef.current.destroy();
            };
        }, [reportData]);

        // Reusable Page Component with Header and Footer locked to top/bottom
        const PageTemplate = ({ children }) => (
            <div className="report-page w-[816px] h-[1056px] bg-white shadow-lg flex flex-col box-border mb-8 print:mb-0 print:shadow-none break-after-page shrink-0 mx-auto relative overflow-hidden">
                {/* HEADER - Sticks to top */}
                <header className="pt-10 px-12 pb-4 flex justify-between items-start">
                    <img
                        src="/formal.webp"
                        alt="Formal Logo"
                        className="h-[75px] w-auto object-contain"
                    />
                    {collegeLogo && (
                        <img
                            src={collegeLogo}
                            alt="College Logo"
                            className="h-[75px] w-auto object-contain"
                        />
                    )}
                </header>

                {/* CONTENT */}
                <section className="flex-1 px-12 py-2 flex flex-col">
                    {children}
                </section>

                {/* FOOTER */}
                <footer className="w-full flex mt-auto border-t-[4px] border-[#ffb736]">
                    {collegeName && (
                        <div
                            className="text-white w-[40%] px-8 py-5 flex flex-col justify-center"
                            style={{
                                backgroundColor: collegeColor || "#930147",
                            }}
                        >
                            <div className="font-serif text-[15px] font-bold tracking-wide mb-1">
                                Manila Central University
                            </div>
                            <div className="font-serif text-[13px] opacity-90 mb-1">
                                {collegeName}
                            </div>
                            <div className="font-serif text-[12px] opacity-80">
                                {collegeEmail}
                            </div>
                        </div>
                    )}

                    <div
                        className={`bg-[#5c297c] text-white px-10 py-5 flex justify-between items-center ${collegeName ? "w-[60%]" : "w-full"}`}
                    >
                        <div className="flex flex-col justify-center space-y-1">
                            <div className="font-serif text-[13px] opacity-90">
                                EDSA, Caloocan City 1400
                            </div>
                            <div className="font-serif text-[13px] opacity-90">
                                +63 2 8364-10-71 to 78
                            </div>
                            <div className="font-serif text-[13px] opacity-90">
                                hello@mcu.edu.ph
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="font-montserrat font-bold text-[12px] tracking-widest mt-auto">
                                www.mcu.edu.ph
                            </div>
                            <img
                                src="/qr.webp"
                                alt="QR Code"
                                className="w-[45px] h-[45px] object-contain bg-white p-1 rounded"
                            />
                        </div>
                    </div>
                </footer>
            </div>
        );

        return (
            <div id="report" ref={ref} className="flex flex-col w-[816px] bg-transparent">
                
                {/* ================= PAGE 1 ================= */}
                <PageTemplate>
                    <h1 className="font-serif text-2xl font-bold text-gray-900 mb-6">
                        {reportData.title}
                    </h1>

                    <div className="font-serif text-[15px] text-gray-600 mb-6 leading-relaxed">
                        <p>Time Created: {reportData.timestamp}</p>
                        <p>Generated by: {auth?.user?.name || "System Administrator"}</p>
                    </div>

                    <div className="font-serif text-[15px] text-gray-800 mb-6 leading-relaxed">
                        <p>Statistical Tool: {reportData.tool}</p>
                        <p className="whitespace-pre-line">{reportData.fields}</p>
                    </div>

                    <h2 className="font-serif font-bold text-xl mb-4 mt-4">
                        Generated Report:
                    </h2>

                    {/* TABLES ROW */}
                    <div className="flex gap-10 mt-2">
                        <div className="flex-1">
                            <h3 className="font-serif font-bold text-[15px] mb-2">Data Set</h3>
                            <table className="w-full border-collapse border border-gray-300 font-serif text-[13px] text-center">
                                <thead>
                                    <tr className="bg-[#5c297c] text-white">
                                        <th className="border border-gray-300 p-2 font-medium">Label</th>
                                        <th className="border border-gray-300 p-2 font-medium uppercase">{reportData.metricName || "Diagnostic Examinations"}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.tableData?.dataset.map((row, i) => (
                                        <tr key={i}>
                                            <td className="border border-gray-300 p-2 text-gray-700">{row.label}</td>
                                            <td className="border border-gray-300 p-2 text-gray-700">{row.val}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex-1">
                            <h3 className="font-serif font-bold text-[15px] mb-2">Descriptive Statistics</h3>
                            <table className="w-full border-collapse border border-gray-300 font-serif text-[13px] text-center">
                                <thead>
                                    <tr className="bg-[#5c297c] text-white">
                                        <th className="border border-gray-300 p-2 font-medium">Metric</th>
                                        <th className="border border-gray-300 p-2 font-medium">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.tableData?.stats.map((row, i) => (
                                        <tr key={i}>
                                            <td className="border border-gray-300 p-2 text-gray-700">{row.metric}</td>
                                            <td className="border border-gray-300 p-2 text-gray-700">{row.val}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </PageTemplate>

                {/* ================= PAGE 2 ================= */}
                <PageTemplate>
                    <div className="flex-1 flex flex-col mt-4">
                        <h2 className="font-serif font-bold text-xl mb-6">
                            Data Visualization:
                        </h2>
                        <div className="w-full flex-1 relative min-h-[400px]">
                            <canvas id="chartCanvas" ref={chartCanvasRef}></canvas>
                        </div>
                    </div>
                </PageTemplate>

            </div>
        );
    },
);

export default ReportDocument;