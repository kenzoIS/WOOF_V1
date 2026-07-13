import { useState, useRef, useEffect, useMemo } from "react";
import { PawPrint, DollarSign, ShoppingCart, Zap, Check, X, Play, ChevronDown } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import { ErrorModal, ErrorType } from "../components/ErrorModal";
import { SuccessModal, SuccessType } from "../components/SuccessModal";
import { DataIngestion } from "../components/DataIngestion";
import { getHomeOverview } from "../lib/api";
import homeAiImg from "../../imports/no_bg_Home_2.png";
import homeInsightImg from "../../imports/no_bg_Home-3.png";

const fallbackHeatmapDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
  date: "",
  dayLabel: day,
  label: day,
}));
const heatmapHours = ["8AM", "10AM", "12PM", "2PM", "4PM", "6PM", "8PM"];

const formatDateKeyInTimeZone = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
};

const buildHeatmapDaysFromAnchor = (anchorDate?: string | null) => {
  if (!anchorDate) return fallbackHeatmapDays;
  const anchor = new Date(anchorDate);
  if (Number.isNaN(anchor.getTime())) return fallbackHeatmapDays;

  const anchorKey = formatDateKeyInTimeZone(anchor, "Asia/Manila");
  const anchorNoon = new Date(`${anchorKey}T12:00:00.000Z`);

  return Array.from({ length: 7 }, (_, index) => {
    const value = new Date(anchorNoon);
    value.setUTCDate(anchorNoon.getUTCDate() - 6 + index);
    const date = value.toISOString().slice(0, 10);
    const weekday = new Intl.DateTimeFormat("en-PH", {
      weekday: "short",
      timeZone: "UTC",
    }).format(value);
    const monthDay = new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(value);
    return {
      date,
      dayLabel: weekday,
      label: `${weekday} ${monthDay}`,
    };
  });
};

interface HomeSuggestion {
  id: number;
  title: string;
  trigger: string;
  discount: string;
  expectedLift: string;
  confidence: string;
  reason: string;
  detailedExplanation: string;
}

interface HomeOverview {
  anchorDate: string | null;
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    retailRevenue: number;
    revenueChangePercent: number;
    ordersChangePercent: number;
    busiestSector: string;
    pendingSuggestions: number;
  };
  insight: string;
  omnichannelSeries: Array<{ hour: string; cafe: number; services: number; retail: number }>;
  sectorSummary: Array<{ sector: string; revenue: number; orders: number }>;
  channelSummary: Array<{ channel: string; revenue: number; count: number }>;
  channelBalance: Array<{ category: string; channel: string; physical: number; online: number; count: number }>;
  heatmapDays: Array<{ date: string; dayLabel: string; label: string }>;
  heatmap: Array<{ date?: string; dayOfWeek: number; dayLabel?: string; hourBucket: number; sector: string; revenue: number; intensity: number }>;
  suggestions: HomeSuggestion[];
  nextAction: HomeSuggestion | null;
}

