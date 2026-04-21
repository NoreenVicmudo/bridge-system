import React, { useEffect, useRef, forwardRef } from "react";
import Chart from "chart.js/auto";
import { 
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, BarElement, Title, Tooltip, Legend 
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

// Helper function to split arrays into chunks
const chunkArray = (array, size) => {
    const chunked = [];
    let index = 0;
    while (index < array.length) {
        chunked.push(array.slice(index, size + index));
        index += size;
    }
    return chunked;
};

const ReportDocument = forwardRef(
    ({ reportData, auth, collegeName, collegeLogo, collegeColor, collegeEmail }, ref) => {
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
                        ...(reportData.options || {}), 
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false, 
                        plugins: {
                            ...(reportData.options?.plugins || {}),
                        },
                    },
                });
            }

            return () => {
                if (chartInstanceRef.current) chartInstanceRef.current.destroy();
            };
        }, [reportData]);

        if (!reportData) return null;

        // 🧠 FIXED: Lowered row limits to prevent footer clipping
        const rawDataset = reportData.tableData?.dataset || [];
        const PAGE_1_MAX_ROWS = 12; // Safely clears the summary text
        const SUBSEQUENT_PAGE_MAX_ROWS = 19; // Safely clears the header/footer

        const page1Data = rawDataset.slice(0, PAGE_1_MAX_ROWS);
        const remainingData = rawDataset.slice(PAGE_1_MAX_ROWS);
        const extraDataPages = remainingData.length > 0 ? chunkArray(remainingData, SUBSEQUENT_PAGE_MAX_ROWS) : [];

        // Reusable Header Component
        const DocumentHeader = () => (
            <header className="pt-10 px-12 pb-4 flex justify-between items-start shrink-0">
                <img src="/formal.webp" alt="Formal Logo" className="h-[75px] w-auto object-contain" />
                {collegeLogo && <img src={collegeLogo} alt="College Logo" className="h-[75px] w-auto object-contain" />}
            </header>
        );

        // Reusable Footer Component
        const DocumentFooter = () => (
            <footer className="w-full flex mt-auto border-t-[4px] border-[#ffb736] shrink-0 z-10">
                {collegeName && (
                    <div className="text-white w-[40%] px-8 py-5 flex flex-col justify-center" style={{ backgroundColor: collegeColor || "#930147" }}>
                        <div className="font-serif text-[15px] font-bold tracking-wide mb-1">Manila Central University</div>
                        <div className="font-serif text-[13px] opacity-90 mb-1">{collegeName}</div>
                        <div className="font-serif text-[12px] opacity-80">{collegeEmail}</div>
                    </div>
                )}
                <div className={`bg-[#5c297c] text-white px-10 py-5 flex justify-between items-center ${collegeName ? "w-[60%]" : "w-full"}`}>
                    <div className="flex flex-col justify-center space-y-1">
                        <div className="font-serif text-[13px] opacity-90">EDSA, Caloocan City 1400</div>
                        <div className="font-serif text-[13px] opacity-90">+63 2 8364-10-71 to 78</div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="font-montserrat font-bold text-[12px] tracking-widest mt-auto">www.mcu.edu.ph</div>
                        <img src="/qr.webp" alt="QR Code" className="w-[45px] h-[45px] object-contain bg-white p-1 rounded" />
                    </div>
                </div>
            </footer>
        );

        return (
            <div id="report" ref={ref} className="flex flex-col w-[816px] bg-transparent">
                
                {/* PAGE 1: Summaries and Initial Data */}
                <div className="report-page w-[816px] h-[1056px] bg-white shadow-lg flex flex-col box-border mb-8 print:mb-0 print:shadow-none break-after-page shrink-0 mx-auto relative overflow-hidden">
                    <DocumentHeader />

                    <section className="flex-1 px-12 py-2 flex flex-col overflow-hidden">
                        <h1 className="font-serif text-2xl font-bold text-gray-900 mb-6 shrink-0">{reportData.title}</h1>
                        <div className="font-serif text-[15px] text-gray-600 mb-6 leading-relaxed shrink-0">
                            <p>Time Created: {reportData.timestamp}</p>
                            <p>Generated by: {auth?.user?.name || "System Administrator"}</p>
                        </div>
                        <div className="font-serif text-[15px] text-gray-800 mb-6 leading-relaxed shrink-0">
                            <p>Statistical Tool: {reportData.tool}</p>
                            <p className="whitespace-pre-line">{reportData.fields}</p>
                        </div>

                        <h2 className="font-serif font-bold text-xl mb-4 mt-4 shrink-0">Results Summary:</h2>
                        <div className="flex gap-10 mt-2">
                            <div className="flex-1">
                                <h3 className="font-serif font-bold text-[15px] mb-2 shrink-0">Data Set Breakdown</h3>
                                <table className="w-full border-collapse border border-gray-300 font-serif text-[13px] text-center mb-2">
                                    <thead>
                                        <tr className="bg-[#5c297c] text-white">
                                            <th className="border border-gray-300 p-2 font-medium">Variable Group</th>
                                            <th className="border border-gray-300 p-2 font-medium uppercase">Value/Count</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {page1Data.map((row, i) => (
                                            <tr key={i}>
                                                <td className="border border-gray-300 p-2 text-gray-700">{row.label}</td>
                                                <td className="border border-gray-300 p-2 text-gray-700">{row.val}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {extraDataPages.length > 0 && (
                                    <p className="text-xs text-[#5c297c] font-bold italic mt-2 text-center">Table continues on next page...</p>
                                )}
                            </div>

                            <div className="flex-1 shrink-0">
                                <h3 className="font-serif font-bold text-[15px] mb-2">Calculated Statistics</h3>
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
                                                <td className="border border-gray-300 p-2 text-gray-700 font-bold">{row.val}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    <DocumentFooter />
                </div>

                {/* PAGE 1.5 (Dynamic): Overflowing Data Tables */}
                {extraDataPages.map((chunk, pageIndex) => (
                    <div key={`extra-page-${pageIndex}`} className="report-page w-[816px] h-[1056px] bg-white shadow-lg flex flex-col box-border mb-8 print:mb-0 print:shadow-none break-after-page shrink-0 mx-auto relative overflow-hidden">
                        <DocumentHeader />

                        <section className="flex-1 px-12 py-2 flex flex-col overflow-hidden">
                            <h2 className="font-serif font-bold text-xl mb-4 mt-4 shrink-0">Results Summary (Continued):</h2>
                            <div className="flex gap-10 mt-2">
                                <div className="flex-1">
                                    <table className="w-full border-collapse border border-gray-300 font-serif text-[13px] text-center mb-2">
                                        <thead>
                                            <tr className="bg-[#5c297c] text-white">
                                                <th className="border border-gray-300 p-2 font-medium">Variable Group</th>
                                                <th className="border border-gray-300 p-2 font-medium uppercase">Value/Count</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {chunk.map((row, i) => (
                                                <tr key={i}>
                                                    <td className="border border-gray-300 p-2 text-gray-700">{row.label}</td>
                                                    <td className="border border-gray-300 p-2 text-gray-700">{row.val}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {pageIndex < extraDataPages.length - 1 && (
                                        <p className="text-xs text-[#5c297c] font-bold italic mt-2 text-center">Table continues on next page...</p>
                                    )}
                                </div>
                                <div className="flex-1">
                                    {/* Empty column to maintain exact visual alignment as Page 1 */}
                                </div>
                            </div>
                        </section>

                        <DocumentFooter />
                    </div>
                ))}


                {/* PAGE 2: Full Page Visualization */}
                <div className="report-page w-[816px] h-[1056px] bg-white shadow-lg flex flex-col box-border mb-8 print:mb-0 print:shadow-none break-after-page shrink-0 mx-auto relative overflow-hidden">
                    <DocumentHeader />

                    <section className="flex-1 px-12 py-2 flex flex-col">
                        <div className="flex-1 flex flex-col mt-4">
                            <h2 className="font-serif font-bold text-xl mb-6">Visual Analysis:</h2>
                            <div className="w-full flex-1 relative min-h-[500px]">
                                <canvas id="chartCanvas" ref={chartCanvasRef}></canvas>
                            </div>
                            <div className="mt-4 text-[12px] text-gray-400 italic font-serif">
                                *This graph represents the distribution or correlation based on the dataset provided.
                            </div>
                        </div>
                    </section>

                    <DocumentFooter />
                </div>

            </div>
        );
    }
);

export default ReportDocument;