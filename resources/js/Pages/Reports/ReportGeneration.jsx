import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import StatToolModal from "@/Components/Modals/StatToolModal";
import ReportToolbar from "@/Components/Reports/ReportToolbar";
import ReportDocument from "@/Components/Reports/ReportDocument";
import ReportLoadingAnimation from "@/Components/Reports/ReportLoadingAnimation";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import axios from "axios";
import { toast } from "react-toastify"; // 🧠 NEW: Import toastify directly

export default function GenerateReport(props) {
    const { auth = {} } = usePage().props;
    const filters = props.filters || {};
    const subMetricMap = props.subMetricMap || {};
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
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isStatModalOpen]);

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

    const handlePrint = async () => {
        if (!reportRef.current) return;
        setLoadingMessage("Preparing document for printing...");
        setIsProcessing(true);
        await new Promise((resolve) => setTimeout(resolve, 150));

        try {
            const pages = reportRef.current.querySelectorAll(".report-page");
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
            const pagesHTML = pageImages
                .map(
                    (imgData) =>
                        `<div class="page"><img src="${imgData}" /></div>`,
                )
                .join("");

            doc.open();
            doc.write(`
                <html>
                  <head>
                    <title>Print Report</title>
                    <style>
                      @page { size: Letter portrait; margin: 0; }
                      html, body { margin: 0; padding: 0; background: white; }
                      .page { width: 8.5in; height: 11in; page-break-after: always; overflow: hidden; box-sizing: border-box; }
                      .page:last-child { page-break-after: auto; }
                      img { width: 100%; height: 100%; object-fit: contain; display: block; }
                    </style>
                  </head>
                  <body>${pagesHTML}</body>
                </html>
            `);
            doc.close();

            const imgElements = doc.querySelectorAll("img");
            const loadPromises = Array.from(imgElements).map(
                (img) =>
                    new Promise((resolve) => {
                        if (img.complete) resolve();
                        else {
                            img.onload = resolve;
                            img.onerror = resolve;
                        }
                    }),
            );
            await Promise.all(loadPromises);

            iframe.contentWindow.focus();
            iframe.contentWindow.print();

            setTimeout(() => {
                if (document.body.contains(iframe))
                    document.body.removeChild(iframe);
            }, 60000);
        } catch (error) {
            console.error("Error preparing print:", error);
            // 🧠 FIXED: Replaced alert with global toast
            toast.error("An error occurred while preparing the print document.");
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
                e.preventDefault();
                if (reportData && !isGenerating && !isProcessing) handlePrint();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [reportData, isGenerating, isProcessing]);

    const handleExportPDF = async () => {
        if (!reportRef.current) return;
        setLoadingMessage("Generating PDF Document...");
        setIsProcessing(true);
        await new Promise((resolve) => setTimeout(resolve, 150));

        try {
            const pages = reportRef.current.querySelectorAll(".report-page");
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
            pdf.save(`report_${formattedDate}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            // 🧠 FIXED: Replaced alert with global toast
            toast.error("An error occurred while generating the PDF.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGenerate = async (config) => {
            setIsGenerating(true);
            try {
                const payload = { ...filters, ...config };
                const response = await axios.post(route('report.generate'), payload);

                if (response.data.success) {
                    const res = response.data;

                    // 1. Map Statistics for the Summary Table
                    const statsArray = Object.entries(res.statistics).map(([key, value]) => ({
                        metric: key, 
                        val: value.toString()
                    }));

                    let datasetArray = [];
                    let chartConfig = {};

                    // 2. Determine Chart Type and Data Structure
                    if (res.chart_type === 'regression' || res.chart_type === 'scatter') {
                        // --- PEARSON R & REGRESSION LOGIC (Scatter + Trendline) ---
                        datasetArray = res.raw_data.map((pt, i) => ({ 
                            label: `Student ${i + 1}`, val: `X: ${pt.x}, Y: ${pt.y}` 
                        }));

                        const datasets = [];

                        // If Regression Line data is provided, draw the purple trendline
                        if (res.regression_line) {
                            const { m, b, minX, maxX } = res.regression_line;
                            datasets.push({
                                label: "Trendline",
                                data: [ { x: minX, y: m * minX + b }, { x: maxX, y: m * maxX + b } ],
                                type: 'line', 
                                borderColor: '#5c297c',
                                borderWidth: 3,
                                fill: false,
                                pointRadius: 0, 
                                showLine: true
                            });
                        }

                        // Add the raw scatter dots
                        datasets.push({
                            label: "Student Data",
                            data: res.raw_data,
                            type: 'scatter',
                            backgroundColor: "#ffb736",
                            borderColor: "#d97706",
                            borderWidth: 1,
                            pointRadius: 5,
                            pointHoverRadius: 7
                        });

                        chartConfig = {
                            chartType: "scatter", 
                            chartData: { datasets },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    x: { 
                                        type: 'linear', 
                                        position: 'bottom', 
                                        title: { display: true, text: res.variable_name.split(' vs ')[0] },
                                        ticks: { beginAtZero: false }
                                    },
                                    y: { 
                                        type: 'linear', 
                                        title: { display: true, text: res.variable_name.split(' vs ')[1] },
                                        ticks: { beginAtZero: false }
                                    }
                                },
                                plugins: { legend: { display: true, position: 'top' } }
                            }
                        };

                    } else if (res.chart_type === 'ttest_ind' || res.chart_type === 'ttest_dep') {
                        // --- T-TEST LOGIC (Bar + Scatter Overlay) ---
                        datasetArray = res.chart_data.labels.map((label, i) => ({
                            label: label,
                            val: `Mean: ${res.chart_data.means[i].toFixed(4)}`
                        }));

                        // 1. Draw the Means as semi-transparent bars
                        const datasets = [{
                            type: 'bar',
                            label: "Group Mean",
                            data: res.chart_data.means,
                            backgroundColor: ["rgba(92, 41, 124, 0.5)", "rgba(255, 183, 54, 0.5)"], 
                            borderColor: ["#5c297c", "#ffb736"],
                            borderWidth: 2,
                            barPercentage: 0.6
                        }];

                        // 2. Overlay individual student scores as jittered dots
                        if (res.raw_data && res.raw_data.group1 && res.raw_data.group2) {
                            const jitter = () => (Math.random() - 0.5) * 0.3; // Spread dots horizontally
                            
                            // X axis is categorical (Index 0 = Group 1, Index 1 = Group 2)
                            const scatter1 = res.raw_data.group1.map(val => ({ x: 0 + jitter(), y: parseFloat(val) }));
                            const scatter2 = res.raw_data.group2.map(val => ({ x: 1 + jitter(), y: parseFloat(val) }));

                            datasets.push({
                                type: 'scatter', 
                                label: res.chart_data.labels[0] + " Scores",
                                data: scatter1, 
                                backgroundColor: "#5c297c", 
                                pointRadius: 4, 
                                borderColor: "#fff", 
                                borderWidth: 1
                            });
                            
                            datasets.push({
                                type: 'scatter', 
                                label: res.chart_data.labels[1] + " Scores",
                                data: scatter2, 
                                backgroundColor: "#ffb736", 
                                pointRadius: 4, 
                                borderColor: "#fff", 
                                borderWidth: 1
                            });
                        }

                        // 3. Connect the means with a dashed line for Dependent T-Test
                        if (res.chart_type === 'ttest_dep') {
                            datasets.push({
                                type: 'line', 
                                label: "Mean Change Trajectory",
                                data: res.chart_data.means, 
                                borderColor: '#374151', 
                                borderWidth: 2,
                                borderDash: [5, 5], 
                                fill: false, 
                                pointRadius: 6, 
                                pointBackgroundColor: '#374151'
                            });
                        }

                        chartConfig = {
                            chartType: "bar",
                            chartData: {
                                labels: res.chart_data.labels,
                                datasets: datasets
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        title: { display: true, text: 'Score' }
                                    },
                                    x: {
                                        title: { display: true, text: 'Compared Groups' }
                                    }
                                },
                                plugins: { legend: { display: true, position: 'top' } }
                            }
                        };

                    } else if (res.chart_type === 'chi_sq') {
                        // --- CHI-SQUARE LOGIC ---
                        datasetArray = res.chart_data.datasets.flatMap(ds => 
                            ds.data.map((val, i) => ({
                                label: `${ds.label} - ${res.chart_data.labels[i]}`,
                                val: `${val} students`
                            }))
                        );

                        chartConfig = {
                            chartType: "bar",
                            chartData: {
                                labels: res.chart_data.labels,
                                datasets: res.chart_data.datasets.map((ds, i) => ({
                                    ...ds,
                                    backgroundColor: i === 0 ? "#5c297c" : "#ffb736"
                                }))
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    x: { stacked: true },
                                    y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Student Count' } }
                                }
                            }
                        };
                    } else if (res.chart_type === 'chi_sq_gof' || res.title.includes('Goodness of Fit')) {
                        // --- CHI-SQUARE GOODNESS OF FIT LOGIC ---
                        const categories = Object.keys(res.raw_data);
                        const counts = Object.values(res.raw_data);

                        datasetArray = categories.map((cat, i) => ({
                            label: cat,
                            val: `${counts[i]} students`
                        }));

                        chartConfig = {
                            chartType: "bar",
                            chartData: {
                                labels: categories,
                                datasets: [{
                                    label: "Observed Frequency",
                                    data: counts,
                                    backgroundColor: "#5c297c",
                                    borderWidth: 1
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: { beginAtZero: true, title: { display: true, text: 'Count' } }
                                },
                                plugins: { legend: { display: false } }
                            }
                        };

                    } else {
                        // --- DESCRIPTIVE STATISTICS LOGIC ---
                        const rawDataRaw = res.raw_data;
                        const raw = Array.isArray(rawDataRaw) ? rawDataRaw : Object.values(rawDataRaw);

                        const min = parseFloat(res.statistics.Minimum);
                        const max = parseFloat(res.statistics.Maximum);
                        
                        const binCount = 7;
                        const range = max - min;
                        const binSize = range > 0 ? range / binCount : 1;

                        const bins = Array.from({ length: binCount }, (_, i) => {
                            const start = min + i * binSize;
                            const end = i === binCount - 1 ? max : min + (i + 1) * binSize;
                            return { start, end, label: `${start.toFixed(2)} - ${end.toFixed(2)}`, count: 0 };
                        });

                        raw.forEach(val => {
                            const numVal = parseFloat(val);
                            if (numVal === max) bins[binCount - 1].count++;
                            else {
                                const index = Math.floor((numVal - min) / binSize);
                                const safeIndex = Math.max(0, Math.min(binCount - 1, index));
                                bins[safeIndex].count++;
                            }
                        });

                        datasetArray = bins.map(b => ({ label: b.label, val: b.count.toString() }));
                        chartConfig = {
                            chartType: "bar",
                            chartData: {
                                labels: bins.map(b => b.label),
                                datasets: [{
                                    label: "Frequency",
                                    data: bins.map(b => b.count),
                                    backgroundColor: "#5c297c",
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } }
                            }
                        };
                    }

                // 3. Final Report Assembly
                const now = new Date();
                const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
                        
                const isGoF = res.title && res.title.includes('Goodness of Fit');
                const expectedInfo = isGoF && config.expected_ratios 
                    ? `\nExpected: ${Object.entries(config.expected_ratios).map(([k, v]) => `${k}: ${v}%`).join(', ')}`
                    : '';

                setReportData({
                    title: "BRIDGE Statistical Report",
                    timestamp: timestamp,
                    tool: res.title,
                    fields: res.variable_name + expectedInfo,
                    metricName: res.variable_name,
                    tableData: { dataset: datasetArray, stats: statsArray },
                    ...chartConfig
                });

                setIsStatModalOpen(false);
                
                // 🧠 FIXED: Success Toast
                toast.success("Report generated successfully!");
            }
        } catch (error) {
            console.error("Report Error:", error);
            
            // 🧠 FIXED: Replaced alert with global toast
            const errorMessage = error.response?.data?.error || error.response?.data?.message || "An error occurred during calculation. Please check your data selection.";
            toast.error(errorMessage);

        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Generate Report" />

            <div className="min-h-screen bg-gray-50 pb-10 pt-8 relative">
                <div className="max-w-[1000px] mx-auto px-4" ref={containerRef}>
                    <ReportToolbar
                        onOpenModal={() => setIsStatModalOpen(true)}
                        onPrint={handlePrint}
                        onExport={handleExportPDF}
                        isDisabled={!reportData || isGenerating || isProcessing}
                    />

                    {/* CONSOLIDATED LOADING ANIMATION COMPONENT */}
                    {isGenerating && (
                        <ReportLoadingAnimation
                            title="Generating Report"
                            message={
                                "Please wait while we process your data..."
                            }
                        />
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
                                    height: isProcessing
                                        ? "auto"
                                        : `${reportHeight * scale}px`,
                                    transform: isProcessing
                                        ? "none"
                                        : `scale(${scale})`,
                                    transformOrigin: "top center",
                                    transition: isProcessing
                                        ? "none"
                                        : "height 0.3s ease",
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

                <StatToolModal
                    isOpen={isStatModalOpen}
                    onClose={() => setIsStatModalOpen(false)}
                    onGenerate={handleGenerate}
                    subMetricMap={subMetricMap}
                    filters={filters}
                />
            </div>
        </AuthenticatedLayout>
    );
}