import { useState, useRef, useEffect, useMemo } from "react";
import { PawPrint, DollarSign, ShoppingCart, Zap, Check, X, Play, ChevronDown } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import { ErrorModal, ErrorType } from "../components/ErrorModal";
import { SuccessModal, SuccessType } from "../components/SuccessModal";
import { DataIngestion } from "../components/DataIngestion";
import homeAiImg from "../../imports/no_bg_Home_2.png";
import homeInsightImg from "../../imports/no_bg_Home-3.png";

const omnichannelData = Array.from({ length: 13 }, (_, i) => ({
  hour: `${i + 8}:00`,
  cafe: Math.random() * 8000 + 2000,
  services: Math.random() * 5000 + 1000,
  retail: Math.random() * 4000 + 1000,
  online: Math.random() * 3000 + 500,
}));

const equilibriumData = [
  { category: "Pet Food", physical: 12500, online: 8200 },
  { category: "Grooming", physical: 9800, online: 3400 },
  { category: "Cafe Items", physical: 15200, online: 5600 },
  { category: "Accessories", physical: 6300, online: 11800 },
  { category: "Services", physical: 8900, online: 2100 },
];

const heatmapDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const heatmapHours = ["8AM", "10AM", "12PM", "2PM", "4PM", "6PM", "8PM"];

const suggestions = [
  {
    id: 1,
    title: "Cappuccino + Full Grooming Bundle",
    trigger: "Tomorrow 2:00 PM - 5:00 PM",
    discount: "15% off combo",
    expectedLift: "+₱4,250",
    confidence: "92%",
    reason: "Cafe-Services cross-sell pattern detected at this time window",
    detailedExplanation: "Our analysis shows that customers who book grooming appointments between 2:00 PM and 5:00 PM are 3x more likely to purchase a cappuccino if offered a discount. Deploying this bundle is expected to increase average order value by ₱180 per customer and fill idle cafe capacity during off-peak grooming hours.",
  },
  {
    id: 2,
    title: "Flash Sale: Premium Dog Food",
    trigger: "Today 6:00 PM",
    discount: "20% off",
    expectedLift: "+₱2,890",
    confidence: "87%",
    reason: "Stock expiring in 6 days. Prophet predicts -40% demand next week",
    detailedExplanation: "We currently have 12 units of Premium Dog Food (5kg) in stock that will expire in 6 days. Prophet forecasting model predicts a 40% decline in dog food demand next week. Implementing a 20% discount now will accelerate inventory clearance, generating ₱2,890 in revenue and preventing a total spoilage loss of ₱15,000.",
  },
  {
    id: 3,
    title: "Happy Hour: All Beverages",
    trigger: "Tomorrow 3:00 PM - 4:00 PM",
    discount: "Buy 1 Get 1",
    expectedLift: "+₱1,650",
    confidence: "84%",
    reason: "Traffic optimizer detected idle capacity window",
    detailedExplanation: "Historical data indicates a consistent 50% drop in foot traffic at the cafe on Thursday afternoons between 3:00 PM and 4:00 PM. A Buy 1 Get 1 happy hour promotion on all beverages will attract nearby pet owners, increase overall traffic by 25%, and drive secondary sales of high-margin treats.",
  },
];

