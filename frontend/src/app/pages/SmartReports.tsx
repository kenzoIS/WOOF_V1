import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Toaster } from "../components/ui/sonner";
import { InfoTooltip } from "../components/InfoTooltip";
import {
  generateSmartReport,
  getSmartReports,
  deleteSmartReport,
  submitSmartReportFeedback,
  SmartReport
} from "../lib/api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";

export function SmartReports() {
  const router = useRouter();
  const [reports, setReports] = useState<SmartReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SmartReport | null>(null);
  const [title, setTitle] = useState("Executive Business Performance Report");
  const todayStr = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgoStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  })();
  const [startDate, setStartDate] = useState(thirtyDaysAgoStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [selectedSectors, setSelectedSectors] = useState<string[]>(["Cafe", "Retail", "Services"]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // UAT Feedback form state
  const [accuracyRating, setAccuracyRating] = useState<number>(5);
  const [usefulnessRating, setUsefulnessRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Modal States
  const [showPartialDataModal, setShowPartialDataModal] = useState(false);
  const [showNoDataModal, setShowNoDataModal] = useState(false);
  const [showInvalidDateModal, setShowInvalidDateModal] = useState(false);
  const [pendingReportToShow, setPendingReportToShow] = useState<SmartReport | null>(null);

  const fetchReports = async (selectLatest = false) => {
    try {
      const data = await getSmartReports();
      setReports(data);
      if (selectLatest && data.length > 0) {
        setSelectedReport(data[0]);
      }
    } catch (err: any) {
      toast.error("Failed to load reports log", { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(true);
  }, []);

  useEffect(() => {
    if (selectedReport) {
      setAccuracyRating(selectedReport.uatFeedback?.accuracyRating || 5);
      setUsefulnessRating(selectedReport.uatFeedback?.usefulnessRating || 5);
      setFeedbackText(selectedReport.uatFeedback?.feedbackText || "");
    }
  }, [selectedReport]);

  const handleSectorChange = (sector: string) => {
    if (selectedSectors.includes(sector)) {
      setSelectedSectors(selectedSectors.filter((s) => s !== sector));
    } else {
      setSelectedSectors([...selectedSectors, sector]);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSectors.length === 0) {
      toast.error("Validation Error", { description: "Please select at least one business sector." });
      return;
    }

    // Modal 3: Invalid Date selection check
    if (new Date(startDate) > new Date(endDate)) {
      setShowInvalidDateModal(true);
      return;
    }

    setIsGenerating(true);
    try {
      const newReport = await generateSmartReport({
        title,
        startDate,
        endDate,
        sectors: selectedSectors,
      });

      // Use isPartialData flag from backend instead of guessing from channel names
      if (newReport.isPartialData) {
        setPendingReportToShow(newReport);
        setShowPartialDataModal(true);
      } else {
        setSelectedReport(newReport);
      }

      fetchReports();
      toast.success("Intelligence report generated successfully!");
    } catch (err: any) {
      // Modal 2 check: No transactions or empty range 404
      const errMsg = err.message || "";
      if (
        errMsg.includes("No transactions found") ||
        errMsg.includes("404") ||
        err.status === 404
      ) {
        setShowNoDataModal(true);
      } else {
        toast.error("Report generation failed", { description: errMsg });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== "undefined" && !window.confirm("Are you sure you want to delete this report?")) {
      return;
    }

    try {
      await deleteSmartReport(id);
      toast.success("Report deleted");
      // Optimistically remove from local list
      setReports((prev) => prev.filter((rep) => rep._id !== id));
      if (selectedReport?._id === id) {
        setSelectedReport(null);
      }
    } catch (err: any) {
      toast.error("Delete failed", { description: err.message });
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedReport) return;
    setIsSubmittingFeedback(true);
    try {
      const updated = await submitSmartReportFeedback(selectedReport._id, {
        accuracyRating,
        usefulnessRating,
        ownerApproved: true,
        feedbackText,
      });
      setSelectedReport(updated);
      fetchReports();
      toast.success("UAT Feedback submitted & report approved!");
    } catch (err: any) {
      toast.error("Failed to submit feedback", { description: err.message });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleExportCSV = () => {
    if (!selectedReport) return;
    
    // Construct CSV content
    let csvContent = "\uFEFF"; // UTF-8 BOM for Excel compatibility
    csvContent += `Report Title,${selectedReport.title}\n`;
    csvContent += `Date Range,${selectedReport.dateRange.start} to ${selectedReport.dateRange.end}\n`;
    csvContent += `Generated At,${selectedReport.generatedAt}\n\n`;
    
    csvContent += `METRIC,VALUE\n`;
    csvContent += `Total Revenue,PHP ${selectedReport.aggregatedData.totalRevenue}\n`;
    csvContent += `Gross Profit,PHP ${selectedReport.aggregatedData.totalGrossProfit}\n`;
    csvContent += `Profit Margin,${selectedReport.aggregatedData.averageMargin}%\n`;
    csvContent += `Data Completeness,${selectedReport.dataCompleteness ?? 100}%\n`;
    csvContent += `Trend Direction,${selectedReport.extrapolatedTrends.trendDirection}\n\n`;
    
    csvContent += `CHANNEL REVENUE\n`;
    Object.entries(selectedReport.aggregatedData.channelRevenue).forEach(([channel, rev]) => {
      csvContent += `${channel},PHP ${rev}\n`;
    });
    csvContent += `\n`;
    
    csvContent += `CATEGORY SALES\n`;
    Object.entries(selectedReport.aggregatedData.categorySales).forEach(([cat, qty]) => {
      csvContent += `${cat},${qty}\n`;
    });
    csvContent += `\n`;
    
    csvContent += `DAILY TREND PROJECTIONS (30 Days)\n`;
    csvContent += `Date,Projected Revenue (PHP)\n`;
    selectedReport.extrapolatedTrends.dates.forEach((date, idx) => {
      csvContent += `${date},${Math.round(selectedReport.extrapolatedTrends.projectedRevenue[idx])}\n`;
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedReport.title.replace(/\s+/g, "_")}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded successfully!");
  };

  const handleExportPDF = () => {
    window.print();
  };

  // Build chart dataset: historical actuals + 30-day projection on one continuous timeline
  const getChartData = () => {
    if (!selectedReport) return { data: [], forecastStartDate: null, hasHistory: false };
    const trends = selectedReport.extrapolatedTrends;
    const history = (selectedReport.aggregatedData.dailyHistory ?? []).filter(
      (h) => h.value > 0  // skip zero-value days
    );
    const hasHistory = history.length > 0;

    const fmt = (d: string) =>
      new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

    if (!hasHistory) {
      // No history — just show the clean projection
      return {
        data: trends.dates.map((date, idx) => ({
          date: fmt(date),
          projected: Math.round(trends.projectedRevenue[idx]),
        })),
        forecastStartDate: null,
        hasHistory: false,
      };
    }

    // Historical actuals
    const historicalPoints = history.map((h) => ({
      date: fmt(h.date),
      actual: h.value,
      projected: undefined as number | undefined,
    }));

    // Bridge: last actual value carried into first projected point so lines connect
    const lastActualVal = history[history.length - 1].value;
    const forecastStartDate = trends.dates[0] ?? null;

    // Projected points
    const projectedPoints = trends.dates.map((date, idx) => ({
      date: fmt(date),
      actual: idx === 0 ? lastActualVal : undefined,
      projected: Math.round(trends.projectedRevenue[idx]),
    }));

    return {
      data: [...historicalPoints, ...projectedPoints],
      forecastStartDate: forecastStartDate ? fmt(forecastStartDate) : null,
      hasHistory: true,
    };
  };

  const { data: chartData, forecastStartDate, hasHistory } = getChartData();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FFFBFD] p-6 overflow-y-auto space-y-6">
      {/* Dynamic Printing Style Block */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report-area, #printable-report-area * {
            visibility: visible;
          }
          #printable-report-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#FFD9EC] pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black text-[#223047]">
              Smart Reports
            </h1>
            <InfoTooltip label="Generate full-stack ETL analytics, predictive trend projections, and automated NLG summaries." />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Form & History Log */}
        <div className="space-y-6 lg:col-span-1">
          {/* Generation Config Card */}
          <div className="bg-white border-2 border-[#FFD9EC] rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-[#223047]">
              Report Parameters
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#223047] opacity-75">Report Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs rounded-xl border border-[#FFD9EC] p-2.5 transition-colors focus:border-[#F53799] focus:outline-none"
                  placeholder="e.g. Weekly Sales Audit"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#223047] opacity-75">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs rounded-xl border border-[#FFD9EC] p-2.5 transition-colors focus:border-[#F53799] focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#223047] opacity-75">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs rounded-xl border border-[#FFD9EC] p-2.5 transition-colors focus:border-[#F53799] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#223047] opacity-75 block">Target Sectors</label>
                <div className="flex flex-wrap gap-2">
                  {["Cafe", "Retail", "Services"].map((sec) => {
                    const isChecked = selectedSectors.includes(sec);
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => handleSectorChange(sec)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all font-semibold ${
                          isChecked
                            ? "bg-[#FFF2FA] border-[#F53799] text-[#F53799]"
                            : "bg-white border-[#FFD9EC] text-[#223047] opacity-60 hover:opacity-100"
                        }`}
                      >
                        {sec}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-[#F53799] hover:bg-[#D42A7D] text-white py-5 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Report"
                )}
              </Button>
            </form>
          </div>

          {/* Historical Log list */}
          <div className="bg-white border-2 border-[#FFD9EC] rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-[#223047]">
              Reports Log
            </h2>

            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-[#F53799]" />
              </div>
            ) : reports.length === 0 ? (
              <p className="text-xs text-[#223047] opacity-50 text-center py-4">No reports generated yet.</p>
            ) : (
              <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
                {reports.map((rep) => {
                  const isSelected = selectedReport?._id === rep._id;
                  const dateFormatted = new Date(rep.generatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  return (
                    <div
                      key={rep._id}
                      onClick={() => setSelectedReport(rep)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-[#FFF2FA] border-[#F53799] text-[#F53799]"
                          : "bg-white border-[#FFD9EC] hover:border-[#F53799]/40 text-[#223047]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-extrabold truncate">{rep.title}</h4>
                        <span className="text-[10px] opacity-60 block mt-0.5">{dateFormatted}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleDelete(rep._id, e)}
                          className="px-2 py-1 text-[11px] font-bold rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed View */}
        <div className="lg:col-span-2">
          {selectedReport ? (
            <div className="space-y-6">
              {/* Detailed View Card */}
              <div id="printable-report-area" className="bg-white border-2 border-[#FFD9EC] rounded-3xl p-6 shadow-sm space-y-6">
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#FFD9EC] pb-4">
                  <div>
                    <h2 className="text-lg font-black text-[#223047]">{selectedReport.title}</h2>
                    <span className="text-xs text-[#223047] opacity-60 block mt-1">
                      Data range: {selectedReport.dateRange.start} to {selectedReport.dateRange.end}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Export Drodown Menu */}
                    <div className="relative group">
                      <Button className="bg-[#FFF2FA] border border-[#FFD9EC] text-[#F53799] hover:bg-[#F53799]/10 font-bold py-2 px-3 rounded-xl text-xs transition-colors">
                        Export Report
                      </Button>
                      <div className="absolute right-0 mt-1 w-32 bg-white border border-[#FFD9EC] rounded-xl shadow-lg hidden group-hover:block hover:block z-10 overflow-hidden">
                        <button
                          type="button"
                          onClick={handleExportCSV}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#223047] hover:bg-[#FFF2FA] transition-colors border-b border-[#FFD9EC]/50"
                        >
                          CSV Format
                        </button>
                        <button
                          type="button"
                          onClick={handleExportPDF}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#223047] hover:bg-[#FFF2FA] transition-colors"
                        >
                          PDF / Print
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#FFF2FA] border border-[#FFD9EC] rounded-xl px-3 py-1.5 text-right shrink-0">
                      <span className="text-[10px] text-[#223047] opacity-50 block uppercase font-bold">Generated At</span>
                      <span className="text-xs font-extrabold text-[#F53799]">
                        {new Date(selectedReport.generatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Navigation to Live Analytical Dashboards */}
                <div className="flex flex-wrap items-center gap-2 p-3 bg-[#FFF7FB] border border-[#FFD9EC] rounded-2xl text-xs">
                  <span className="font-bold text-[#223047] opacity-60">Explore Live Dashboards:</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push("/cafe")}
                    className="border-[#FFD9EC] hover:bg-white text-xs h-7 text-[#F53799] font-semibold"
                  >
                    Cafe Dashboard
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push("/services")}
                    className="border-[#FFD9EC] hover:bg-white text-xs h-7 text-[#06B6D4] font-semibold"
                  >
                    Services Dashboard
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push("/retail")}
                    className="border-[#FFD9EC] hover:bg-white text-xs h-7 text-amber-600 font-semibold"
                  >
                    Retail Dashboard
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push("/ai-simulation")}
                    className="border-[#FFD9EC] hover:bg-white text-xs h-7 text-purple-600 font-semibold"
                  >
                    AI Simulation Hub
                  </Button>
                </div>

                {/* KPI metrics row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-[#223047] opacity-50 block">Total Revenue</span>
                    <span className="text-base font-black text-[#223047] block mt-1">
                      ₱{new Intl.NumberFormat().format(selectedReport.aggregatedData.totalRevenue)}
                    </span>
                  </div>
                  <div className="bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-[#223047] opacity-50 block">Gross Profit</span>
                    <span className="text-base font-black text-[#F53799] block mt-1">
                      ₱{new Intl.NumberFormat().format(selectedReport.aggregatedData.totalGrossProfit)}
                    </span>
                  </div>
                  <div className="bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-[#223047] opacity-50 block">Profit Margin</span>
                    <span className="text-base font-black text-emerald-600 block mt-1">
                      {selectedReport.aggregatedData.averageMargin}%
                    </span>
                  </div>
                  <div className="bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-[#223047] opacity-50 block">Completeness</span>
                    <span className="text-base font-black text-[#06B6D4] block mt-1">
                      {selectedReport.dataCompleteness ?? 100}%
                    </span>
                  </div>
                  <div className="bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-[#223047] opacity-50 block">Trend Direction</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full inline-block font-extrabold mt-1.5 ${
                      selectedReport.extrapolatedTrends.trendDirection === "UPWARD"
                        ? "bg-green-100 text-green-700"
                        : selectedReport.extrapolatedTrends.trendDirection === "DOWNWARD"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {selectedReport.extrapolatedTrends.trendDirection}
                    </span>
                  </div>
                </div>

                {/* Trend chart */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-[#223047] opacity-50 tracking-wider">
                      {hasHistory ? "Historical Actuals + 30-Day Forecast" : "30-Day Extrapolated Trend Forecast"}
                    </h3>
                    {hasHistory && forecastStartDate && (
                      <span className="text-[10px] bg-cyan-50 border border-cyan-200 text-cyan-700 px-2 py-0.5 rounded-full font-bold">
                        Forecast starts {forecastStartDate}
                      </span>
                    )}
                  </div>
                  <div className="h-[240px] w-full bg-slate-50 border border-slate-100 rounded-xl p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F53799" stopOpacity={0.18}/>
                            <stop offset="95%" stopColor="#F53799" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.18}/>
                            <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="date" fontSize={9} tickLine={false} interval="preserveStartEnd" />
                        <YAxis fontSize={9} tickLine={false} width={52} />
                        <Tooltip
                          formatter={(value: any, name: string) => [
                            `₱${Number(value).toLocaleString()}`,
                            name === "actual" ? "Actual Revenue" : "Projected Revenue"
                          ]}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: 10 }}
                          formatter={(value) => value === "actual" ? "Actual Revenue (PHP)" : "Projected Revenue (PHP)"}
                        />
                        {hasHistory && forecastStartDate && (
                          <ReferenceLine
                            x={forecastStartDate}
                            stroke="#94a3b8"
                            strokeDasharray="4 3"
                            label={{ value: "Forecast →", position: "insideTopRight", fontSize: 9, fill: "#64748b" }}
                          />
                        )}
                        {hasHistory && (
                          <Area
                            type="monotone"
                            dataKey="actual"
                            stroke="#F53799"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorActual)"
                            connectNulls
                            dot={false}
                            name="actual"
                          />
                        )}
                        <Area
                          type="monotone"
                          dataKey="projected"
                          stroke="#06B6D4"
                          strokeWidth={hasHistory ? 2 : 2}
                          strokeDasharray={hasHistory ? "5 3" : undefined}
                          fillOpacity={1}
                          fill="url(#colorProjected)"
                          connectNulls
                          dot={false}
                          name="projected"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* NLG summary section */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase text-[#223047] opacity-50 tracking-wider">
                    AI Business Intelligence Narrative (NLG)
                  </h3>
                  <div className="bg-[#FFF2FA]/30 border-2 border-[#FFD9EC] rounded-2xl p-5 space-y-4 text-xs leading-relaxed text-[#223047]">
                    {/* Use structured nlgSections if available, otherwise fall back to splitting nlgSummary */}
                    {(selectedReport.nlgSections ?? selectedReport.nlgSummary.split("\n\n").map((content, idx) => ({
                      title: ["Executive Performance Summary", "Trend Analysis & Forecasts", "Strategic Advisory & Recommendations"][idx] ?? `Section ${idx + 1}`,
                      content
                    }))).map((section: { title: string; content: string }, idx: number) => (
                      <div key={idx} className="space-y-1.5 p-3.5 bg-white border border-[#FFD9EC] rounded-xl shadow-sm">
                        <h4 className="font-extrabold text-xs text-[#223047]">
                          {section.title}
                        </h4>
                        <p className="opacity-80">{section.content}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Owner UAT Feedback & Approval Card */}
                <div className="border-t border-[#FFD9EC] pt-6 space-y-4">
                  <h3 className="text-xs font-black uppercase text-[#223047] opacity-50 tracking-wider">
                    Owner UAT Feedback & Approval
                  </h3>
                  
                  {selectedReport.uatFeedback?.ownerApproved ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-xs text-emerald-800 flex items-center gap-2">
                          Report Approved by Owner
                          <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full uppercase font-bold">Verified</span>
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-[10px] text-emerald-700 py-1 font-extrabold">
                          <div>Accuracy: {selectedReport.uatFeedback.accuracyRating}/5</div>
                          <div>Usefulness: {selectedReport.uatFeedback.usefulnessRating}/5</div>
                        </div>
                        {selectedReport.uatFeedback.feedbackText && (
                          <p className="text-xs text-emerald-950 italic opacity-85 mt-1">
                            &ldquo;{selectedReport.uatFeedback.feedbackText}&rdquo;
                          </p>
                        )}
                        <span className="text-[10px] text-emerald-600/70 block mt-1">
                          Reviewed on {new Date(selectedReport.uatFeedback.reviewedAt!).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#FFF7FB] border border-[#FFD9EC] rounded-2xl p-5 space-y-4">
                      <p className="text-xs text-[#223047] opacity-80">
                        Please review the aggregated analytics and forecasts. As the business owner, submit your feedback to approve and lock this report.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#223047] opacity-75">Report Accuracy (1-5)</label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setAccuracyRating(val)}
                                className={`w-8 h-8 rounded-lg font-bold text-xs transition-all border ${
                                  accuracyRating === val
                                    ? "bg-[#F53799] border-[#F53799] text-white"
                                    : "bg-white border-[#FFD9EC] text-[#223047] hover:border-[#F53799]/50"
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#223047] opacity-75">Strategic Usefulness (1-5)</label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setUsefulnessRating(val)}
                                className={`w-8 h-8 rounded-lg font-bold text-xs transition-all border ${
                                  usefulnessRating === val
                                    ? "bg-[#06B6D4] border-[#06B6D4] text-white"
                                    : "bg-white border-[#FFD9EC] text-[#223047] hover:border-[#06B6D4]/50"
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#223047] opacity-75">Owner Review Comments</label>
                        <textarea
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          className="w-full text-xs rounded-xl border border-[#FFD9EC] p-3 transition-colors focus:border-[#F53799] focus:outline-none min-h-[60px]"
                          placeholder="Provide any feedback on report accuracy or insights..."
                        />
                      </div>

                      <Button
                        onClick={handleSubmitFeedback}
                        disabled={isSubmittingFeedback}
                        className="bg-[#F53799] hover:bg-[#D42A7D] text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2"
                      >
                        {isSubmittingFeedback ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Approve & Submit UAT"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Blank state */
            <div className="bg-white border-2 border-dashed border-[#FFD9EC] rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-2 shadow-sm min-h-[500px]">
              <div className="space-y-1 max-w-sm">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-base font-extrabold text-[#223047]">No Report Selected</h3>
                  <InfoTooltip label="Choose an existing report from the sidebar log, or input target parameters and generate a new intelligence report." />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Data Integration Warning (Partial Data) */}
      {showPartialDataModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white border-2 border-[#FFD9EC] rounded-3xl p-6 shadow-2xl max-w-md w-full mx-4 space-y-4">
            <div>
              <h3 className="text-base font-black text-[#223047]">Data Integration Notice</h3>
            </div>
            <p className="text-xs text-[#223047] opacity-80 leading-relaxed">
              The generated report currently relies solely on POS data. Integration for PetHub, Shopee, and TikTok Shop channels is still pending. Projections and totals will reflect limited channel activity.
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => {
                  if (pendingReportToShow) {
                    setSelectedReport(pendingReportToShow);
                    setPendingReportToShow(null);
                  }
                  setShowPartialDataModal(false);
                }}
                className="flex-1 bg-[#F53799] hover:bg-[#D42A7D] text-white font-bold py-2 rounded-xl text-xs"
              >
                Proceed with Limited Data
              </Button>
              <Button
                onClick={() => {
                  setShowPartialDataModal(false);
                  toast.info("Manage Data Sources option selected. Please contact the administrator to connect API channels.");
                }}
                className="flex-1 bg-white border border-[#FFD9EC] hover:bg-slate-50 text-[#223047] font-bold py-2 rounded-xl text-xs"
              >
                Manage Data Sources
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: No Data Available (Empty State) */}
      {showNoDataModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white border-2 border-[#FFD9EC] rounded-3xl p-6 shadow-2xl max-w-md w-full mx-4 space-y-4">
            <div>
              <h3 className="text-base font-black text-[#223047]">No Data Found</h3>
            </div>
            <p className="text-xs text-[#223047] opacity-80 leading-relaxed">
              No transaction or grooming logs match your selected criteria (Date Range / Target Sectors). Please adjust your parameters and try again.
            </p>
            <div className="pt-2">
              <Button
                onClick={() => setShowNoDataModal(false)}
                className="w-full bg-[#F53799] hover:bg-[#D42A7D] text-white font-bold py-2 rounded-xl text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Invalid Date Selection */}
      {showInvalidDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white border-2 border-[#FFD9EC] rounded-3xl p-6 shadow-2xl max-w-md w-full mx-4 space-y-4">
            <div>
              <h3 className="text-base font-black text-[#223047]">Invalid Date Selection</h3>
            </div>
            <p className="text-xs text-[#223047] opacity-80 leading-relaxed">
              The selected Start Date cannot be later than the End Date. Please verify your reporting period.
            </p>
            <div className="pt-2">
              <Button
                onClick={() => setShowInvalidDateModal(false)}
                className="w-full bg-[#F53799] hover:bg-[#D42A7D] text-white font-bold py-2 rounded-xl text-xs"
              >
                Fix Dates
              </Button>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  );
}
