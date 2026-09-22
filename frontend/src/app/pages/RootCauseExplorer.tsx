import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import {
  HelpCircle,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CloudRain,
  Package,
  ShoppingBag,
  Store,
  DollarSign,
  ChevronRight,
  Filter,
  Calendar,
  Layers,
  Percent,
  Tag,
  Clock,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Zap,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { InfoTooltip } from "../components/InfoTooltip";
import { GenAiExplanationCard } from "../components/GenAiExplanationCard";
import { KpiDetailModal, KpiDetailData } from "../components/KpiDetailModal";
import { getDashboard, getForecast, getRetailForecastByChannel } from "../lib/api";
import mascotImg from "../../imports/no_bg_Insight.png";
import {
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

type DimensionTab =
  | "waterfall"
  | "channel"
  | "category"
  | "product"
  | "stockouts"
  | "weather"
  | "promotion"
  | "discount";

export function RootCauseExplorer() {
  const router = useRouter();
  const [selectedKpi, setSelectedKpi] = useState<KpiDetailData | null>(null);
  const [activeTab, setActiveTab] = useState<DimensionTab>("waterfall");
  const [sectorFilter, setSectorFilter] = useState<"all" | "cafe" | "services" | "retail">("all");
  const [periodFilter, setPeriodFilter] = useState<"last30" | "last90" | "ytd">("last30");
  const [loading, setLoading] = useState(true);

  // Data states
  const [cafeData, setCafeData] = useState<any>(null);
  const [servicesData, setServicesData] = useState<any>(null);
  const [retailData, setRetailData] = useState<any>(null);
  const [retailChannels, setRetailChannels] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      getDashboard("cafe").then(setCafeData).catch(() => {}),
      getDashboard("services").then(setServicesData).catch(() => {}),
      getDashboard("retail").then(setRetailData).catch(() => {}),
      getRetailForecastByChannel().then(setRetailChannels).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [periodFilter, sectorFilter]);

  // Derived baseline vs target values
  const baseRevenue = 396000;
  const currentRevenue = 347500;
  const totalVariance = currentRevenue - baseRevenue; // -48,500 (-12.2%)

  // Contribution breakdown model (8 dimensions)
  const contributionDrivers = [
    {
      id: "stockouts",
      title: "Stock Availability & Stockouts",
      impact: -18430,
      pctOfVariance: 38.0,
      color: "#EF4444",
      icon: Package,
      summary: "3 key retail items experienced 12 out-of-stock days during high-demand weekends.",
      actionableAdvice: "Increase reorder buffer for Top 3 SKUs and set auto-reorder triggers at 25 units.",
    },
    {
      id: "weather",
      title: "Weather & Heavy Rainfall",
      impact: -12100,
      pctOfVariance: 25.0,
      color: "#3B82F6",
      icon: CloudRain,
      summary: "4 days of heavy monsoon rain reduced walk-in cafe foot traffic by ~34%.",
      actionableAdvice: "Activate rainy day delivery vouchers (+15% discount on Shopee/TikTok) to offset store drop.",
    },
    {
      id: "promotion",
      title: "Expired Promo Campaigns",
      impact: -9720,
      pctOfVariance: 20.0,
      color: "#8B5CF6",
      icon: Tag,
      summary: "Expiration of 'Summer Treat Bundle' promotion dropped cafe addon conversions.",
      actionableAdvice: "Relaunch 'Monsoon Warmup Bundle' (Coffee + Pastry combo at ₱220).",
    },
    {
      id: "discount",
      title: "Margin Surrender (Discounts)",
      impact: -8250,
      pctOfVariance: 17.0,
      color: "#F59E0B",
      icon: Percent,
      summary: "Higher reliance on platform flash vouchers eroded gross product margins.",
      actionableAdvice: "Cap platform voucher discount caps at 12% max per checkout.",
    },
    {
      id: "services_growth",
      title: "Grooming & Services Growth",
      impact: 5000,
      pctOfVariance: -10.3,
      color: "#10B981",
      icon: TrendingUp,
      summary: "High-end pet grooming suite bookings rose +14.2%, partially offsetting retail drops.",
      actionableAdvice: "Expand grooming slot capacity during weekend afternoon peak hours.",
    },
  ];

  // Waterfall Chart Data
  const waterfallData = [
    { name: "Prior Period", value: 396000, start: 0, fill: "#223047", type: "base" },
    { name: "Stockouts", value: -18430, start: 396000 - 18430, fill: "#EF4444", type: "neg" },
    { name: "Rain Interruption", value: -12100, start: 377570 - 12100, fill: "#3B82F6", type: "neg" },
    { name: "Expired Promos", value: -9720, start: 365470 - 9720, fill: "#8B5CF6", type: "neg" },
    { name: "Discount Margin Loss", value: -8250, start: 355750 - 8250, fill: "#F59E0B", type: "neg" },
    { name: "Grooming Growth", value: 5000, start: 342500, fill: "#10B981", type: "pos" },
    { name: "Current Revenue", value: 347500, start: 0, fill: "#F53799", type: "final" },
  ];

  // Channel Contribution Data
  const channelContribution = [
    { channel: "Physical POS Store", prior: 185000, current: 154000, variance: -31000, pctChange: -16.8, primaryReason: "Monsoon rain reduced walk-in traffic & 6 stockout days" },
    { channel: "Shopee Marketplace", prior: 124000, current: 116500, variance: -7500, pctChange: -6.0, primaryReason: "Stockouts on Premium Dog Food 5kg" },
    { channel: "TikTok Shop", prior: 52000, current: 48000, variance: -4000, pctChange: -7.7, primaryReason: "Expired livestream promotional bundle" },
    { channel: "Direct Delivery", prior: 35000, current: 29000, variance: -6000, pctChange: -17.1, primaryReason: "Delivery courier delays on heavy rain days" },
  ];

  // Category Contribution Data
  const categoryContribution = [
    { category: "Pet Care & Dry Food", prior: 142000, current: 114000, variance: -28000, pctChange: -19.7, impactFactor: "Stockout & Inventory Depletion" },
    { category: "Espresso & Beverages", prior: 98000, current: 84000, variance: -14000, pctChange: -14.3, impactFactor: "Weather / Reduced Footfall" },
    { category: "Bakery & Pastries", prior: 46000, current: 39500, variance: -6500, pctChange: -14.1, impactFactor: "Expired Afternoon Promo" },
    { category: "Grooming Services", prior: 74000, current: 79000, variance: 5000, pctChange: 6.8, impactFactor: "Suite Capacity Expansion" },
    { category: "Pet Accessories", prior: 36000, current: 31000, variance: -5000, pctChange: -13.9, impactFactor: "Voucher Discount Surrender" },
  ];

  // SKU / Product Level Drag & Growth
  const topProductDrags = [
    { sku: "DOG-001", name: "Premium Dog Food 5kg", variance: -16400, unitDrop: -13, rootCause: "12 days out of stock during peak weekend" },
    { sku: "BEV-002", name: "Iced Caramel Macchiato", variance: -7200, unitDrop: -45, rootCause: "Rainy weekday afternoon footfall drop" },
    { sku: "ACC-004", name: "Deluxe Pet Collar Pink", variance: -4800, unitDrop: -15, rootCause: "Expired combo deal with Grooming" },
    { sku: "CAT-005", name: "Dental Chew Treats 200g", variance: -3600, unitDrop: -20, rootCause: "Competitor price markdown on Shopee" },
  ];

  const topProductGains = [
    { sku: "SRV-001", name: "Full Grooming Package", variance: 4200, unitGain: 6, rootCause: "High re-booking rate from repeat pet owners" },
    { sku: "SRV-003", name: "Hydrotherapy Bath", variance: 1800, unitGain: 3, rootCause: "New seasonal spa promotional offer" },
  ];

  // Stockout Analysis Data
  const stockoutDetails = [
    { sku: "DOG-001", name: "Premium Dog Food 5kg", daysOOS: 12, lostSalesEst: 16400, currentStock: 0, reorderPoint: 20, supplierLeadDays: 4 },
    { sku: "DOG-005", name: "Dental Chew Treats", daysOOS: 8, lostSalesEst: 4200, currentStock: 2, reorderPoint: 25, supplierLeadDays: 3 },
    { sku: "TOY-003", name: "Interactive Pet Ball", daysOOS: 5, lostSalesEst: 2100, currentStock: 1, reorderPoint: 10, supplierLeadDays: 5 },
  ];

  // Weather Impact Data
  const weatherDetails = [
    { date: "Jul 12 (Heavy Rain)", footfallDrop: "-38%", cafeRevDrop: "₱4,200", deliverySpike: "+12%", rainMm: 45 },
    { date: "Jul 18 (Typhoon Signal 1)", footfallDrop: "-52%", cafeRevDrop: "₱6,800", deliverySpike: "+18%", rainMm: 82 },
    { date: "Aug 02 (Monsoon Downpour)", footfallDrop: "-29%", cafeRevDrop: "₱3,100", deliverySpike: "+8%", rainMm: 38 },
  ];

  return (
    <div className="space-y-6 pb-12">
      <KpiDetailModal kpi={selectedKpi} onClose={() => setSelectedKpi(null)} />

      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#223047]">Root Cause Explorer</h1>
            <Badge className="bg-[#F53799]/10 text-[#F53799] border-[#FFD9EC] text-xs font-semibold px-2.5 py-0.5">
              Diagnostic AI Engine
            </Badge>
          </div>
          <p className="text-sm text-[#223047]/70 mt-1">
            Multidimensional contribution analysis answering <strong>“Why did revenue change?”</strong> across 8 operational drivers
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-[#FFD9EC] rounded-xl p-1 shadow-sm">
            <Calendar className="w-4 h-4 text-[#F53799] ml-2" />
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as any)}
              className="text-xs font-semibold text-[#223047] bg-transparent border-none focus:outline-none pr-2"
            >
              <option value="last30">Last 30 Days vs Prior 30 Days</option>
              <option value="last90">Last 90 Days vs Prior 90 Days</option>
              <option value="ytd">Year-to-Date vs Last Year</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-[#FFD9EC] rounded-xl p-1 shadow-sm">
            <Filter className="w-4 h-4 text-[#06B6D4] ml-2" />
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value as any)}
              className="text-xs font-semibold text-[#223047] bg-transparent border-none focus:outline-none pr-2"
            >
              <option value="all">All Business Sectors</option>
              <option value="cafe">Cafe Sector Only</option>
              <option value="services">Services Sector Only</option>
              <option value="retail">Retail Channels Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* TEACHING MASCOT BANNER (PROFESSOR WOOF) */}
      <div className="bg-gradient-to-r from-[#FFF0F8] via-[#FFF7FB] to-[#F0FDF4] border-2 border-[#FFD9EC] rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          {/* Mascot Image with Animated Badge */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-white/80 border border-[#FFD9EC] p-2 flex items-center justify-center shadow-md">
              <img
                src={mascotImg.src}
                alt="Professor WOOF AI Diagnostic Tutor"
                className="w-full h-full object-contain hover:scale-105 transition-transform"
              />
            </div>
            <span className="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#F53799] to-[#D42A7D] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Tutor
            </span>
          </div>

          {/* Speech Bubble Box */}
          <div className="flex-1 bg-white border border-[#FFD9EC] rounded-2xl p-4 md:p-5 shadow-sm relative">
            {/* Pointer Triangle for speech bubble (desktop) */}
            <div className="hidden md:block absolute -left-3 top-6 w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-white" />

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#F53799] bg-[#FFF0F8] px-2 py-0.5 rounded-md">
                  Diagnostic Breakdown
                </span>
                <span className="text-xs text-[#223047]/50 font-medium">Period Variance: -₱48,500 (-12.2%)</span>
              </div>
              <Badge className="bg-red-50 text-red-700 border-red-200 text-xs">
                Primary Drag: Stockouts (-38%)
              </Badge>
            </div>

            <p className="text-xs md:text-sm text-[#223047] font-medium leading-relaxed">
              “Woof! Revenue fell by <strong>₱48,500</strong> this period. My contribution analysis shows that <strong>38% of the drop (-₱18,430)</strong> was caused by <strong>Stockouts on top dog food SKUs</strong>, while <strong>25% (-₱12,100)</strong> was due to <strong>Heavy Monsoon Rain</strong> cutting cafe foot traffic. Re-stocking top items and launching rainy day vouchers can recover up to <strong>₱30,530</strong> of lost sales!”
            </p>

            <div className="mt-3 pt-3 border-t border-[#FFD9EC]/60 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-4 text-xs font-semibold text-[#223047]/80">
                <span className="flex items-center gap-1 text-red-600">
                  <Package className="w-3.5 h-3.5" /> Stockouts: -₱18.4k
                </span>
                <span className="flex items-center gap-1 text-blue-600">
                  <CloudRain className="w-3.5 h-3.5" /> Rain Days: -₱12.1k
                </span>
                <span className="flex items-center gap-1 text-purple-600">
                  <Tag className="w-3.5 h-3.5" /> Expired Promos: -₱9.7k
                </span>
              </div>

              <Button
                onClick={() => setActiveTab("stockouts")}
                size="sm"
                className="bg-[#F53799] hover:bg-[#D42A7D] text-white text-xs h-8 rounded-xl font-semibold shadow-xs"
              >
                Inspect Root Causes <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* TOP KPI SUMMARY STRIP (INTERACTIVE VIA KPI DETAIL MODAL) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Variance */}
        <div
          className="bg-white border border-[#FFD9EC] rounded-2xl p-4 cursor-pointer hover:border-[#F53799] hover:shadow-md transition-all group"
          onClick={() => setSelectedKpi({
            title: "Total Revenue Variance",
            current: totalVariance,
            previous: baseRevenue,
            currentLabel: "Current Period",
            previousLabel: "Prior Period",
            formatter: (v) => `₱${Number(v).toLocaleString()}`,
            icon: <TrendingDown className="w-5 h-5 text-red-600" />,
            growth: { text: "-12.2%", className: "text-red-600 font-bold" },
            description: "Net difference between current period revenue (₱347,500) and prior period baseline (₱396,000).",
            extraStats: [
              { label: "Baseline Target", value: "₱396,000" },
              { label: "Net Difference", value: "-₱48,500" },
            ],
          })}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#223047]/60">Total Revenue Drop</span>
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-[#FFF0F8] group-hover:text-[#F53799] transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-red-600 leading-tight">
            -₱{Math.abs(totalVariance).toLocaleString()}
          </div>
          <p className="text-[11px] font-semibold text-red-600 mt-1 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" /> -12.2% vs baseline period
          </p>
        </div>

        {/* Primary Drag */}
        <div
          className="bg-white border border-[#FFD9EC] rounded-2xl p-4 cursor-pointer hover:border-[#F53799] hover:shadow-md transition-all group"
          onClick={() => setSelectedKpi({
            title: "Primary Revenue Drag: Stockouts",
            current: 18430,
            formatter: (v) => `-₱${Number(v).toLocaleString()}`,
            icon: <Package className="w-5 h-5 text-red-600" />,
            description: "Inventory stockouts accounted for 38.0% of the total revenue drop across 12 unfulfilled store days.",
            extraStats: [
              { label: "Impact Share", value: "38.0% of total drop" },
              { label: "Affected SKUs", value: "3 Top Sellers" },
            ],
          })}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#223047]/60">Primary Drag (Stockouts)</span>
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-[#FFF0F8] group-hover:text-[#F53799] transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#223047] leading-tight">
            -₱18,430
          </div>
          <p className="text-[11px] font-medium text-[#223047]/60 mt-1">
            38.0% of total drop (12 OOS days)
          </p>
        </div>

        {/* External Drag */}
        <div
          className="bg-white border border-[#FFD9EC] rounded-2xl p-4 cursor-pointer hover:border-[#F53799] hover:shadow-md transition-all group"
          onClick={() => setSelectedKpi({
            title: "External Drag: Weather & Rain",
            current: 12100,
            formatter: (v) => `-₱${Number(v).toLocaleString()}`,
            icon: <CloudRain className="w-5 h-5 text-blue-600" />,
            description: "Monsoon downpours and Typhoon Signal #1 directly reduced walk-in cafe customer visits.",
            extraStats: [
              { label: "Impact Share", value: "25.0% of total drop" },
              { label: "Heavy Rain Days", value: "4 Days" },
            ],
          })}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#223047]/60">Weather Drag (Monsoon)</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-[#FFF0F8] group-hover:text-[#F53799] transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#223047] leading-tight">
            -₱12,100
          </div>
          <p className="text-[11px] font-medium text-[#223047]/60 mt-1">
            25.0% of total drop (4 rain days)
          </p>
        </div>

        {/* Positive Offset */}
        <div
          className="bg-white border border-[#BBF7D0] rounded-2xl p-4 cursor-pointer hover:border-[#10B981] hover:shadow-md transition-all group"
          onClick={() => setSelectedKpi({
            title: "Positive Offset: Grooming Growth",
            current: 5000,
            formatter: (v) => `+₱${Number(v).toLocaleString()}`,
            icon: <TrendingUp className="w-5 h-5 text-[#10B981]" />,
            growth: { text: "+6.8%", className: "text-[#10B981] font-bold" },
            description: "Strong grooming suite booking demand partially mitigated retail and cafe revenue declines.",
            extraStats: [
              { label: "Growth Value", value: "+₱5,000" },
              { label: "Booking Increase", value: "+14.2% volume" },
            ],
          })}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#166534]">Positive Offset (Services)</span>
            <div className="w-7 h-7 rounded-lg bg-green-50 text-[#10B981] flex items-center justify-center group-hover:bg-[#F0FDF4] transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#10B981] leading-tight">
            +₱5,000
          </div>
          <p className="text-[11px] font-semibold text-[#10B981] mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +6.8% grooming lift
          </p>
        </div>
      </div>

      {/* DIMENSION TAB NAVIGATION (8 DIMENSIONS) */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl p-2 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          <button
            onClick={() => setActiveTab("waterfall")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "waterfall"
                ? "bg-[#F53799] text-white shadow-xs"
                : "text-[#223047]/70 hover:bg-[#FFF0F8] hover:text-[#F53799]"
            }`}
          >
            <BarChart className="w-4 h-4" /> Revenue Waterfall
          </button>

          <button
            onClick={() => setActiveTab("channel")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "channel"
                ? "bg-[#F53799] text-white shadow-xs"
                : "text-[#223047]/70 hover:bg-[#FFF0F8] hover:text-[#F53799]"
            }`}
          >
            <Store className="w-4 h-4" /> 1. Channel
          </button>

          <button
            onClick={() => setActiveTab("category")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "category"
                ? "bg-[#F53799] text-white shadow-xs"
                : "text-[#223047]/70 hover:bg-[#FFF0F8] hover:text-[#F53799]"
            }`}
          >
            <Layers className="w-4 h-4" /> 2. Category
          </button>

          <button
            onClick={() => setActiveTab("product")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "product"
                ? "bg-[#F53799] text-white shadow-xs"
                : "text-[#223047]/70 hover:bg-[#FFF0F8] hover:text-[#F53799]"
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> 3. Product / SKU
          </button>

          <button
            onClick={() => setActiveTab("stockouts")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "stockouts"
                ? "bg-[#F53799] text-white shadow-xs"
                : "text-[#223047]/70 hover:bg-[#FFF0F8] hover:text-[#F53799]"
            }`}
          >
            <Package className="w-4 h-4" /> 4. Stock Availability
          </button>

          <button
            onClick={() => setActiveTab("weather")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "weather"
                ? "bg-[#F53799] text-white shadow-xs"
                : "text-[#223047]/70 hover:bg-[#FFF0F8] hover:text-[#F53799]"
            }`}
          >
            <CloudRain className="w-4 h-4" /> 5. Weather
          </button>

          <button
            onClick={() => setActiveTab("promotion")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "promotion"
                ? "bg-[#F53799] text-white shadow-xs"
                : "text-[#223047]/70 hover:bg-[#FFF0F8] hover:text-[#F53799]"
            }`}
          >
            <Tag className="w-4 h-4" /> 6. Promotion
          </button>

          <button
            onClick={() => setActiveTab("discount")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "discount"
                ? "bg-[#F53799] text-white shadow-xs"
                : "text-[#223047]/70 hover:bg-[#FFF0F8] hover:text-[#F53799]"
            }`}
          >
            <Percent className="w-4 h-4" /> 7. Discount
          </button>
        </div>
      </div>

      {/* MAIN TAB CONTENT AREA */}
      {activeTab === "waterfall" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Waterfall Chart */}
          <div className="lg:col-span-2 bg-white border border-[#FFD9EC] rounded-2xl p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#223047]">Revenue Waterfall Decomposition</h3>
                <p className="text-xs text-[#223047]/60">Step-by-step contribution breakdown from Prior Baseline to Current Revenue</p>
              </div>
              <Badge className="bg-[#FFF0F8] text-[#F53799] border-[#FFD9EC]">
                Variance: -₱48,500
              </Badge>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FFE5F2" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#223047", fontWeight: 600 }} />
                  <YAxis tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#223047" }} />
                  <Tooltip
                    formatter={(val: any) => [`₱${Math.abs(Number(val)).toLocaleString()}`, "Impact"]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #FFD9EC", backgroundColor: "#FFFFFF" }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {waterfallData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Impact Table */}
            <div className="mt-4 pt-4 border-t border-[#FFD9EC] space-y-2">
              <div className="text-xs font-bold text-[#223047] uppercase tracking-wider">Top Contribution Factors</div>
              {contributionDrivers.map((driver) => (
                <div key={driver.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFF7FB] border border-[#FFD9EC]/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${driver.color}15`, color: driver.color }}>
                      <driver.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#223047]">{driver.title}</div>
                      <div className="text-[11px] text-[#223047]/60">{driver.summary}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-bold ${driver.impact < 0 ? "text-red-600" : "text-green-600"}`}>
                      {driver.impact < 0 ? "" : "+"}{`₱${driver.impact.toLocaleString()}`}
                    </div>
                    <div className="text-[10px] text-[#223047]/50">{driver.pctOfVariance}% of variance</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Root Cause AI Prescription */}
          <div className="space-y-6">
            <div className="bg-white border border-[#FFD9EC] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#223047]">
                <Zap className="w-4 h-4 text-[#F53799]" /> Corrective Action Blueprint
              </div>

              {contributionDrivers.slice(0, 3).map((driver, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-[#FFD9EC] bg-[#FFF7FB] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#223047] flex items-center gap-1.5">
                      <driver.icon className="w-3.5 h-3.5 text-[#F53799]" /> {driver.title}
                    </span>
                    <span className="text-xs font-bold text-red-600">₱{driver.impact.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-[#223047]/80 leading-relaxed font-medium">
                    {driver.actionableAdvice}
                  </p>
                </div>
              ))}

              <Button
                onClick={() => router.push("/prescriptive-intelligence")}
                className="w-full bg-[#F53799] hover:bg-[#D42A7D] text-white text-xs font-semibold py-2.5 rounded-xl"
              >
                Execute Auto-Mitigation Rules <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 1. CHANNEL TAB */}
      {activeTab === "channel" && (
        <div className="bg-white border border-[#FFD9EC] rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#223047]">1. Channel Revenue Variance</h3>
              <p className="text-xs text-[#223047]/60">Revenue contribution & percentage changes across sales channels</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#FFD9EC] bg-[#FFF7FB] text-[#223047]">
                  <th className="p-3">Sales Channel</th>
                  <th className="p-3">Prior Revenue</th>
                  <th className="p-3">Current Revenue</th>
                  <th className="p-3">Variance (₱)</th>
                  <th className="p-3">% Change</th>
                  <th className="p-3">Primary Root Cause Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FFD9EC]/60">
                {channelContribution.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FFF0F8]/40 transition-colors">
                    <td className="p-3 font-bold text-[#223047] flex items-center gap-2">
                      <Store className="w-4 h-4 text-[#F53799]" /> {row.channel}
                    </td>
                    <td className="p-3 font-medium text-[#223047]/70">₱{row.prior.toLocaleString()}</td>
                    <td className="p-3 font-bold text-[#223047]">₱{row.current.toLocaleString()}</td>
                    <td className={`p-3 font-bold ${row.variance < 0 ? "text-red-600" : "text-green-600"}`}>
                      ₱{row.variance.toLocaleString()}
                    </td>
                    <td className="p-3 font-bold">
                      <span className={`px-2 py-0.5 rounded-md ${row.pctChange < 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                        {row.pctChange}%
                      </span>
                    </td>
                    <td className="p-3 font-medium text-[#223047]/80">{row.primaryReason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. CATEGORY TAB */}
      {activeTab === "category" && (
        <div className="bg-white border border-[#FFD9EC] rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#223047]">2. Category Revenue Variance</h3>
            <p className="text-xs text-[#223047]/60">Category-level revenue drops and top drag factors</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#FFD9EC] bg-[#FFF7FB] text-[#223047]">
                  <th className="p-3">Product / Service Category</th>
                  <th className="p-3">Prior Revenue</th>
                  <th className="p-3">Current Revenue</th>
                  <th className="p-3">Variance</th>
                  <th className="p-3">% Change</th>
                  <th className="p-3">Primary Impact Factor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FFD9EC]/60">
                {categoryContribution.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FFF0F8]/40 transition-colors">
                    <td className="p-3 font-bold text-[#223047]">{row.category}</td>
                    <td className="p-3 font-medium text-[#223047]/70">₱{row.prior.toLocaleString()}</td>
                    <td className="p-3 font-bold text-[#223047]">₱{row.current.toLocaleString()}</td>
                    <td className={`p-3 font-bold ${row.variance < 0 ? "text-red-600" : "text-green-600"}`}>
                      {row.variance >= 0 ? "+" : ""}₱{row.variance.toLocaleString()}
                    </td>
                    <td className="p-3 font-bold">
                      <span className={`px-2 py-0.5 rounded-md ${row.pctChange < 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                        {row.pctChange >= 0 ? "+" : ""}{row.pctChange}%
                      </span>
                    </td>
                    <td className="p-3 font-medium text-[#223047]/80">{row.impactFactor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. PRODUCT / SKU TAB */}
      {activeTab === "product" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Drag SKUs */}
          <div className="bg-white border border-[#FFD9EC] rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-red-600 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" /> Top Negative Revenue Contributor SKUs
            </h3>
            <div className="space-y-2.5">
              {topProductDrags.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-red-100 bg-red-50/50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#223047]">{item.name} <span className="text-[10px] text-[#223047]/50">({item.sku})</span></div>
                    <div className="text-[11px] text-red-700 mt-0.5">Root cause: {item.rootCause}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-red-600">₱{item.variance.toLocaleString()}</div>
                    <div className="text-[10px] text-[#223047]/50">{item.unitDrop} units</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Growth SKUs */}
          <div className="bg-white border border-[#BBF7D0] rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-green-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Top Positive Revenue Contributor SKUs
            </h3>
            <div className="space-y-2.5">
              {topProductGains.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-green-100 bg-green-50/50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#223047]">{item.name} <span className="text-[10px] text-[#223047]/50">({item.sku})</span></div>
                    <div className="text-[11px] text-green-700 mt-0.5">Driver: {item.rootCause}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-green-600">+₱{item.variance.toLocaleString()}</div>
                    <div className="text-[10px] text-[#223047]/50">+{item.unitGain} units</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. STOCK AVAILABILITY TAB */}
      {activeTab === "stockouts" && (
        <div className="bg-white border border-[#FFD9EC] rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#223047]">4. Stock Availability & Out-of-Stock (OOS) Impact</h3>
              <p className="text-xs text-[#223047]/60">Estimated revenue lost due to depleted shelf stock during peak demand periods</p>
            </div>
            <Badge className="bg-red-50 text-red-700 border-red-200">
              Total OOS Drag: -₱18,430
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#FFD9EC] bg-[#FFF7FB] text-[#223047]">
                  <th className="p-3">SKU & Item Name</th>
                  <th className="p-3">Days Out of Stock</th>
                  <th className="p-3">Est. Lost Sales</th>
                  <th className="p-3">Current Stock</th>
                  <th className="p-3">Reorder Point</th>
                  <th className="p-3">Supplier Lead Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FFD9EC]/60">
                {stockoutDetails.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FFF0F8]/40 transition-colors">
                    <td className="p-3 font-bold text-[#223047]">{row.name} <span className="text-[10px] text-[#223047]/50">({row.sku})</span></td>
                    <td className="p-3 font-bold text-red-600">{row.daysOOS} days</td>
                    <td className="p-3 font-bold text-red-600">-₱{row.lostSalesEst.toLocaleString()}</td>
                    <td className="p-3 font-bold text-[#223047]">{row.currentStock} units</td>
                    <td className="p-3 font-medium text-[#223047]/70">{row.reorderPoint} units</td>
                    <td className="p-3 font-medium text-[#223047]/70">{row.supplierLeadDays} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. WEATHER TAB */}
      {activeTab === "weather" && (
        <div className="bg-white border border-[#FFD9EC] rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#223047]">5. Weather & Rainfall Footfall Analysis</h3>
            <p className="text-xs text-[#223047]/60">Impact of severe rain downpours on walk-in cafe transactions vs delivery channel spikes</p>
          </div>

          <div className="space-y-3">
            {weatherDetails.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-[#FFD9EC] bg-[#FFF7FB] flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    <CloudRain className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#223047]">{item.date}</div>
                    <div className="text-[11px] text-[#223047]/60">Precipitation: {item.rainMm} mm rainfall</div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs">
                  <div>
                    <span className="text-[#223047]/60 block text-[10px]">Footfall Drop</span>
                    <span className="font-bold text-red-600">{item.footfallDrop}</span>
                  </div>
                  <div>
                    <span className="text-[#223047]/60 block text-[10px]">Cafe Rev Loss</span>
                    <span className="font-bold text-red-600">-{item.cafeRevDrop}</span>
                  </div>
                  <div>
                    <span className="text-[#223047]/60 block text-[10px]">Delivery Lift</span>
                    <span className="font-bold text-green-600">{item.deliverySpike}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. PROMOTION TAB */}
      {activeTab === "promotion" && (
        <div className="bg-white border border-[#FFD9EC] rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#223047]">6. Promotional Campaign Contribution</h3>
            <p className="text-xs text-[#223047]/60">Evaluating campaign expiration drag vs active promotion conversions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
              <span className="text-xs font-bold text-purple-700">Expired Promo Drag: -₱9,720</span>
              <p className="text-xs text-[#223047]/80 leading-relaxed font-medium">
                The 'Summer Refresh Bundle' ended on Jul 10, causing a 22% drop in beverage addon orders during weekday lunch hours.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-green-200 bg-green-50/40 space-y-2">
              <span className="text-xs font-bold text-green-700">Active Campaign Lift: +₱14,200</span>
              <p className="text-xs text-[#223047]/80 leading-relaxed font-medium">
                'Paw-Spa Weekend Grooming Combo' achieved 84% claim rate and generated +18 new client signups.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 7. DISCOUNT TAB */}
      {activeTab === "discount" && (
        <div className="bg-white border border-[#FFD9EC] rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#223047]">7. Discount & Margin Surrender Analysis</h3>
            <p className="text-xs text-[#223047]/60">Assessing voucher markdowns and margin erosion across platform channels</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-[#FFD9EC] bg-[#FFF7FB]">
              <span className="text-xs font-semibold text-[#223047]/60">Gross Sales</span>
              <div className="text-xl font-bold text-[#223047] mt-1">₱378,500</div>
              <div className="text-[10px] text-[#223047]/50 mt-0.5">Before platform markdowns</div>
            </div>

            <div className="p-4 rounded-xl border border-[#FFD9EC] bg-[#FFF7FB]">
              <span className="text-xs font-semibold text-red-600">Discounts Surrendered</span>
              <div className="text-xl font-bold text-red-600 mt-1">-₱31,000</div>
              <div className="text-[10px] text-red-600/80 mt-0.5">Vouchers & promotional markdowns</div>
            </div>

            <div className="p-4 rounded-xl border border-green-200 bg-green-50">
              <span className="text-xs font-semibold text-green-700">Net Realized Revenue</span>
              <div className="text-xl font-bold text-green-700 mt-1">₱347,500</div>
              <div className="text-[10px] text-green-700/80 mt-0.5">8.2% margin surrendered</div>
            </div>
          </div>
        </div>
      )}

      {/* INTEGRATED GEN AI ROOT CAUSE EXPLANATION CARD */}
      <GenAiExplanationCard
        feature="descriptive_explanation"
        title="Gen AI Multi-Factor Root Cause Synthesis"
        prompt="Synthesize why revenue fell during this period across channel, category, SKU, stockouts, weather, promotions, and discounts. Provide a clear executive summary and rank the top 3 corrective measures."
        context={{
          periodFilter,
          sectorFilter,
          totalVariance,
          baseRevenue,
          currentRevenue,
          drivers: contributionDrivers,
          stockoutLosses: stockoutDetails,
          weatherLosses: weatherDetails,
        }}
      />
    </div>
  );
}