export function Home() {
  const [timeRange, setTimeRange] = useState("today");
  const [globalDateRange, setGlobalDateRange] = useState("last-7-days");
  const [expandedSuggestions, setExpandedSuggestions] = useState<number[]>([]);

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
    let globalVal = "last-7-days";
    if (localVal === "today") globalVal = "today";
    else if (localVal === "week") globalVal = "last-7-days";
    else if (localVal === "month") globalVal = "last-30-days";
    else if (localVal === "custom") globalVal = "custom";
    
    localStorage.setItem("globalDateRange", globalVal);
    window.dispatchEvent(new CustomEvent("globalDateRangeChanged", { detail: globalVal }));
  };

  const toggleSuggestionExplanation = (id: number) => {
    setExpandedSuggestions(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const scaledKPIs = useMemo(() => {
    switch (globalDateRange) {
      case "today":
        return { revenue: "₱45,280", orders: "127", revenuePercent: "+12.3% ↑", ordersPercent: "+8.5% ↑" };
      case "yesterday":
        return { revenue: "₱42,150", orders: "118", revenuePercent: "+10.1% ↑", ordersPercent: "+7.2% ↑" };
      case "last-7-days":
        return { revenue: "₱316,960", orders: "889", revenuePercent: "+11.4% ↑", ordersPercent: "+8.1% ↑" };
      case "last-30-days":
        return { revenue: "₱1,358,400", orders: "3,810", revenuePercent: "+12.8% ↑", ordersPercent: "+8.3% ↑" };
      case "last-90-days":
        return { revenue: "₱4,075,200", orders: "11,430", revenuePercent: "+13.1% ↑", ordersPercent: "+8.6% ↑" };
      case "last-12-months":
        return { revenue: "₱16,527,200", orders: "46,355", revenuePercent: "+14.2% ↑", ordersPercent: "+9.1% ↑" };
      default:
        return { revenue: "₱45,280", orders: "127", revenuePercent: "+12.3% ↑", ordersPercent: "+8.5% ↑" };
    }
  }, [globalDateRange]);

  const dynamicOmnichannelData = useMemo(() => {
    const seedRandom = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return () => {
        const x = Math.sin(hash++) * 10000;
        return x - Math.floor(x);
      };
    };

    const rng = seedRandom(globalDateRange);
    
    if (globalDateRange === "today" || globalDateRange === "yesterday") {
      return Array.from({ length: 13 }, (_, i) => ({
        hour: `${i + 8}:00`,
        cafe: rng() * 8000 + 2000,
        services: rng() * 5000 + 1000,
        retail: rng() * 4000 + 1000,
        online: rng() * 3000 + 500,
      }));
    }
    
    const count = globalDateRange === "last-7-days" ? 7 : globalDateRange === "last-30-days" ? 30 : globalDateRange === "last-90-days" ? 90 : 12;
    const label = globalDateRange === "last-12-months" ? "Month" : "Day";
    
    return Array.from({ length: count }, (_, i) => ({
      hour: `${label} ${i + 1}`,
      cafe: rng() * 50000 + 15000,
      services: rng() * 40000 + 10000,
      retail: rng() * 30000 + 8000,
      online: rng() * 20000 + 5000,
    }));
  }, [globalDateRange]);

  const [heatmapFilter, setHeatmapFilter] = useState("all");
  const [visibleSeries, setVisibleSeries] = useState({
    cafe: true,
    services: true,
    retail: true,
    online: true,
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
    // Simulate concurrent modification error for suggestion 2
    if (id === 2) {
      setErrorModal({ isOpen: true, type: "concurrent_modification" });
      return;
    }

    // Simulate invalid action for suggestion 3
    if (id === 3) {
      setErrorModal({ isOpen: true, type: "invalid_action" });
      return;
    }

    setApprovedSuggestions((prev) => [...prev, id]);
    toast.success("Promotion approved and scheduled!", {
      description: "The bundle has been added to your active promotions.",
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
    setErrorModal({ isOpen: true, type: "permission_denied" });
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
    if (value > 80) return "#F53799";
    if (value > 60) return "#FFD9EC";
    if (value > 40) return "#FFF2FA";
    return "#FFF7FB";
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
                <span>Wednesday, April 15, 2026</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">Lucena City, Philippines</span>
                <Badge variant="outline" className="gap-1.5 border-white/30 text-white">
                  <span>☀️</span>
                  <span>28°C Sunny</span>
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

      {/* SECTION 2 — PRIMARY KPI ROW */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Total Revenue Today */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#F53799] to-[#D42A7D] flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Total Revenue</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{scaledKPIs.revenue}</div>
              <div className="text-xs text-green-600 font-medium hidden md:block">{scaledKPIs.revenuePercent}</div>
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
              <div className="text-xs text-green-600 font-medium hidden md:block">{scaledKPIs.ordersPercent}</div>
            </div>
          </div>

          {/* Busiest Sector */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#F53799] to-[#D42A7D] flex items-center justify-center flex-shrink-0">
              <PawPrint className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Busiest Sector</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">Cafe</div>
              <Badge className="bg-[#3AE4FA] text-white hover:bg-[#3AE4FA] text-xs mt-1 hidden md:inline-flex">
                Active Now
              </Badge>
            </div>
          </div>

          {/* Pending WOOF Actions */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#3AE4FA] to-[#5CE1E6] flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Pending</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">3</div>
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
            "Cafe sector showing 12% growth. Services utilization at 78%. Strong cross-sell opportunity detected between grooming and cafe."
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
              <linearGradient key="onlineGrad-gradient" id="onlineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
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
            {visibleSeries.online && (
              <Area
                key="online-area"
                type="monotone"
                dataKey="online"
                stroke="#7C3AED"
                strokeWidth={2.5}
                fill="url(#onlineGrad)"
                animationDuration={800}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 pt-4 border-t border-[#FFD9EC]">
          {[
            { key: "cafe", label: "Cafe", color: "#F53799", total: "₱18,450", percent: "40.8%" },
            { key: "services", label: "Services", color: "#0EA5E9", total: "₱14,230", percent: "31.4%" },
            { key: "retail", label: "Retail", color: "#F59E0B", total: "₱9,180", percent: "20.3%" },
            { key: "online", label: "Online", color: "#7C3AED", total: "₱3,420", percent: "7.5%" },
          ].map((sector) => (
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
              Diverging channels highlighted
            </p>
          </div>

          <ResponsiveContainer width="100%" height={250} className="md:!h-[300px]">
            <BarChart
              data={equilibriumData}
              layout="vertical"
              margin={{ top: 8, right: 40, bottom: 8, left: 24 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#FFD9EC" horizontal={false} />
              <XAxis type="number" stroke="#223047" style={{ fontSize: "12px" }} />
              <YAxis
                type="category"
                dataKey="category"
                stroke="#223047"
                style={{ fontSize: "12px" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #FFD9EC",
                  borderRadius: "12px",
                }}
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
                Past 7 Days
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
                  {heatmapDays.map((day) => {
                    const value = Math.random() * 100;
                    return (
                      <div
                        key={`${hour}-${day}`}
                        className="h-8 md:h-10 lg:h-12 rounded cursor-pointer hover:ring-2 hover:ring-[#F53799] transition-all"
                        style={{ backgroundColor: getHeatmapColor(value) }}
                        title={`${day} ${hour}: ${value.toFixed(0)}% capacity`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 pt-1">
              <div aria-hidden="true" />
              <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                {heatmapDays.map((day) => (
                  <div key={day} className="text-center text-xs text-[#223047] opacity-60">
                    {day}
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
            04:23:15
          </div>

          <div>
            <div className="text-lg font-semibold mb-1">
              Cappuccino + Grooming Bundle Launch
            </div>
            <p className="text-sm opacity-70" style={{ lineHeight: "1.6" }}>
              Automated bundle promotion targeting afternoon cross-sell opportunity
            </p>
          </div>

          <Badge className="bg-[#3AE4FA] text-white hover:bg-[#3AE4FA]">
            Queued
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
                "Your cafe sector is outperforming forecast by 12% today. I recommend extending happy hour to capture the afternoon momentum."
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
