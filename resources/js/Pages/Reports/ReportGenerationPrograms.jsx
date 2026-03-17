import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import ProgramStatModal from "@/Components/Modals/ProgramStatModal";
import ReportToolbar from "@/Components/Reports/ReportToolbar";
import ReportDocument from "@/Components/Reports/ReportDocument";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// Modified Dummy Data to reflect Program-level statistics
const generateDummyData = (configData) => {
    // For Programs, it is always a Descriptive analysis on a cohort
    const toolText = "Program Analysis (Descriptive)";
    const fieldsText = `Analyzed Metric: ${configData.field || "Selected Metric"}`;

    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    return {
        title: "BRIDGE Program Statistical Report",
        timestamp: timestamp,
        tool: toolText,
        fields: fieldsText,
        metricName: configData.field || "Program Examinations",
        tableData: {
            dataset: [
                { label: "Batch 2022", val: "85.4" },
                { label: "Batch 2023", val: "88.1" },
                { label: "Batch 2024", val: "91.2" },
                { label: "Batch 2025", val: "89.5" },
                { label: "Batch 2026", val: "92.0" },
            ],
            stats: [
                { metric: "Total Batches", val: "5" },
                { metric: "Overall Mean", val: "89.24" },
                { metric: "Median", val: "89.50" },
                { metric: "Minimum", val: "85.40" },
                { metric: "Maximum", val: "92.00" },
                { metric: "Trend", val: "Positive (+6.6%)" },
            ]
        },
        chartType: "bar",
        chartData: {
            labels: ["Batch 2022", "Batch 2023", "Batch 2024", "Batch 2025", "Batch 2026"],
            datasets: [
                {
                    label: "Program Average Score",
                    data: [85.4, 88.1, 91.2, 89.5, 92.0], 
                    backgroundColor: "#5c297c",
                    borderColor: "#5c297c",
                    borderWidth: 1,
                },
            ],
        },
    };
};

