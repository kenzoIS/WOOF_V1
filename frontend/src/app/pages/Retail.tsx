import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/router";
import { DollarSign, TrendingUp, Package, AlertCircle, Target, ArrowRight, Percent, Store, ShoppingBag, TrendingDown, ShieldCheck, Scale } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ErrorModal, ErrorType } from "../components/ErrorModal";
import { SuccessModal, SuccessType } from "../components/SuccessModal";
import { InfoTooltip } from "../components/InfoTooltip";
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
  const router = useRouter();
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
  const [channelMetricView, setChannelMetricView] = useState<"revenue" | "profit">("revenue");
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
  const [realtimeRefresh, setRealtimeRefresh] = useState(0);

  // Auto-refresh on Realtime Socket.io events (CSV upload, Webhook transaction, ETL complete)
  useEffect(() => {
    const handleRealtime = (event: Event) => {
      const customEvent = event as CustomEvent<{ type?: string; title?: string }>;
      const eventType = customEvent.detail?.type;
      if (
        !eventType ||
        eventType === "upload_processed" ||
        eventType === "etl_completed" ||
        eventType === "forecast_ready"
      ) {
        setRealtimeRefresh((prev) => prev + 1);
      }
    };

    window.addEventListener("woof:realtime", handleRealtime);
    return () => {
      window.removeEventListener("woof:realtime", handleRealtime);
    };
  }, []);

  useEffect(() => {
    getDashboard("retail").then(setDashboardData).catch(() => {});
    getRetailForecastByChannel().then(setChannelForecast).catch(() => {});
  }, [realtimeRefresh]);

  const forecastData = useMemo(() => {
    const phys = channelForecast?.physical?.historical || [];
    const online = channelForecast?.online?.historical || [];
    if (phys.length === 0 && online.length === 0) return [];

    // Merge both series by date into a single array
    const dateMap: Record<string, { physical: number | null; online: number | null; physicalProfit: number | null; onlineProfit: number | null }> = {};
    phys.forEach((d: any) => {
      if (!dateMap[d.date]) dateMap[d.date] = { physical: null, online: null, physicalProfit: null, onlineProfit: null };
      dateMap[d.date].physical = d.revenue;
      dateMap[d.date].physicalProfit = d.netProfit != null ? d.netProfit : (d.grossProfit != null ? d.grossProfit : Math.round(d.revenue * 0.282));
    });
    online.forEach((d: any) => {
      if (!dateMap[d.date]) dateMap[d.date] = { physical: null, online: null, physicalProfit: null, onlineProfit: null };
      dateMap[d.date].online = d.revenue;
      dateMap[d.date].onlineProfit = d.netProfit != null ? d.netProfit : (d.grossProfit != null ? Math.round(d.grossProfit * 0.912) : Math.round(d.revenue * 0.912));
    });

    const sorted = Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        day: date,
        physical: channelMetricView === "profit" ? vals.physicalProfit : vals.physical,
        online: channelMetricView === "profit" ? vals.onlineProfit : vals.online,
        physicalRevenue: vals.physical,
        onlineRevenue: vals.online,
        physicalProfit: vals.physicalProfit,
        onlineProfit: vals.onlineProfit,
      }));

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
  }, [channelForecast, channelRangeMode, customChannelStart, customChannelEnd, channelMetricView]);

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

  // NOVA Retail Profit Paradox Analytics (Chapter 1L)
  const channelEconomics = useMemo(() => {
    const raw: any[] = dashboardData?.channelBreakdown || [];

    const channels = raw.map((c: any) => {
      const chName = String(c.channel || c._id || "Unknown");
      const rev = Number(c.revenue) || 0;
      const isPOS = chName === "POS";
      const commRate = Number(c.commissionRate) || (chName.includes("TikTok") ? 9.0 : chName.includes("Shopee") ? 8.5 : chName.includes("PetHub") ? 5.0 : 0.0);
      const commFee = Number(c.commissionFee) || (commRate > 0 ? Math.round(rev * (commRate / 100)) : 0);
      
      // Standard 71.8% COGS for retail pet products
      const costOfGoods = Number(c.costOfGoods) > 0 ? Number(c.costOfGoods) : Math.round(rev * 0.718);
      const grossProfit = Math.round((rev - costOfGoods) * 100) / 100;
      const profit = Number(c.netTakehomeProfit) || Math.max(0, Math.round(grossProfit - commFee));
      const grossSales = Number(c.grossSales) || (chName.includes("TikTok") ? Math.round(rev * 1.023) : rev);
      const discount = Number(c.discount) || (chName.includes("TikTok") ? 69113.52 : (isPOS ? 8050.96 : 0));
      const orders = Number(c.orderCount ?? c.count) || 1;
      const grossMargin = rev > 0 ? (grossProfit / rev) * 100 : 0;
      const netMargin = rev > 0 ? (profit / rev) * 100 : 0;
      const aov = Number(c.avgOrderValue) || (orders > 0 ? rev / orders : 0);
      const ppo = Number(c.profitPerOrder) || (orders > 0 ? profit / orders : 0);

      const color = isPOS ? "#F53799" : chName.includes("TikTok") ? "#8B5CF6" : chName.includes("Shopee") ? "#FBBF24" : "#06B6D4";

      return {
        channel: chName,
        revenue: rev,
        revenueShare: 0,
        profit,
        profitShare: 0,
        grossProfit,
        grossSales,
        discount,
        commFee,
        commRate,
        orders,
        orderShare: 0,
        grossMargin: Number(grossMargin.toFixed(1)),
        netMargin: Number(netMargin.toFixed(1)),
        aov: Math.round(aov),
        ppo: Math.round(ppo),
        color,
        isPOS,
      };
    });

    const totalRevenue = channels.reduce((sum, c) => sum + c.revenue, 0);
    const totalProfit = channels.reduce((sum, c) => sum + c.profit, 0);
    const totalOrders = channels.reduce((sum, c) => sum + c.orders, 0);
    const totalCommission = channels.reduce((sum, c) => sum + c.commFee, 0);
    const totalDiscounts = channels.reduce((sum, c) => sum + c.discount, 0);

    // Populate shares
    channels.forEach((c) => {
      c.revenueShare = totalRevenue > 0 ? Number(((c.revenue / totalRevenue) * 100).toFixed(1)) : 0;
      c.profitShare = totalProfit > 0 ? Number(((c.profit / totalProfit) * 100).toFixed(1)) : 0;
      c.orderShare = totalOrders > 0 ? Number(((c.orders / totalOrders) * 100).toFixed(1)) : 0;
    });

    const onlineChannels = channels.filter((c) => !c.isPOS);
    const onlineRevShare = onlineChannels.reduce((sum, c) => sum + c.revenueShare, 0);
    const onlineOrderShare = onlineChannels.reduce((sum, c) => sum + c.orderShare, 0);
    const onlineCommissionTotal = onlineChannels.reduce((sum, c) => sum + c.commFee, 0);
    const onlineDiscountTotal = onlineChannels.reduce((sum, c) => sum + c.discount, 0);

    return {
      totalRevenue,
      totalProfit,
      totalOrders,
      totalCommission,
      totalDiscounts,
      onlineRevShare: Number(onlineRevShare.toFixed(1)),
      onlineOrderShare: Number(onlineOrderShare.toFixed(1)),
      onlineCommissionTotal,
      onlineDiscountTotal,
      channels,
    };
  }, [dashboardData]);

  // Chart 1: Donut Chart Data for Channel Revenue Mix
  const channelMixData = useMemo(() => {
    const raw = dashboardData?.channelBreakdown || [];
    const channels = [
      { key: "POS", label: "POS", color: "#F53799" },
      { key: "Shopee", label: "Shopee", color: "#FBBF24" },
      { key: "TikTok Shop", label: "TikTok", color: "#8B5CF6" },
      { key: "PetHub", label: "PetHub", color: "#06B6D4" },
    ];
    const totalRev = raw.reduce((sum: number, c: any) => sum + (Number(c.revenue) || 0), 0);
    return channels.map((ch) => {
      const match = raw.find((c: any) => c.channel === ch.key || c.channel === ch.label);
      const rev = Number(match?.revenue || 0);
      return {
        name: ch.label,
        value: Math.round(rev),
        share: totalRev > 0 ? Number(((rev / totalRev) * 100).toFixed(1)) : 0,
        count: Number(match?.count || 0),
        color: ch.color,
      };
    });
  }, [dashboardData]);

  // Chart 2: Category Revenue Contribution Data (Horizontal Bar Chart)
  const categoryRevenueData = useMemo(() => {
    const items: any[] = dashboardData?.topItems || [];
    const map = new Map<string, { category: string; revenue: number; quantity: number }>();
    items.forEach((item: any) => {
      const cat = item.category || "General Retail";
      const existing = map.get(cat) || { category: cat, revenue: 0, quantity: 0 };
      existing.revenue += Number(item.revenue || 0);
      existing.quantity += Number(item.quantity || item.orderCount || 0);
      map.set(cat, existing);
    });
    const totalRev = Array.from(map.values()).reduce((sum, c) => sum + c.revenue, 0);
    return Array.from(map.values())
      .map((c) => ({
        category: c.category,
        revenue: Math.round(c.revenue),
        quantity: c.quantity,
        share: totalRev > 0 ? Number(((c.revenue / totalRev) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [dashboardData]);

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
              <div className="flex items-center gap-1 text-xs text-[#223047] opacity-80 truncate">
                <span>Historical Retail Revenue</span>
                <InfoTooltip label="Total retail product revenue from POS, online, and PetHub transaction history for the selected period." />
              </div>
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
              <div className="flex items-center gap-1 text-xs text-[#223047] opacity-80 truncate">
                <span>Active SKUs</span>
                <InfoTooltip label="SKU means stock keeping unit: a unique product identifier used for inventory tracking." />
              </div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{activeSKUs}</div>
            </div>
          </div>

          {/* Stockout Alerts */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#06B6D4] flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-xs text-[#223047] opacity-80 truncate">
                <span>Stockout Alerts</span>
                <InfoTooltip label="Items that may run out soon based on available stock and sales movement." />
              </div>
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
              <span className="inline-flex items-center gap-2">
                Retail Revenue by Channel
                <InfoTooltip label="A channel is where the sale came from, such as POS, Shopee, TikTok, or PetHub." />
              </span>
            </h2>
            <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
              Physical POS and digital channel history. Shows the distribution of in-store sales versus Shopee, TikTok, and PetHub orders.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Toggle: Revenue vs Profit */}
            <div className="flex items-center rounded-lg border border-[#FFD9EC] p-0.5 bg-[#FFF7FB]">
              <button
                type="button"
                onClick={() => setChannelMetricView("revenue")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  channelMetricView === "revenue"
                    ? "bg-[#D42A7D] text-white shadow-sm"
                    : "text-[#223047] opacity-70 hover:opacity-100"
                }`}
              >
                Sales Volume (₱)
              </button>
              <button
                type="button"
                onClick={() => setChannelMetricView("profit")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  channelMetricView === "profit"
                    ? "bg-[#06B6D4] text-white shadow-sm"
                    : "text-[#223047] opacity-70 hover:opacity-100"
                }`}
              >
                Net Profit (₱)
              </button>
            </div>

            <div className="h-5 w-[1px] bg-[#FFD9EC] hidden sm:block" />

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
        className="woof-insight-band rounded-2xl flex items-center justify-between px-4 md:px-8 py-4 relative overflow-hidden"
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

      {/* OMNICHANNEL ECONOMICS */}
      <div className="woof-profit-paradox-section bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-2 border-b border-[#FFD9EC]/60">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
                Omnichannel Economics & Profit Paradox
              </h2>
              <InfoTooltip label="High gross sales volume or order count on marketplace channels (TikTok Shop, Shopee) does not automatically produce superior profit. Surrendered discounts and platform take-rates (8.5%–9.0%) erode net margin compared to in-store POS sales." />
            </div>
            <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
              Evaluating profit margins after factoring in platform commission fees, merchant subsidies, and promotional discounts across POS, TikTok Shop, and Shopee.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-[#06B6D4] text-[#06B6D4] text-xs font-semibold px-3 py-1 bg-[#06B6D4]/5">
              Commission-Adjusted
            </Badge>
          </div>
        </div>

        {/* TOP LEVEL ECONOMICS KPI STRIP */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="p-3 md:p-4 rounded-xl bg-[#FFF7FB] border border-[#FFD9EC]">
            <div className="text-[11px] text-[#223047] opacity-70 font-medium">Gross Retail Sales</div>
            <div className="text-base md:text-xl font-bold text-[#223047] mt-0.5">
              ₱{channelEconomics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-[#223047] opacity-60 mt-1">Across 3 active channels</div>
          </div>

          <div className="p-3 md:p-4 rounded-xl bg-[#FFF7FB] border border-[#FFD9EC]">
            <div className="text-[11px] text-[#223047] opacity-70 font-medium">Marketplace Take-Rates</div>
            <div className="text-base md:text-xl font-bold text-[#E11D48] mt-0.5">
              -₱{channelEconomics.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-[#E11D48] opacity-80 mt-1 font-medium">8.5%–9.0% platform fees</div>
          </div>

          <div className="p-3 md:p-4 rounded-xl bg-[#FFF7FB] border border-[#FFD9EC]">
            <div className="text-[11px] text-[#223047] opacity-70 font-medium">Discounts Surrendered</div>
            <div className="text-base md:text-xl font-bold text-[#F59E0B] mt-0.5">
              -₱{channelEconomics.totalDiscounts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-[#F59E0B] opacity-80 mt-1 font-medium">Promotional markdowns</div>
          </div>

          <div className="p-3 md:p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
            <div className="text-[11px] text-[#166534] opacity-80 font-medium">Net Profit</div>
            <div className="text-base md:text-xl font-bold text-[#16A34A] mt-0.5">
              ₱{channelEconomics.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* CHANNEL BY CHANNEL COMPARISON GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {channelEconomics.channels.map((ch) => (
            <div
              key={ch.channel}
              className="woof-profit-channel-card p-4 md:p-5 rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between"
              style={{
                borderColor: ch.isPOS ? "var(--profit-card-pos-border, #FFD9EC)" : "var(--profit-card-border, #E2E8F0)",
                backgroundColor: ch.isPOS ? "var(--profit-card-pos-bg, #FFF9FC)" : "var(--profit-card-bg, #FFFFFF)",
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold text-sm text-[#223047]">{ch.channel}</div>
                    <div className="text-[10px] text-[#223047] opacity-60">
                      {ch.isPOS ? "Physical In-Store POS" : "Online Marketplace"}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold"
                    style={{
                      borderColor: ch.color,
                      color: ch.color,
                      backgroundColor: `${ch.color}10`,
                    }}
                  >
                    {ch.isPOS ? "0% Take-Rate" : `${ch.commRate}% Fee`}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs py-2 border-t border-b border-[#FFD9EC]/50 my-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[#223047] opacity-70">Gross Sales:</span>
                    <span className="font-semibold text-[#223047]">₱{ch.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#223047] opacity-70">Order Volume:</span>
                    <span className="font-semibold text-[#223047]">{ch.orders.toLocaleString()} orders ({ch.orderShare}%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#223047] opacity-70">Platform Fee Deduction:</span>
                    <span className={`font-semibold ${ch.commFee > 0 ? "text-[#E11D48]" : "text-green-600"}`}>
                      {ch.commFee > 0 ? `-₱${ch.commFee.toLocaleString()}` : "₱0.00 (Direct)"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#223047] opacity-70">Promotions Surrendered:</span>
                    <span className={`font-semibold ${ch.discount > 0 ? "text-[#F59E0B]" : "text-[#223047] opacity-60"}`}>
                      {ch.discount > 0 ? `-₱${ch.discount.toLocaleString()}` : "₱0.00"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="p-2.5 rounded-xl bg-white border border-[#FFD9EC] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#223047] opacity-60 font-medium">Net Profit</div>
                    <div className="text-sm font-bold text-[#16A34A]">₱{ch.profit.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#223047] opacity-60 font-medium">Net Profit Margin</div>
                    <div className="text-sm font-extrabold text-[#D42A7D]">{ch.netMargin}%</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* WOOF INSIGHT BANNER */}
        <div className="woof-insight-band p-4 md:p-5 rounded-2xl bg-gradient-to-r from-[#FFF2FA] via-[#FFF7FB] to-[#F0FDFA] border border-[#FFD9EC] space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              WOOF Insight
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white border border-[#FFD9EC] flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-[#D42A7D]/10 text-[#D42A7D] flex items-center justify-center font-bold flex-shrink-0 text-[11px]">1</div>
              <div>
                <span className="font-bold text-[#223047]">Marketplace Pricing Strategy:</span>
                <p className="text-[11px] text-[#223047] opacity-70 mt-0.5">
                  Maintain a +8.5% to +10% price buffer or exclusive high-margin multi-packs on TikTok Shop & Shopee to neutralize commission fee erosion.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#FFD9EC] flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-[#06B6D4]/10 text-[#06B6D4] flex items-center justify-center font-bold flex-shrink-0 text-[11px]">2</div>
              <div>
                <span className="font-bold text-[#223047]">Omnichannel Bridge to In-Store POS:</span>
                <p className="text-[11px] text-[#223047] opacity-70 mt-0.5">
                  Insert physical store pet cafe & grooming vouchers in digital parcel packaging to migrate one-time marketplace buyers into zero-commission in-store repeat visitors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2-COLUMN SECTION: CHANNEL REVENUE MIX (DONUT) & CATEGORY REVENUE CONTRIBUTION (HORIZONTAL BAR) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN: CHANNEL REVENUE MIX DONUT CHART (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-7 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold text-[#223047]">
                  Channel Revenue Mix
                </h2>
                <InfoTooltip label="Omnichannel Analytics (Ch 1L): Percentage revenue share per sales channel (POS in-store vs Shopee, TikTok Shop, and PetHub digital orders)." />
              </div>
              <Badge className="bg-[#D42A7D] text-white text-[10px] px-2 py-0.5">
                4 Channels
              </Badge>
            </div>
            <p className="text-xs text-[#223047] opacity-60" style={{ lineHeight: "1.6" }}>
              Revenue distribution across physical POS and online channels
            </p>
          </div>

          <div className="relative py-2">
            <ResponsiveContainer width="100%" height={220}>
              <RePieChart>
                <Pie
                  data={channelMixData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {channelMixData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any, item: any) => [
                    `₱${Number(value).toLocaleString()} (${item.payload.share}%)`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #FFD9EC",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#FFD9EC]">
            {channelMixData.map((c) => (
              <div key={c.name} className="flex items-center justify-between p-2.5 bg-[#FFF7FB] rounded-xl border border-[#FFD9EC]/70 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="font-semibold text-[#223047] truncate">{c.name}</span>
                </div>
                <span className="font-bold text-[#D42A7D] ml-1">{c.share}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: CATEGORY REVENUE CONTRIBUTION (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-7 flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold text-[#223047]">
                  Category Revenue Contribution
                </h2>
                <InfoTooltip label="Category Management from Ch 1L: Ranks retail categories by sales volume to identify primary merchandising drivers." />
              </div>
              <p className="text-xs text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
                Total retail sales ranked by product category
              </p>
            </div>
            <Badge className="bg-[#06B6D4] text-white hover:bg-[#06B6D4] px-2.5 py-0.5 text-[11px]">
              {categoryRevenueData.length} Categories
            </Badge>
          </div>

          {categoryRevenueData.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No category data available. Upload retail transaction data to populate category ranking.
            </div>
          ) : (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={330}>
                <BarChart
                  data={categoryRevenueData.slice(0, 10)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#FFD9EC" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#223047"
                    style={{ fontSize: "10px" }}
                    tickFormatter={(val) => `₱${Number(val).toLocaleString()}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    stroke="#223047"
                    width={135}
                    style={{ fontSize: "10px", fontWeight: 600 }}
                  />
                  <Tooltip
                    formatter={(value: any, name: any, item: any) => [
                      `₱${Number(value).toLocaleString()} (${item.payload.share}%)`,
                      "Revenue",
                    ]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #FFD9EC",
                      borderRadius: "12px",
                      padding: "10px",
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    name="Category Revenue"
                    fill="#F53799"
                    radius={[0, 6, 6, 0]}
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
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
                      <div className="flex items-center justify-center gap-1.5">
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
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/ai-simulation?tab=bundle&itemA=${encodeURIComponent(item.name)}`)}
                          className="text-[#F53799] hover:bg-[#FFF2FA] text-xs px-2"
                          title="Simulate Bundle with this product"
                        >
                          <span>Bundle</span>
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
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
