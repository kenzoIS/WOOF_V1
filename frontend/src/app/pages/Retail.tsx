import React, { useState, useMemo, useEffect } from "react";
import { DollarSign, TrendingUp, Package, AlertCircle, Target } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ErrorModal, ErrorType } from "../components/ErrorModal";
import { SuccessModal, SuccessType } from "../components/SuccessModal";
import { getDashboard, getRetailForecastByChannel } from "../lib/api";
import {
  HISTORY_START_DATE,
  INGESTED_HISTORY_END_DATE,
  filterByDateRange,
  parseCustomRange,
  parseGlobalRange,
  addDays,
  countDays,
} from "../lib/dateRanges";
import retailMascot from "../../imports/no_bg_Retail.png";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Slider } from "../components/ui/slider";
import { toast } from "sonner";

const inventoryItems = [
  { sku: "DOG-001", name: "Premium Dog Food 5kg", stock: 12, reorderPoint: 20, daysToExpiry: 45, velocity: "High", predictedStockout: 6, price: 1250, channel: "Both" },
  { sku: "CAT-002", name: "Cat Litter Premium 10L", stock: 28, reorderPoint: 15, daysToExpiry: 120, velocity: "Medium", predictedStockout: 14, price: 850, channel: "Physical" },
  { sku: "TOY-003", name: "Interactive Pet Toy", stock: 5, reorderPoint: 10, daysToExpiry: null, velocity: "Low", predictedStockout: 3, price: 450, channel: "Online" },
  { sku: "ACC-004", name: "Pet Collar Deluxe", stock: 34, reorderPoint: 12, daysToExpiry: null, velocity: "High", predictedStockout: 18, price: 320, channel: "Both" },
  { sku: "DOG-005", name: "Dental Chew Treats", stock: 8, reorderPoint: 25, daysToExpiry: 18, velocity: "High", predictedStockout: 4, price: 180, channel: "Physical" },
];

const spoilageRiskItems = [
  { name: "Premium Dog Food 5kg", daysLeft: 6, currentStock: 12, dailyVelocity: 2, spoilageRisk: 95, recommendedDiscount: 25 },
  { name: "Dental Chew Treats", daysLeft: 18, currentStock: 8, dailyVelocity: 1.2, spoilageRisk: 68, recommendedDiscount: 15 },
  { name: "Cat Treats Salmon", daysLeft: 22, currentStock: 15, dailyVelocity: 2.1, spoilageRisk: 45, recommendedDiscount: 10 },
];

// Fallback data for velocity / forecast

const retailSentimentData = [
  { name: "Positive", value: 72, color: "#06B6D4" },
  { name: "Neutral", value: 18, color: "#CCCCCC" },
  { name: "Negative", value: 10, color: "#F53799" },
];

const flaggedRetailReviews = [
  {
    platform: "Shopee",
    text: "Product arrived with missing accessories and the listing description was misleading.",
    date: "Apr 14, 2026",
    product: "Premium Dog Food 5kg",
    keywords: ["missing", "misleading"],
  },
  {
    platform: "Physical Store",
    text: "Shelf label was incorrect and the cashier gave conflicting pricing information.",
    date: "Apr 13, 2026",
    product: "Cat Litter Premium 10L",
    keywords: ["incorrect", "conflicting"],
  },
  {
    platform: "TikTok",
    text: "Packaging felt cheap and the purchase experience was slower than expected.",
    date: "Apr 12, 2026",
    product: "Pet Collar Deluxe",
    keywords: ["cheap", "slower"],
  },
];

const formatChartDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });
};

const formatGrowth = (current: number, previous: number) => {
  if (previous === 0) {
    return {
      text: current > 0 ? "+100.0% ↑" : "0.0%",
      className: current > 0 ? "text-xs text-green-600 font-medium hidden md:block" : "text-xs text-gray-500 font-medium hidden md:block",
    };
  }
  const change = ((current - previous) / previous) * 100;
  const absChange = Math.abs(change).toFixed(1);
  if (change > 0) {
    return {
      text: `+${absChange}% ↑`,
      className: "text-xs text-green-600 font-medium hidden md:block",
    };
  }
  if (change < 0) {
    return {
      text: `-${absChange}% ↓`,
      className: "text-xs text-rose-600 font-medium hidden md:block",
    };
  }
  return {
    text: "0.0%",
    className: "text-xs text-gray-500 font-medium hidden md:block",
  };
};

