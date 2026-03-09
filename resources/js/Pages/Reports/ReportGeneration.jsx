import React, { useState, useRef, useLayoutEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import StatToolModal from "@/Components/Modals/StatToolModal";
import ReportToolbar from "@/Components/Reports/ReportToolbar";
import ReportDocument from "@/Components/Reports/ReportDocument";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// Helper function moved outside to keep the component clean
const generateDummyData = (configData) => {
    const toolName =
        configData.tool === "descriptive"
            ? "Descriptive Analysis"
            : `Inferential Analysis (${configData.inferentialType})`;
    const v1 = configData.descField || configData.var1Field || "Variable 1";
    const v2 = configData.var2Field ? ` vs ${configData.var2Field}` : "";
    const isDescriptive = configData.tool === "descriptive";

    return {
        title: `Statistical Report: ${toolName}`,
        timestamp: new Date().toLocaleString("en-US", {
            dateStyle: "long",
            timeStyle: "short",
        }),
        summary: `This report presents the findings of the ${toolName.toLowerCase()} conducted on the selected variables: ${v1}${v2}. The generated chart below visualizes the distribution based on active database records.`,
        chartType: isDescriptive ? "bar" : "line",
        chartData: {
            labels: isDescriptive
                ? ["Category A", "Category B", "Category C", "Category D"]
                : ["Point 1", "Point 2", "Point 3", "Point 4"],
            datasets: [
                {
                    label: isDescriptive
                        ? `${v1} Distribution`
                        : `Relationship: ${v1}${v2}`,
                    data: [75, 45, 90, 60],
                    backgroundColor: "#5c297c",
                    borderColor: "#5c297c",
                    borderWidth: 2,
                    tension: 0.3,
                },
            ],
        },
    };
};

export default function GenerateReport(props) {
    const { auth = {} } = usePage().props;
    const [isStatModalOpen, setIsStatModalOpen] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportData, setReportData] = useState(null);

    const [scale, setScale] = useState(1);
    const [reportHeight, setReportHeight] = useState(1056);

    const containerRef = useRef(null);
    const reportRef = useRef(null);

    // --- Dynamic Scaling ---
    useLayoutEffect(() => {
        const updateScale = () => {
            if (containerRef.current && reportRef.current) {
                const availableWidth = containerRef.current.clientWidth - 32;
                const targetWidth = 816;
                setScale(
                    availableWidth < targetWidth
                        ? availableWidth / targetWidth
                        : 1,
                );
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

    // --- Actions ---
    const handlePrint = () => window.print();

    const handleExportPDF = async () => {
        if (!reportRef.current) return;
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
            });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "px",
                format: [canvas.width / 2, canvas.height / 2],
            });
            pdf.addImage(
                imgData,
                "PNG",
                0,
                0,
                canvas.width / 2,
                canvas.height / 2,
            );

            // --- NEW DATE FORMATTING FOR FILENAME ---
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const day = String(now.getDate()).padStart(2, "0");
            const formattedDate = `${year}-${month}-${day}`;

            pdf.save(`report_${formattedDate}.pdf`);
            // ----------------------------------------
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("An error occurred while generating the PDF.");
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
            <Head title="Generate Report" />

            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #reportWrapper, #reportWrapper * { visibility: visible; }
                    #reportWrapper { position: absolute; left: 0; top: 0; width: 100%; }
                    #reportScaleWrapper { transform: none !important; height: auto !important; }
                    #report { box-shadow: none !important; width: 100% !important; }
                    .no-print { display: none !important; }
                }
            `}</style>

            <div className="min-h-screen bg-gray-50 pb-10 pt-8 relative">
                <div className="max-w-[1000px] mx-auto px-4" ref={containerRef}>
                    <ReportToolbar
                        onOpenModal={() => setIsStatModalOpen(true)}
                        onPrint={handlePrint}
                        onExport={handleExportPDF}
                        isDisabled={!reportData || isGenerating}
                    />

                    {isGenerating && (
                        <div className="w-full h-[500px] bg-white rounded-xl shadow-md border border-gray-200 flex flex-col items-center justify-center animate-pulse">
                            <div className="w-16 h-16 border-4 border-[#5c297c] border-t-[#ffb736] rounded-full animate-spin mb-4"></div>
                            <p className="text-[#5c297c] font-bold font-montserrat text-lg">
                                Analyzing Data...
                            </p>
                        </div>
                    )}

                    <div
                        id="reportWrapper"
                        className={`w-full flex justify-center overflow-hidden ${!reportData && !isGenerating ? "hidden" : ""}`}
                    >
                        {reportData && !isGenerating && (
                            <div
                                id="reportScaleWrapper"
                                style={{
                                    height: `${reportHeight * scale}px`,
                                    transition: "height 0.3s ease",
                                }}
                                className="w-[816px] origin-top"
                            >
                                <ReportDocument
                                    ref={reportRef}
                                    scale={scale}
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

                <StatToolModal
                    isOpen={isStatModalOpen}
                    onClose={() => setIsStatModalOpen(false)}
                    onGenerate={handleGenerate}
                />
            </div>
        </AuthenticatedLayout>
    );
}