export function Home() {
  const [timeRange, setTimeRange] = useState("today");
  const [globalDateRange, setGlobalDateRange] = useState("last-7-days");
  const [expandedSuggestions, setExpandedSuggestions] = useState<number[]>([]);
  const [homeOverview, setHomeOverview] = useState<HomeOverview | null>(null);
  const [homeLoading, setHomeLoading] = useState(false);
  const [homeError, setHomeError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("globalDateRange") || "last-7-days";
    setGlobalDateRange(saved);

    const handleGlobalDateChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setGlobalDateRange(customEvent.detail);
    };

    window.addEventListener("globalDateRangeChanged", handleGlobalDateChange);
    return () => {
      window.removeEventListener("globalDateRangeChanged", handleGlobalDateChange);
    };
  }, []);

  // Map globalDateRange changes to local timeRange state
  useEffect(() => {
    if (globalDateRange === "today" || globalDateRange === "yesterday") {
      setTimeRange("today");
    } else if (globalDateRange === "last-7-days") {
      setTimeRange("week");
    } else if (globalDateRange === "last-30-days" || globalDateRange === "last-90-days" || globalDateRange === "last-12-months") {
      setTimeRange("month");
    } else if (globalDateRange === "custom") {
      setTimeRange("custom");
    }
  }, [globalDateRange]);

  const handleLocalTimeRangeChange = (localVal: string) => {
    setTimeRange(localVal);
  };

  const toggleSuggestionExplanation = (id: number) => {
    setExpandedSuggestions(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    let active = true;
    setHomeLoading(true);
    getHomeOverview(globalDateRange)
      .then((data) => {
        if (!active) return;
        setHomeOverview(data);
        setHomeError(null);
      })
      .catch((error) => {
        if (!active) return;
        setHomeError(error instanceof Error ? error.message : "Unable to load Home analytics");
      })
      .finally(() => {
        if (active) setHomeLoading(false);
      });

    return () => {
      active = false;
    };
  }, [globalDateRange]);

  const formatCurrency = (value: number) =>
    `PHP ${Math.round(value || 0).toLocaleString()}`;

  const formatPercent = (value: number) =>
    `${value >= 0 ? "+" : ""}${Number(value || 0).toFixed(1)}%`;

  const scaledKPIs = useMemo(() => {
    const kpis = homeOverview?.kpis;
    const totalRevenue = kpis?.totalRevenue || 0;
    const retailRevenue =
      kpis?.retailRevenue ??
      homeOverview?.sectorSummary.find((item) => item.sector === "Retail")?.revenue ??
      0;
    const revChange = kpis?.revenueChangePercent || 0;
    const ordChange = kpis?.ordersChangePercent || 0;
    return {
      revenue: formatCurrency(totalRevenue),
      orders: (kpis?.totalOrders || 0).toLocaleString(),
      retail: formatCurrency(retailRevenue),
      retailPercent:
        totalRevenue > 0 ? `${((retailRevenue / totalRevenue) * 100).toFixed(1)}% of revenue` : "0.0% of revenue",
      revenuePercent: `${formatPercent(revChange)} vs previous period`,
      ordersPercent: `${formatPercent(ordChange)} vs previous period`,
      revenueColorClass: revChange >= 0 ? "text-green-600" : "text-rose-600",
      ordersColorClass: ordChange >= 0 ? "text-green-600" : "text-rose-600",
      busiestSector: kpis?.busiestSector || "None",
      pending: kpis?.pendingSuggestions || 0,
    };
  }, [homeOverview]);

  const dynamicOmnichannelData = homeOverview?.omnichannelSeries || [];
  const equilibriumData = homeOverview?.channelBalance || [];
  const clientHeatmapDays = useMemo(
    () => buildHeatmapDaysFromAnchor(homeOverview?.anchorDate),
    [homeOverview?.anchorDate],
  );
  const displayHeatmapDays = clientHeatmapDays;
  const suggestions = homeOverview?.suggestions || [];
  const heroDate = homeOverview?.anchorDate
    ? new Date(homeOverview.anchorDate).toLocaleDateString("en-PH", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Waiting for uploaded transactions";
  const legendData = useMemo(() => {
    const sectorTotal = (sector: string) =>
      homeOverview?.sectorSummary.find((item) => item.sector === sector)?.revenue || 0;
    const total = sectorTotal("Cafe") + sectorTotal("Services") + sectorTotal("Retail");
    return [
      { key: "cafe", label: "Cafe", color: "#F53799", value: sectorTotal("Cafe") },
      { key: "services", label: "Services", color: "#0EA5E9", value: sectorTotal("Services") },
      { key: "retail", label: "Retail", color: "#F59E0B", value: sectorTotal("Retail") },
    ].map((item) => ({
      ...item,
      total: formatCurrency(item.value),
      percent: total > 0 ? `${((item.value / total) * 100).toFixed(1)}%` : "0.0%",
    }));
  }, [homeOverview]);

  const [heatmapFilter, setHeatmapFilter] = useState("allsectors");
  const [visibleSeries, setVisibleSeries] = useState({
    cafe: true,
    services: true,
    retail: true,
  });
  const [approvedSuggestions, setApprovedSuggestions] = useState<number[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<number[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; type: ErrorType | null }>({
    isOpen: false,
    type: null,
  });
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; type: SuccessType | null }>({
    isOpen: false,
    type: null,
  });

  const scrollToSuggestions = () => {
    suggestionsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const openChatbot = () => {
    // Trigger chatbot open - the WOOFChatbot component listens to this event
    window.dispatchEvent(new CustomEvent("openWoofChatbot"));
  };

  const handleApprove = (id: number) => {
    setApprovedSuggestions((prev) => [...prev, id]);
    toast.success("Promotion approved and scheduled!", {
      description: "The live recommendation has been added to your review queue.",
    });
  };

  const handleDismiss = (id: number) => {
    setDismissedSuggestions((prev) => [...prev, id]);
    toast.info("Suggestion dismissed", {
      description: "WOOF will learn from this feedback.",
    });
  };

  const triggerConnectionLost = () => {
    window.dispatchEvent(new Event("simulateOffline"));
  };

  const handleExecuteNow = () => {
    const nextAction = homeOverview?.nextAction;
    if (!nextAction) {
      toast.info("No live action is currently queued.", {
        description: "Upload transaction data to generate Home recommendations.",
      });
      return;
    }
    handleApprove(nextAction.id);
  };

  const handleRefreshData = () => {
    setErrorModal({ isOpen: false, type: null });
    toast.info("Refreshing data...");
    setTimeout(() => {
      // Simulate successful data refresh by approving the suggestion that was blocked
      setApprovedSuggestions((prev) => {
        // If suggestion 2 isn't already approved, approve it
        if (!prev.includes(2)) {
          return [...prev, 2];
        }
        return prev;
      });
      toast.success("Data refreshed successfully!", {
        description: "The promotion has been approved and scheduled.",
      });
    }, 1000);
  };

  const toggleSeries = (series: keyof typeof visibleSeries) => {
    setVisibleSeries((prev) => ({ ...prev, [series]: !prev[series] }));
  };

  const getHeatmapColor = (value: number) => {
    if (value <= 0) return "#FFFFFF";
    if (value > 80) return "#F53799";
    if (value > 60) return "#FFD9EC";
    if (value > 40) return "#FFF2FA";
    return "#FFF7FB";
  };

  const getHeatmapValue = (day: { date: string; dayLabel: string }, hourLabel: string) => {
    const dayIndex = fallbackHeatmapDays.findIndex((item) => item.dayLabel === day.dayLabel);
    const mongoDay = dayIndex === 6 ? 1 : dayIndex + 2;
    const hour = Number(hourLabel.replace(/\D/g, ""));
    const hourBucket = hourLabel.includes("PM") && hour !== 12 ? hour + 12 : hour;
    const rows = (homeOverview?.heatmap || []).filter((row) => {
      const sectorMatches =
        heatmapFilter === "allsectors" ||
        row.sector.toLowerCase() === heatmapFilter;
      const dayMatches = day.date
        ? row.date
          ? row.date === day.date
          : row.dayLabel === day.dayLabel || row.dayOfWeek === mongoDay
        : row.dayLabel === day.dayLabel || row.dayOfWeek === mongoDay;
      return dayMatches && row.hourBucket === hourBucket && sectorMatches;
    });
    if (!rows.length) return 0;
    return rows.reduce((max, row) => Math.max(max, row.intensity), 0);
  };

  return (
    <div className="space-y-6 md:space-y-8 lg:space-y-12">
      {/* SECTION 1 — HERO BANNER */}
      <div
        className="rounded-2xl md:rounded-3xl overflow-hidden relative"
      >
        {/* Background Image covering full hero */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&h=600&fit=crop')",
          }}
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#223047]/95 via-[#223047]/85 to-[#223047]/70" />
        </div>

        <div className="relative z-10 p-5 md:p-8 lg:p-10">
          <div className="space-y-4 md:space-y-6">
            <div>
              <div className="text-sm md:text-base text-white/80 mb-1 md:mb-2">
                Good morning, Happy Tails
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-[40px] font-extrabold text-white leading-tight mb-2 md:mb-3">
                Today's Revenue Intelligence
              </h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-white/70">
                <span>{heroDate}</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">Lucena City, Philippines</span>
                <Badge variant="outline" className="gap-1.5 border-white/30 text-white">
                  <span>{homeOverview?.anchorDate ? "Live uploaded data" : "No uploaded data"}</span>
                </Badge>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              <Button
                onClick={scrollToSuggestions}
                className="bg-[#F53799] hover:bg-[#D42A7D] text-white rounded-full px-6"
              >
                View AI Suggestions
              </Button>
              <Button
                onClick={openChatbot}
                className="bg-white text-[#F53799] hover:bg-white/90 rounded-full px-6"
              >
                Ask WOOF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1.5 — DATA INGESTION CENTER */}
      <DataIngestion />
      {homeError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {homeError}
        </div>
      )}

      {/* SECTION 2 — PRIMARY KPI ROW */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6">
        <div className="mb-3 text-xs md:text-sm text-[#223047] opacity-60">
          Selected-period KPIs from uploaded transaction data
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Total Revenue Today */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#F53799] to-[#D42A7D] flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Total Revenue</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{scaledKPIs.revenue}</div>
              <div className={`text-xs ${scaledKPIs.revenueColorClass} font-medium hidden md:block`}>{scaledKPIs.revenuePercent}</div>
            </div>
          </div>

          {/* Omnichannel Orders */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#3AE4FA] to-[#5CE1E6] flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Orders</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{scaledKPIs.orders}</div>
              <div className={`text-xs ${scaledKPIs.ordersColorClass} font-medium hidden md:block`}>{scaledKPIs.ordersPercent}</div>
            </div>
          </div>

          {/* Retail Revenue */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#F53799] to-[#D42A7D] flex items-center justify-center flex-shrink-0">
              <PawPrint className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Retail</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{scaledKPIs.retail}</div>
              <Badge className="bg-[#3AE4FA] text-white hover:bg-[#3AE4FA] text-xs mt-1 hidden md:inline-flex">
                {scaledKPIs.retailPercent}
              </Badge>
            </div>
          </div>

          {/* WOOF Suggestions */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#3AE4FA] to-[#5CE1E6] flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">WOOF Suggestions</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{scaledKPIs.pending}</div>
              <Button
                onClick={scrollToSuggestions}
                size="sm"
                className="bg-[#F53799] hover:bg-[#D42A7D] text-white h-6 md:h-7 text-xs mt-1 px-2 md:px-3 hidden md:inline-flex"
              >
                Review
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3 — VISUAL RELIEF DIVIDER - AI INSIGHT WITH MASCOT */}
      <div
        className="rounded-2xl flex items-center justify-between px-4 md:px-8 py-4 relative overflow-hidden"
        style={{ background: "linear-gradient(to right, #FFF7FB, #FFF2FA)" }}
      >
        <div className="flex-1">
          <Badge variant="outline" className="text-xs mb-2">
            WOOF AI Insight
          </Badge>
          <p className="text-sm md:text-base italic text-[#223047] opacity-70" style={{ lineHeight: "1.6" }}>
            "{homeLoading ? "Loading live Home analytics..." : homeOverview?.insight || "Upload transaction data to activate live Home insights."}"
          </p>
        </div>
        <img
          src={homeInsightImg.src}
          alt="Home Insight"
          className="w-24 h-24 md:w-32 md:h-32 object-contain flex-shrink-0 ml-6"
        />
      </div>

      {/* SECTION 4 — OMNICHANNEL REVENUE STREAM */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              Omnichannel Revenue Accumulation
            </h2>
            <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
              Real-time revenue buildup across all sectors today
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {["Today", "Week", "Month", "Custom"].map((range) => (
              <Button
                key={range}
                size="sm"
                variant={timeRange === range.toLowerCase() ? "default" : "outline"}
                onClick={() => handleLocalTimeRangeChange(range.toLowerCase())}
                className={
                  timeRange === range.toLowerCase()
                    ? "bg-[#F53799] hover:bg-[#D42A7D]"
                    : "border-[#FFD9EC] hover:bg-[#FFF2FA]"
                }
              >
                {range}
              </Button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300} className="md:!h-[400px]">
          <AreaChart data={dynamicOmnichannelData}>
            <defs>
              <linearGradient key="cafeLuxe-gradient" id="cafeLuxe" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F53799" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#F53799" stopOpacity={0} />
              </linearGradient>
              <linearGradient key="servicesGrad-gradient" id="servicesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
              </linearGradient>
              <linearGradient key="retailGrad-gradient" id="retailGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#FFD9EC" vertical={false} />
            <XAxis dataKey="hour" stroke="#223047" style={{ fontSize: "12px" }} />
            <YAxis stroke="#223047" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #FFD9EC",
                borderRadius: "12px",
                padding: "12px",
              }}
            />
            {visibleSeries.cafe && (
              <Area
                key="cafe-area"
                type="monotone"
                dataKey="cafe"
                stroke="#F53799"
                strokeWidth={2.5}
                fill="url(#cafeLuxe)"
                animationDuration={800}
              />
            )}
            {visibleSeries.services && (
              <Area
                key="services-area"
                type="monotone"
                dataKey="services"
                stroke="#0EA5E9"
                strokeWidth={2.5}
                fill="url(#servicesGrad)"
                animationDuration={800}
              />
            )}
            {visibleSeries.retail && (
              <Area
                key="retail-area"
                type="monotone"
                dataKey="retail"
                stroke="#F59E0B"
                strokeWidth={2.5}
                fill="url(#retailGrad)"
                animationDuration={800}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 pt-4 border-t border-[#FFD9EC]">
          {legendData.map((sector) => (
            <button
              key={sector.key}
              onClick={() => toggleSeries(sector.key as keyof typeof visibleSeries)}
              className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg transition-all ${
                visibleSeries[sector.key as keyof typeof visibleSeries]
                  ? "bg-[#FFF2FA]"
                  : "opacity-40 hover:opacity-60"
              }`}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: sector.color }}
              />
              <div className="flex-1 text-left min-w-0">
                <div className="text-xs text-[#223047] opacity-60">{sector.label}</div>
                <div className="text-sm font-bold text-[#223047]">{sector.total}</div>
                <div className="text-xs text-[#223047] opacity-50">{sector.percent}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 5 — CHANNEL EQUILIBRIUM + SALES INTENSITY HEATMAP */}
      <div className="flex flex-col gap-4 md:gap-6">
        {/* Channel Equilibrium Monitor */}
        <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-5 md:space-y-7">
          <div>
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              Offline vs. Online Channel Balance
            </h2>
            <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
              POS compared against Shopee, TikTok, and PetHub revenue streams
            </p>
          </div>

          {equilibriumData.length === 0 && (
            <div className="rounded-xl border border-[#FFD9EC] bg-[#FFF7FB] p-4 text-sm text-[#223047] opacity-70">
              Upload POS, Shopee, TikTok, or PetHub transactions to compare channel revenue.
            </div>
          )}
          <ResponsiveContainer width="100%" height={250} className="md:!h-[300px]">
            <BarChart
              data={equilibriumData}
              layout="vertical"
              margin={{ top: 8, right: 40, bottom: 8, left: 32 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#FFD9EC" horizontal={false} />
              <XAxis type="number" stroke="#223047" style={{ fontSize: "12px" }} />
              <YAxis
                type="category"
                dataKey="category"
                stroke="#223047"
                width={160}
                style={{ fontSize: "12px" }}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(Number(value) || 0),
                  name === "physical" ? "Offline Channel (POS)" : "Digital Channels (Shopee + TikTok + PetHub)",
                ]}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #FFD9EC",
                  borderRadius: "12px",
                }}
              />
              <Legend
                formatter={(value) =>
                  value === "physical" ? "Offline Channel (POS)" : "Digital Channels (Shopee + TikTok + PetHub)"
                }
              />
              <Bar
                dataKey="physical"
                fill="#D42A7D"
                radius={[0, 6, 6, 0]}
                animationDuration={800}
              />
              <Bar
                dataKey="online"
                fill="#5CE1E6"
                radius={[0, 6, 6, 0]}
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sales Intensity Heatmap */}
        <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-5 md:space-y-7">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
                Sales Intensity Map
              </h2>
              <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
                Past 7 uploaded-data dates
              </p>
            </div>

            <div className="flex flex-wrap gap-2 md:justify-end">
              {["All Sectors", "Cafe", "Services", "Retail"].map((filter) => (
                <Button
                  key={filter}
                  size="sm"
                  variant={heatmapFilter === filter.toLowerCase().replace(" ", "") ? "default" : "outline"}
                  onClick={() => setHeatmapFilter(filter.toLowerCase().replace(" ", ""))}
                  className={
                    heatmapFilter === filter.toLowerCase().replace(" ", "")
                      ? "bg-[#F53799] hover:bg-[#D42A7D] text-xs"
                      : "border-[#FFD9EC] hover:bg-[#FFF2FA] text-xs"
                  }
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {heatmapHours.map((hour) => (
              <div key={hour} className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-3">
                <div className="text-xs text-[#223047] opacity-60">{hour}</div>
                <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                  {displayHeatmapDays.map((day) => {
                    const value = getHeatmapValue(day, hour);
                    return (
                      <div
                        key={`${hour}-${day.date || day.dayLabel}`}
                        className="h-8 md:h-10 lg:h-12 rounded border border-[#FFD9EC] cursor-pointer hover:ring-2 hover:ring-[#F53799] transition-all"
                        style={{ backgroundColor: getHeatmapColor(value) }}
                        title={`${day.label} ${hour}: ${value.toFixed(0)}% sales intensity`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 pt-1">
              <div aria-hidden="true" />
              <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                {displayHeatmapDays.map((day) => (
                  <div key={day.date || day.dayLabel} className="text-center text-[10px] md:text-xs text-[#223047] opacity-60">
                    {day.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6 — ACTIVE WOOF SUGGESTIONS PREVIEW */}
      <div ref={suggestionsRef} className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div>
          <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
            WOOF Autonomous Suggestions — Pending Review
          </h2>
          <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
            AI-generated promotion recommendations based on real-time pattern analysis
          </p>
        </div>

        <div className="flex gap-4 md:gap-6 overflow-x-auto pb-2">
          {suggestions.length === 0 && (
            <div className="w-full rounded-xl border border-[#FFD9EC] bg-[#FFF7FB] p-4 text-sm text-[#223047] opacity-70">
              Upload transaction data to generate live WOOF recommendations.
            </div>
          )}
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`flex-shrink-0 w-[280px] md:w-[320px] lg:w-[360px] bg-white border border-[#FFD9EC] rounded-2xl md:rounded-[20px] p-4 md:p-6 lg:p-7 space-y-3 md:space-y-4 transition-all ${
                approvedSuggestions.includes(suggestion.id)
                  ? "bg-green-50 border-green-300"
                  : dismissedSuggestions.includes(suggestion.id)
                  ? "opacity-40 line-through"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <h3 className="text-base font-bold text-[#223047] flex-1">
                  {suggestion.title}
                </h3>
                <Badge className="bg-[#3AE4FA] text-white hover:bg-[#3AE4FA] text-xs">
                  {suggestion.confidence}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-[#223047] opacity-60">
                  <span className="font-medium">Trigger:</span>
                  <span>{suggestion.trigger}</span>
                </div>
                <div className="flex items-center gap-2 text-[#223047] opacity-60">
                  <span className="font-medium">Discount:</span>
                  <span>{suggestion.discount}</span>
                </div>
              </div>

              <div className="text-3xl font-extrabold text-[#F53799]">
                {suggestion.expectedLift}
              </div>

              <p className="text-xs text-[#223047] opacity-50" style={{ lineHeight: "1.6" }}>
                {suggestion.reason}
              </p>

              {/* Collapsible Dropdown Explanation */}
              <div className="pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSuggestionExplanation(suggestion.id)}
                  className="w-full justify-between text-xs text-[#F53799] hover:bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg py-1 px-3 h-8"
                >
                  <span className="font-semibold">Explanation</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedSuggestions.includes(suggestion.id) ? "rotate-180" : ""}`} />
                </Button>
                {expandedSuggestions.includes(suggestion.id) && (
                  <div className="mt-2 p-2 bg-[#FFF7FB] rounded-lg border border-[#FFD9EC] text-xs text-[#223047] opacity-80 animate-in fade-in slide-in-from-top-1 duration-200" style={{ lineHeight: "1.6" }}>
                    {suggestion.detailedExplanation}
                  </div>
                )}
              </div>

              {!approvedSuggestions.includes(suggestion.id) &&
                !dismissedSuggestions.includes(suggestion.id) && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleApprove(suggestion.id)}
                      className="flex-1 bg-[#F53799] hover:bg-[#D42A7D]"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleDismiss(suggestion.id)}
                      variant="outline"
                      className="flex-1 border-[#FFD9EC]"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Dismiss
                    </Button>
                  </div>
                )}

              {approvedSuggestions.includes(suggestion.id) && (
                <div className="flex items-center justify-center gap-2 py-2 text-green-600 font-semibold">
                  <Check className="w-5 h-5" />
                  <span>Approved & Scheduled</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 7 — NEXT SCHEDULED ACTION + WOOF AI ENTRY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Next Scheduled Action */}
        <div className="bg-[#223047] text-white rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
          <div>
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold">Next Scheduled Action</h2>
            <p className="text-xs md:text-sm opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
              Automated promotion deployment
            </p>
          </div>

          <div className="text-3xl md:text-4xl lg:text-[48px] font-mono font-bold tracking-tight">
            {homeOverview?.nextAction ? "Ready" : "--:--"}
          </div>

          <div>
            <div className="text-lg font-semibold mb-1">
              {homeOverview?.nextAction?.title || "No live action queued"}
            </div>
            <p className="text-sm opacity-70" style={{ lineHeight: "1.6" }}>
              {homeOverview?.nextAction?.reason || "Upload transaction data to generate recommended actions."}
            </p>
          </div>

          <Badge className="bg-[#3AE4FA] text-white hover:bg-[#3AE4FA]">
            {homeOverview?.nextAction ? "Queued from live data" : "Waiting for data"}
          </Badge>

          <Button onClick={handleExecuteNow} className="w-full bg-[#F53799] hover:bg-[#D42A7D]">
            <Play className="w-4 h-4 mr-2" />
            Execute Now
          </Button>
        </div>

        {/* Ask WOOF AI */}
        <div
          className="rounded-2xl md:rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(to bottom right, #FFF7FB, #FFF2FA)",
          }}
        >
          {/* AI Business Partner Header */}
          <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 py-4 relative">
            <div className="flex-1">
              <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047] mb-1">
                Your AI Business Partner
              </h2>
              <p className="text-xs md:text-sm text-[#223047] opacity-60">
                Ask WOOF anything about your business
              </p>
            </div>
            <img
              src={homeAiImg.src}
              alt="AI Business Partner"
              className="w-24 h-24 md:w-32 md:h-32 object-contain flex-shrink-0 ml-6"
            />
          </div>

          {/* AI Content */}
          <div className="px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8 space-y-4">
            <div className="bg-white/60 border border-[#FFD9EC] rounded-xl p-4">
              <p className="text-sm text-[#223047] italic" style={{ lineHeight: "1.6" }}>
                "{homeOverview?.insight || "Upload transaction data and I can summarize what is happening across sectors."}"
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your question..."
                className="flex-1 px-4 py-2 border border-[#FFD9EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F53799] bg-white"
              />
              <Button className="bg-[#F53799] hover:bg-[#D42A7D]">
                Ask
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                "Explain today's forecast",
                "Best bundle right now",
                "Which channel is underperforming?",
              ].map((prompt) => (
                <button
                  key={prompt}
                  className="px-3 py-1.5 bg-white border border-[#FFD9EC] rounded-full text-xs text-[#223047] hover:bg-[#FFF2FA] hover:border-[#F53799] transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {errorModal.type && (
        <ErrorModal
          isOpen={errorModal.isOpen}
          onClose={() => setErrorModal({ isOpen: false, type: null })}
          errorType={errorModal.type}
          onRefresh={errorModal.type === "concurrent_modification" ? handleRefreshData : undefined}
        />
      )}

      {/* Success Modal */}
      {successModal.type && (
        <SuccessModal
          isOpen={successModal.isOpen}
          onClose={() => setSuccessModal({ isOpen: false, type: null })}
          successType={successModal.type}
        />
      )}

      {/* Demo: Connection Lost Button (for testing - can be removed) */}
      <button
        onClick={triggerConnectionLost}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 lg:left-[calc(50%+4rem)] lg:translate-x-0 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg opacity-20 hover:opacity-100 transition-opacity z-40"
        title="Simulate connection lost (Demo)"
      >
        Test Connection
      </button>
    </div>
  );
}