export function Retail() {
  const [filterVelocity, setFilterVelocity] = useState("all");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [expandedSKU, setExpandedSKU] = useState<string | null>(null);
  const [discountSlider, setDiscountSlider] = useState([25]);
  const [omnichannelMode, setOmnichannelMode] = useState<"overall" | "header">("overall");
  const [keywords, setKeywords] = useState(["missing", "misleading", "incorrect", "slow", "damaged"]);
  const [newKeyword, setNewKeyword] = useState("");
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; type: ErrorType | null }>({
    isOpen: false,
    type: null,
  });
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; type: SuccessType | null }>({
    isOpen: false,
    type: null,
  });
  const [reorderAttempts, setReorderAttempts] = useState(0);
  const [globalDateRange, setGlobalDateRange] = useState("last-7-days");
  const [channelRangeMode, setChannelRangeMode] = useState("last30days");
  const [customChannelStart, setCustomChannelStart] = useState("2026-05-01");
  const [customChannelEnd, setCustomChannelEnd] = useState(INGESTED_HISTORY_END_DATE);

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

  useEffect(() => {
    const customRange = parseCustomRange(globalDateRange);
    if (customRange) {
      setChannelRangeMode("custom");
      setCustomChannelStart(customRange.start);
      setCustomChannelEnd(
        customRange.end > INGESTED_HISTORY_END_DATE
          ? INGESTED_HISTORY_END_DATE
          : customRange.end,
      );
      return;
    }

    if (globalDateRange === "last-30-days" || globalDateRange === "last-90-days" || globalDateRange === "last-12-months") {
      setChannelRangeMode("last30days");
    } else if (globalDateRange === "last-7-days" || globalDateRange === "today" || globalDateRange === "yesterday") {
      setChannelRangeMode("last7days");
    }
  }, [globalDateRange]);

  // API data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [channelForecast, setChannelForecast] = useState<any>(null);

  useEffect(() => {
    getDashboard("retail").then(setDashboardData).catch(() => {});
    getRetailForecastByChannel().then(setChannelForecast).catch(() => {});
  }, []);

  const forecastData = useMemo(() => {
    const phys = channelForecast?.physical?.historical || [];
    const online = channelForecast?.online?.historical || [];
    if (phys.length === 0 && online.length === 0) return [];

    // Merge both series by date into a single array
    const dateMap: Record<string, { physical: number | null; online: number | null }> = {};
    phys.forEach((d: any) => {
      if (!dateMap[d.date]) dateMap[d.date] = { physical: null, online: null };
      dateMap[d.date].physical = d.revenue;
    });
    online.forEach((d: any) => {
      if (!dateMap[d.date]) dateMap[d.date] = { physical: null, online: null };
      dateMap[d.date].online = d.revenue;
    });

    const sorted = Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({ day: date, ...vals }));

    if (channelRangeMode === "custom") {
      return filterByDateRange(
        sorted,
        {
          start: customChannelStart,
          end:
            customChannelEnd >= customChannelStart
              ? customChannelEnd
              : customChannelStart,
          isCustom: true,
        },
      );
    }

    const sliceCount =
      channelRangeMode === "last7days"
        ? 7
        : channelRangeMode === "last14days"
          ? 14
          : 30;

    return sorted.slice(-sliceCount);
  }, [channelForecast, channelRangeMode, customChannelStart, customChannelEnd]);

  const kpis = dashboardData?.kpis || {};
  const aggregatedKpis = useMemo(() => {
    if (!channelForecast?.physical?.historical?.length) {
      return {
        totalRevenue: kpis?.totalRevenue || 0,
        revenueGrowth: { text: "0.0%", className: "text-xs text-gray-500 font-medium hidden md:block" },
      };
    }
    const latestHistoryDate =
      channelForecast.physical.historical[channelForecast.physical.historical.length - 1]?.date ||
      INGESTED_HISTORY_END_DATE;
    const range = parseGlobalRange(globalDateRange, latestHistoryDate);
    const physSliced = filterByDateRange(channelForecast.physical.historical, range);
    const onlineSliced = filterByDateRange(channelForecast.online?.historical || [], range);
    const physRevenue = physSliced.reduce((sum: number, d: any) => sum + d.revenue, 0);
    const onlineRevenue = onlineSliced.reduce((sum: number, d: any) => sum + d.revenue, 0);
    const totalRevenue = physRevenue + onlineRevenue;

    const dayCount = countDays(range.start, range.end);
    const previousEnd = addDays(range.start, -1);
    const previousStart = addDays(previousEnd, -(dayCount - 1));
    const prevRange = { start: previousStart, end: previousEnd, isCustom: range.isCustom };
    const physPrevSliced = filterByDateRange(channelForecast.physical.historical, prevRange);
    const onlinePrevSliced = filterByDateRange(channelForecast.online?.historical || [], prevRange);
    const physPrevRevenue = physPrevSliced.reduce((sum: number, d: any) => sum + d.revenue, 0);
    const onlinePrevRevenue = onlinePrevSliced.reduce((sum: number, d: any) => sum + d.revenue, 0);
    const previousRevenue = physPrevRevenue + onlinePrevRevenue;

    return {
      totalRevenue,
      revenueGrowth: formatGrowth(totalRevenue, previousRevenue),
    };
  }, [channelForecast, globalDateRange, kpis]);

  const retailRevenue = aggregatedKpis.totalRevenue ? `₱${aggregatedKpis.totalRevenue.toLocaleString()}` : "₱0";
  const activeSKUs = dashboardData?.topItems?.length || 0;
  const retailChannelPerformance = useMemo(() => {
    const getBaseRevenue = (channel: string) => {
      const row = dashboardData?.channelBreakdown?.find(
        (item: any) => item.channel === channel,
      );
      return Number(row?.revenue) || 0;
    };

    const basePos = getBaseRevenue("POS");
    const baseShopee = getBaseRevenue("Shopee");
    const baseTikTok = getBaseRevenue("TikTok Shop");
    const basePetHub = getBaseRevenue("PetHub");

    if (omnichannelMode === "header" && channelForecast?.physical?.historical) {
      const latestHistoryDate =
        channelForecast.physical.historical[channelForecast.physical.historical.length - 1]?.date ||
        INGESTED_HISTORY_END_DATE;
      const range = parseGlobalRange(globalDateRange, latestHistoryDate);
      const physSliced = filterByDateRange(channelForecast.physical.historical, range);
      const onlineSliced = filterByDateRange(channelForecast.online?.historical || [], range);

      const totalPhys = physSliced.reduce((sum: number, item: any) => sum + Number(item.revenue || 0), 0);
      const totalOnline = onlineSliced.reduce((sum: number, item: any) => sum + Number(item.revenue || 0), 0);

      const totalOnlineBase = baseShopee + baseTikTok + basePetHub;
      const shopeeRatio = totalOnlineBase ? baseShopee / totalOnlineBase : 0.33;
      const tiktokRatio = totalOnlineBase ? baseTikTok / totalOnlineBase : 0.33;
      const pethubRatio = totalOnlineBase ? basePetHub / totalOnlineBase : 0.34;

      return [
        {
          sector: "Retail",
          pos: Math.round(totalPhys),
          shopee: Math.round(totalOnline * shopeeRatio),
          tiktok: Math.round(totalOnline * tiktokRatio),
          pethub: Math.round(totalOnline * pethubRatio),
        },
      ];
    }

    return [
      {
        sector: "Retail",
        pos: basePos,
        shopee: baseShopee,
        tiktok: baseTikTok,
        pethub: basePetHub,
      },
    ];
  }, [dashboardData, omnichannelMode, channelForecast, globalDateRange]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleReorderNow = (sku: string, name: string) => {
    // Simulate rate limiting after 3 attempts
    if (reorderAttempts >= 3) {
      setErrorModal({ isOpen: true, type: "rate_limit" });
      return;
    }

    // Simulate payment failure for DOG-005
    if (sku === "DOG-005") {
      setErrorModal({ isOpen: true, type: "payment_failed" });
      setReorderAttempts(prev => prev + 1);
      return;
    }

    setReorderAttempts(prev => prev + 1);
    toast.success("Reorder initiated", {
      description: `Purchase order created for ${name}`,
    });
  };

  const handleActivateDiscount = (name: string, discount: number) => {
    // Simulate data corruption for the first item
    if (name === "Premium Dog Food 5kg") {
      setErrorModal({ isOpen: true, type: "data_corruption" });
      return;
    }

    toast.success("Flash sale activated!", {
      description: `${discount}% discount applied to ${name}`,
    });
  };

  const handleContactSupport = () => {
    toast.success("Support ticket created. Our team will contact you within 24 hours.");
    window.open("mailto:support@woofai.com?subject=Data Corruption Issue - Retail&body=I need assistance with a data integrity issue in my Retail dashboard.", "_blank");
  };

  const handleRetryPayment = () => {
    setErrorModal({ isOpen: false, type: null });
    toast.info("Retrying payment with alternative method...");
    setTimeout(() => {
      setSuccessModal({ isOpen: true, type: "payment_success" });
    }, 1500);
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword("");
      toast.success("Keyword added");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
    toast.info("Keyword removed");
  };

  const getVelocityColor = (velocity: string) => {
    if (velocity === "High") return "bg-green-500";
    if (velocity === "Medium") return "bg-yellow-500";
    return "bg-red-500";
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 80) return "text-red-600";
    if (risk >= 50) return "text-orange-600";
    return "text-yellow-600";
  };

  const filteredInventoryItems = useMemo(() => {
    if (filterVelocity === "all") return inventoryItems;
    if (filterVelocity === "critical") return inventoryItems.filter(item => item.stock < item.reorderPoint);
    return inventoryItems.filter(item => item.velocity.toLowerCase() === filterVelocity);
  }, [filterVelocity]);

  return (
    <div className="space-y-6 md:space-y-8 lg:space-y-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-3 md:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl lg:text-[36px] font-extrabold text-[#223047]">
            Retail Intelligence Center
          </h1>
          <p className="text-sm md:text-base text-[#223047] opacity-60 mt-1 md:mt-2" style={{ lineHeight: "1.6" }}>
            Inventory management and omnichannel performance tracking
          </p>
        </div>
        <Badge className="bg-[#D42A7D] text-white hover:bg-[#D42A7D] px-3 md:px-4 py-1 text-xs md:text-sm flex-shrink-0">
          Retail Sector
        </Badge>
      </div>

      {/* KPI ROW */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* Retail Revenue Today */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#F53799] to-[#D42A7D] flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Historical Retail Revenue</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{retailRevenue}</div>
              <div className={aggregatedKpis.revenueGrowth.className}>{aggregatedKpis.revenueGrowth.text}</div>
            </div>
          </div>

          {/* Active SKUs */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#06B6D4] flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Active SKUs</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{activeSKUs}</div>
            </div>
          </div>

          {/* Stockout Alerts */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#06B6D4] flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Stockout Alerts</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">5</div>
              <Button size="sm" className="bg-[#D42A7D] hover:bg-[#F53799] text-white h-6 md:h-7 text-xs mt-1 px-2 md:px-3 hidden md:inline-flex">
                Review
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* RETAIL REVENUE BY CHANNEL */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              Retail Revenue by Channel
            </h2>
            <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
              Physical POS and digital channel history. Shows the distribution of in-store sales versus Shopee, TikTok, and PetHub orders.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["last30days", "Last 30 Days"],
              ["last14days", "Last 14 Days"],
              ["last7days", "Last 7 Days"],
              ["custom", "Custom"],
            ].map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                variant={channelRangeMode === value ? "default" : "outline"}
                onClick={() => setChannelRangeMode(value)}
                className={
                  channelRangeMode === value
                    ? "bg-[#D42A7D] hover:bg-[#F53799] text-xs"
                    : "border-[#FFD9EC] hover:bg-[#FFF2FA] text-xs"
                }
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {channelRangeMode === "custom" && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#FFD9EC] bg-[#FFF7FB] p-3">
            <input
              type="date"
              min={HISTORY_START_DATE}
              max={INGESTED_HISTORY_END_DATE}
              value={customChannelStart}
              onChange={(event) => setCustomChannelStart(event.target.value)}
              className="h-9 rounded-md border border-[#FFD9EC] px-2 text-xs text-[#223047] focus:outline-none focus:ring-2 focus:ring-[#D42A7D]"
            />
            <input
              type="date"
              min={customChannelStart}
              max={INGESTED_HISTORY_END_DATE}
              value={customChannelEnd}
              onChange={(event) => setCustomChannelEnd(event.target.value)}
              className="h-9 rounded-md border border-[#FFD9EC] px-2 text-xs text-[#223047] focus:outline-none focus:ring-2 focus:ring-[#D42A7D]"
            />
            <span className="text-xs text-[#223047] opacity-60">
              Retail is descriptive, so custom dates are limited to Mar 2021 through May 2026.
            </span>
          </div>
        )}

        <ResponsiveContainer width="100%" height={280} className="md:!h-[360px]">
          <LineChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#FFD9EC" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#223047"
              tickFormatter={formatChartDate}
              minTickGap={28}
              interval="preserveStartEnd"
              style={{ fontSize: "10px" }}
            />
            <YAxis 
              stroke="#223047" 
              style={{ fontSize: "10px" }} 
              tickFormatter={(value) => `₱${Number(value).toLocaleString()}`}
            />
            <Tooltip
              labelFormatter={(label) => formatChartDate(String(label))}
              formatter={(value: any, name: any) => [`₱${Number(value).toLocaleString()}`, name]}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #FFD9EC",
                borderRadius: "12px",
              }}
            />
            <Line
              key="line-physical-wide"
              type="monotone"
              dataKey="physical"
              stroke="#D42A7D"
              strokeWidth={2.5}
              dot={false}
              animationDuration={800}
              name="Physical (POS)"
            />
            <Line
              key="line-online-wide"
              type="monotone"
              dataKey="online"
              stroke="#06B6D4"
              strokeWidth={2.5}
              dot={false}
              animationDuration={800}
              name="Digital (Shopee/TikTok/PetHub)"
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="flex flex-wrap justify-center gap-4 md:gap-6 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#D42A7D] rounded-full" />
            <span className="text-xs">Physical (POS)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#06B6D4] rounded-full" />
            <span className="text-xs">Digital (Shopee/TikTok/PetHub)</span>
          </div>
        </div>
      </div>
      {/* VISUAL RELIEF DIVIDER - AI INSIGHT WITH MASCOT */}
      <div
        className="rounded-2xl flex items-center justify-between px-4 md:px-8 py-4 relative overflow-hidden"
        style={{ background: "linear-gradient(to right, #FFF7FB, #FFF2FA)" }}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              WOOF Insight
            </Badge>
          </div>
          <p className="text-sm md:text-base italic text-[#223047] opacity-70" style={{ lineHeight: "1.6" }}>
            {dashboardData?.topItems?.[0]
              ? `${dashboardData.topItems[0].name} leads Retail sales at ₱${dashboardData.topItems[0].revenue.toLocaleString()} across ${dashboardData.topItems[0].orderCount || dashboardData.topItems[0].quantity || 0} units.`
              : aggregatedKpis.totalRevenue > 0
                ? `Retail revenue generated ₱${aggregatedKpis.totalRevenue.toLocaleString()} across physical and digital channels.`
                : "Upload Retail POS or e-commerce transaction data to activate live item insights."}
          </p>
        </div>
        <img
          src={retailMascot.src}
          alt="Retail Mascot"
          className="w-24 h-24 md:w-32 md:h-32 object-contain flex-shrink-0 ml-6"
        />
      </div>

      {/* INVENTORY HEALTH MONITOR */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
                Inventory Health Monitor
              </h2>
              <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
                Stock levels and predicted stockout dates
              </p>
            </div>
            <select
              value={filterVelocity}
              onChange={(e) => setFilterVelocity(e.target.value)}
              className="px-3 py-1.5 border border-[#FFD9EC] rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#D42A7D] w-full sm:w-auto"
            >
              <option value="all">All Items</option>
              <option value="high">High Velocity</option>
              <option value="medium">Medium Velocity</option>
              <option value="low">Low Velocity</option>
              <option value="critical">Critical Stock</option>
            </select>
          </div>

          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-[#FFF2FA] text-xs md:text-sm"
                  onClick={() => handleSort("name")}
                >
                  Product {sortColumn === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-[#FFF2FA] text-center text-xs md:text-sm"
                  onClick={() => handleSort("stock")}
                >
                  Stock {sortColumn === "stock" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="text-center text-xs md:text-sm hidden md:table-cell">Velocity</TableHead>
                <TableHead className="text-center text-xs md:text-sm">Stockout</TableHead>
                <TableHead className="text-center text-xs md:text-sm">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventoryItems.map((item) => (
                <React.Fragment key={item.sku}>
                  <TableRow
                    className="cursor-pointer hover:bg-[#FFF2FA]"
                    onClick={() => setExpandedSKU(expandedSKU === item.sku ? null : item.sku)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-semibold text-[#223047] text-sm md:text-base">{item.name}</div>
                        <div className="text-xs text-[#223047] opacity-50">{item.sku}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className={`font-bold text-sm md:text-base ${item.stock < item.reorderPoint ? "text-red-600" : ""}`}>
                          {item.stock}
                        </span>
                        <span className="text-xs opacity-50">/ {item.reorderPoint}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center hidden md:table-cell">
                      <div className={`w-2 h-2 rounded-full mx-auto ${getVelocityColor(item.velocity)}`} />
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`text-sm md:text-base ${item.predictedStockout < 7 ? "text-red-600 font-bold" : ""}`}>
                        {item.predictedStockout}d
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.stock < item.reorderPoint ? (
                        <Button
                          onClick={() => handleReorderNow(item.sku, item.name)}
                          size="sm"
                          className="bg-[#D42A7D] hover:bg-[#F53799] text-xs"
                        >
                          Reorder
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="border-[#FFD9EC] text-xs">
                          View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedSKU === item.sku && (
                    <TableRow>
                      <TableCell colSpan={5} className="bg-[#FFF7FB]">
                        <div className="p-3 md:p-4 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          <div>
                            <div className="text-xs text-[#223047] opacity-60 mb-2">14-Day Sales Trend</div>
                            <ResponsiveContainer width="100%" height={100} className="md:!h-[120px]">
                              <LineChart
                                data={Array.from({ length: 14 }, (_, i) => ({
                                  day: i + 1,
                                  units: Math.floor(Math.random() * 10 + 2),
                                }))}
                              >
                                <Line type="monotone" dataKey="units" stroke="#D42A7D" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs md:text-sm">
                              <span className="opacity-60">Price:</span>
                              <span className="font-semibold">₱{item.price}</span>
                            </div>
                            <div className="flex justify-between text-xs md:text-sm">
                              <span className="opacity-60">Channel:</span>
                              <span className="font-semibold">{item.channel}</span>
                            </div>
                            <div className="flex justify-between text-xs md:text-sm">
                              <span className="opacity-60">Reorder Point:</span>
                              <span className="font-semibold">{item.reorderPoint} units</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
          </div>
        </div>


      {/* OMNICHANNEL PERFORMANCE */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              Omnichannel Performance by Sectors
            </h2>
            <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
              Retail sector revenue distribution across POS, Shopee, TikTok, and PetHub
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-[#FFD9EC] bg-[#FFF7FB] p-1">
            {[
              ["overall", "Overall"],
              ["header", "Header Filter"],
            ].map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                variant={omnichannelMode === value ? "default" : "ghost"}
                onClick={() => setOmnichannelMode(value as "overall" | "header")}
                className={
                  omnichannelMode === value
                    ? "h-8 bg-[#D42A7D] hover:bg-[#D42A7D] text-xs text-white"
                    : "h-8 text-xs hover:bg-[#FFF2FA]"
                }
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300} className="md:!h-[400px]">
          <BarChart data={retailChannelPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="#FFD9EC" vertical={false} />
            <XAxis dataKey="sector" stroke="#223047" style={{ fontSize: "10px" }} />
            <YAxis stroke="#223047" style={{ fontSize: "10px" }} />
            <Tooltip
              formatter={(value: any, name: any) => [`₱${Number(value).toLocaleString()}`, name]}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #FFD9EC",
                borderRadius: "12px",
                padding: "12px",
              }}
            />
            <Bar key="pos-bar" dataKey="pos" name="POS" fill="#F53799" radius={[6, 6, 0, 0]} animationDuration={800} />
            <Bar key="shopee-bar" dataKey="shopee" name="Shopee" fill="#FBBF24" radius={[6, 6, 0, 0]} animationDuration={800} />
            <Bar key="tiktok-bar" dataKey="tiktok" name="TikTok" fill="#8B5CF6" radius={[6, 6, 0, 0]} animationDuration={800} />
            <Bar key="pethub-bar" dataKey="pethub" name="PetHub" fill="#06B6D4" radius={[6, 6, 0, 0]} animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>

        <div className="flex flex-wrap justify-center gap-4 md:gap-8 pt-2 md:pt-4">
          {[
            { label: "POS", color: "#F53799" },
            { label: "Shopee", color: "#FBBF24" },
            { label: "TikTok", color: "#8B5CF6" },
            { label: "PetHub", color: "#06B6D4" },
          ].map((channel) => (
            <div key={channel.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channel.color }} />
              <span className="text-xs md:text-sm text-[#223047]">{channel.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error Modal */}
      {errorModal.type && (
        <ErrorModal
          isOpen={errorModal.isOpen}
          onClose={() => {
            setErrorModal({ isOpen: false, type: null });
            if (errorModal.type === "rate_limit") {
              setReorderAttempts(0);
            }
          }}
          errorType={errorModal.type}
          onRetry={errorModal.type === "payment_failed" ? handleRetryPayment : undefined}
          onContactSupport={errorModal.type === "data_corruption" ? handleContactSupport : undefined}
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
    </div>
  );
}