export default function ProgramReportGeneration(props) {
    const { auth = {} } = usePage().props;
    const [isStatModalOpen, setIsStatModalOpen] = useState(true);
    
    // UI STATES
    const [isGenerating, setIsGenerating] = useState(false); 
    const [isProcessing, setIsProcessing] = useState(false); 
    const [loadingMessage, setLoadingMessage] = useState("");
    const [reportData, setReportData] = useState(null);

    const [scale, setScale] = useState(1);
    const [reportHeight, setReportHeight] = useState(1056);

    const containerRef = useRef(null);
    const reportRef = useRef(null);

    useEffect(() => {
        if (isStatModalOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "unset";
        return () => { document.body.style.overflow = "unset"; };
    }, [isStatModalOpen]);

    useLayoutEffect(() => {
        const updateScale = () => {
            if (containerRef.current && reportRef.current) {
                const availableWidth = containerRef.current.clientWidth - 32;
                const targetWidth = 816; 
                setScale(availableWidth < targetWidth ? availableWidth / targetWidth : 1);
                setReportHeight(reportRef.current.offsetHeight);
            }
        };

        window.addEventListener("resize", updateScale);
        const timer = setTimeout(updateScale, 150);

        return () => {
            window.removeEventListener("resize", updateScale);
            clearTimeout(timer);
        };
    }, [reportData]);

    // =========================================================================
    // SNAPSHOT PRINT LOGIC (Uses Iframe + html2canvas)
    // =========================================================================
    const handlePrint = async () => {
        if (!reportRef.current) return;
        
        setLoadingMessage("Preparing document for printing...");
        setIsProcessing(true); 

        await new Promise((resolve) => setTimeout(resolve, 150));

        try {
            const pages = reportRef.current.querySelectorAll('.report-page');
            const pageImages = [];

            for (let i = 0; i < pages.length; i++) {
                const canvas = await html2canvas(pages[i], {
                    scale: 2, 
                    useCORS: true,
                    logging: false,
                    backgroundColor: "#ffffff",
                });
                pageImages.push(canvas.toDataURL("image/png"));
            }

            const iframe = document.createElement("iframe");
            iframe.style.position = "fixed";
            iframe.style.right = "0";
            iframe.style.bottom = "0";
            iframe.style.width = "0";
            iframe.style.height = "0";
            iframe.style.border = "0";
            document.body.appendChild(iframe);

            const doc = iframe.contentWindow.document;

            const pagesHTML = pageImages.map((imgData) => `
                <div class="page">
                    <img src="${imgData}" />
                </div>
            `).join('');

            doc.open();
            doc.write(`
                <html>
                  <head>
                    <title>Print Program Report</title>
                    <style>
                      @page { size: Letter portrait; margin: 0; }
                      html, body { margin: 0; padding: 0; background: white; }
                      .page { 
                        width: 8.5in; height: 11in; 
                        page-break-after: always; 
                        overflow: hidden; 
                        box-sizing: border-box;
                      }
                      .page:last-child { page-break-after: auto; }
                      img { width: 100%; height: 100%; object-fit: contain; display: block; }
                    </style>
                  </head>
                  <body>
                    ${pagesHTML}
                  </body>
                </html>
            `);
            doc.close();

            const imgElements = doc.querySelectorAll('img');
            const loadPromises = Array.from(imgElements).map(img => {
                return new Promise(resolve => {
                    if (img.complete) resolve();
                    else { img.onload = resolve; img.onerror = resolve; }
                });
            });
            await Promise.all(loadPromises);

            iframe.contentWindow.focus();
            iframe.contentWindow.print();

            setTimeout(() => {
                if (document.body.contains(iframe)) document.body.removeChild(iframe);
            }, 60000);

        } catch (error) {
            console.error("Error preparing print:", error);
            alert("An error occurred while preparing the print document.");
        } finally {
            setIsProcessing(false);
        }
    };

    // =========================================================================
    // OVERRIDE NATIVE CTRL+P / CMD+P
    // =========================================================================
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
                e.preventDefault(); 
                if (reportData && !isGenerating && !isProcessing) {
                    handlePrint();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [reportData, isGenerating, isProcessing]); 


    // =========================================================================
    // MULTI-PAGE PDF EXPORT LOGIC
    // =========================================================================
    const handleExportPDF = async () => {
        if (!reportRef.current) return;
        
        setLoadingMessage("Generating PDF Document...");
        setIsProcessing(true);

        await new Promise((resolve) => setTimeout(resolve, 150));

        try {
            const pages = reportRef.current.querySelectorAll('.report-page');
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "in",
                format: "letter",
            });

            for (let i = 0; i < pages.length; i++) {
                const canvas = await html2canvas(pages[i], {
                    scale: 2, 
                    useCORS: true,
                    logging: false,
                    backgroundColor: "#ffffff",
                });
                
                const imgData = canvas.toDataURL("image/png");

                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, 0, 8.5, 11);
            }

            const now = new Date();
            const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

            pdf.save(`program_report_${formattedDate}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("An error occurred while generating the PDF.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGenerate = (configData) => {
        setIsGenerating(true);
        setReportData(null);
        setTimeout(() => {
            setReportData(generateDummyData(configData));
            setIsGenerating(false);
        }, 1500);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Program Report" />

            <div className="min-h-screen bg-gray-50 pb-10 pt-8 relative">
                <div className="max-w-[1000px] mx-auto px-4" ref={containerRef}>
                    <ReportToolbar
                        onOpenModal={() => setIsStatModalOpen(true)}
                        onPrint={handlePrint}
                        onExport={handleExportPDF}
                        isDisabled={!reportData || isGenerating || isProcessing}
                    />

                    {isGenerating && (
                        <div className="w-full h-[500px] bg-white rounded-xl shadow-md border border-gray-200 flex flex-col items-center justify-center animate-pulse">
                            <div className="w-16 h-16 border-4 border-[#5c297c] border-t-[#ffb736] rounded-full animate-spin mb-4"></div>
                            <p className="text-[#5c297c] font-bold font-montserrat text-lg">
                                Analyzing Program Data...
                            </p>
                        </div>
                    )}

                    <div
                        id="reportWrapper"
                        className={`w-full flex justify-center overflow-x-hidden relative ${!reportData && !isGenerating ? "hidden" : ""}`}
                    >
                        {isProcessing && (
                            <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center min-h-[500px]">
                                <div className="w-16 h-16 border-4 border-[#5c297c] border-t-[#ffb736] rounded-full animate-spin mb-4"></div>
                                <p className="text-[#5c297c] font-bold font-montserrat text-lg">
                                    {loadingMessage}
                                </p>
                            </div>
                        )}

                        {reportData && !isGenerating && (
                            <div
                                id="reportScaleWrapper"
                                style={{
                                    height: isProcessing ? "auto" : `${reportHeight * scale}px`,
                                    transform: isProcessing ? "none" : `scale(${scale})`,
                                    transformOrigin: "top center",
                                    transition: isProcessing ? "none" : "height 0.3s ease",
                                }}
                                className="w-[816px] origin-top mx-auto"
                            >
                                <ReportDocument
                                    ref={reportRef}
                                    reportData={reportData}
                                    auth={auth}
                                    collegeName={props.collegeName}
                                    collegeLogo={props.collegeLogo}
                                    collegeColor={props.collegeColor}
                                    collegeEmail={props.collegeEmail}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <ProgramStatModal
                    isOpen={isStatModalOpen}
                    onClose={() => setIsStatModalOpen(false)}
                    onGenerate={handleGenerate}
                />
            </div>
        </AuthenticatedLayout>
    );
}