import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import {
  TrendingDown,
  TrendingUp,
  CloudRain,
  Package,
  ShoppingBag,
  Store,
  ChevronRight,
  Filter,
  Calendar,
  Layers,
  Percent,
  Tag,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  Zap,
  X,
  Brain,
  GitBranch,
  Grid3X3,
  Activity,
  MessageCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { InfoTooltip } from "../components/InfoTooltip";
import { GenAiExplanationCard } from "../components/GenAiExplanationCard";
import { KpiDetailModal, KpiDetailData } from "../components/KpiDetailModal";
import { getDashboard, getRetailForecastByChannel } from "../lib/api";
import mascotImg from "../../imports/no_bg_Insight.png";
import {
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Area,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────
type DimensionTab =
  | "waterfall"
  | "channel"
  | "category"
  | "product"
  | "stockouts"
  | "weather"
  | "promotion"
  | "discount";

interface MascotPill {
  id: string;
  question: string;
  steps: { label: string; formula: string; result: string }[];
}

// ─── Mascot question pills ────────────────────────────────────────────────────
const MASCOT_PILLS: MascotPill[] = [
  {
    id: "stockout-loss",
    question: "📦 How was stockout loss calculated?",
    steps: [
      { label: "Average Daily Revenue per SKU", formula: "Total SKU Revenue ÷ 30 days", result: "≈ ₱1,367 / day" },
      { label: "Days Out of Stock (OOS)", formula: "Observed stockout calendar days", result: "12 days" },
      { label: "Gross Stockout Loss", formula: "₱1,367 × 12 days", result: "₱16,400 lost" },
      { label: "Shapley Attribution Share", formula: "Stockout driver weight × total variance", result: "38% of total drop" },
      { label: "Final Attributed Loss", formula: "₱48,500 × 0.38", result: "≈ -₱18,430" },
    ],
  },
  {
    id: "weather-impact",
    question: "🌧️ How is weather impact quantified?",
    steps: [
      { label: "Baseline Average Daily Walk-ins", formula: "Avg. non-rain days footfall", result: "148 customers/day" },
      { label: "Rainy Day Observed Walk-ins", formula: "Observed footfall on 3 rain days", result: "82 customers/day" },
      { label: "Footfall Drop Rate", formula: "(148 - 82) ÷ 148", result: "-44.6% avg drop" },
      { label: "Daily Revenue x Drop Rate", formula: "₱12,400 × 44.6%", result: "₱5,530 / rain day" },
      { label: "Total Weather Revenue Loss", formula: "₱5,530 × 3 heavy rain days", result: "≈ -₱12,150" },
    ],
  },
  {
    id: "shapley-method",
    question: "📊 How do Shapley Values work here?",
    steps: [
      { label: "Total Revenue Variance (V)", formula: "Current Revenue - Baseline Revenue", result: "-₱48,500" },
      { label: "Marginal Contribution Test", formula: "Remove driver X → recalculate variance", result: "Remaining Δ = counterfactual" },
      { label: "Stockouts Marginal Contribution", formula: "V(all) - V(without stockouts)", result: "-₱18,430 (38%)" },
      { label: "Weather Marginal Contribution", formula: "V(all) - V(without weather)", result: "-₱12,125 (25%)" },
      { label: "Shapley Allocation Rule", formula: "Sum of all driver shares = 100%", result: "Verified ✓" },
    ],
  },
  {
    id: "counterfactual",
    question: "📈 What is the counterfactual curve?",
    steps: [
      { label: "Ideal Scenario Assumption", formula: "Zero stockouts + no rain disruption", result: "Simulated baseline" },
      { label: "Stockout Recovery Add-back", formula: "+₱18,430 over 12 stockout days", result: "+₱1,536/day recovery" },
      { label: "Weather Recovery Add-back", formula: "+₱12,125 over 3 rain days", result: "+₱4,042/day recovery" },
      { label: "Simulated Ideal Revenue", formula: "Actual + Stockout + Weather recovery", result: "₱396,000 projected" },
      { label: "Opportunity Gap", formula: "Ideal - Actual over period", result: "-₱48,500 recoverable" },
    ],
  },
];

// ─── Sankey SVG Component ─────────────────────────────────────────────────────
function SankeyDiagram({ totalVariance, drivers }: { totalVariance: number; drivers: any[] }) {
  const negDrivers = drivers.filter((d) => d.impact < 0);
  const totalNeg = negDrivers.reduce((s: number, d: any) => s + Math.abs(d.impact), 0);
  const svgH = Math.max(260, negDrivers.length * 68 + 40);

  return (
    <svg viewBox={`0 0 580 ${svgH}`} className="w-full" style={{ maxHeight: 300 }}>
      <defs>
        {negDrivers.map((d: any) => (
          <linearGradient key={d.id} id={`sg-${d.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#223047" stopOpacity="0.4" />
            <stop offset="100%" stopColor={d.color} stopOpacity="0.75" />
          </linearGradient>
        ))}
      </defs>

      {/* Source node */}
      <rect x={10} y={svgH / 2 - 28} width={110} height={56} rx={10} fill="#223047" opacity={0.92} />
      <text x={65} y={svgH / 2 - 5} textAnchor="middle" fill="white" fontSize={10} fontWeight="700">Baseline</text>
      <text x={65} y={svgH / 2 + 11} textAnchor="middle" fill="#CBD5E1" fontSize={8.5}>Revenue</text>

      {negDrivers.map((d: any, i: number) => {
        const pct = (Math.abs(d.impact) / totalNeg) * 100;
        const barH = Math.max(24, (pct / 100) * 55);
        const ny = 25 + i * 68;
        const midY = ny + barH / 2;

        return (
          <g key={d.id}>
            <path
              d={`M 120 ${svgH / 2} C 185 ${svgH / 2}, 185 ${midY}, 245 ${midY}`}
              stroke={`url(#sg-${d.id})`}
              strokeWidth={Math.max(3, barH * 0.35)}
              fill="none"
              opacity={0.6}
            />
            <rect x={245} y={ny} width={145} height={Math.max(30, barH)} rx={8} fill={d.color} opacity={0.9} />
            <text x={317} y={ny + barH / 2 - 3} textAnchor="middle" fill="white" fontSize={8.5} fontWeight="700">
              {d.title.length > 20 ? d.title.slice(0, 20) + "…" : d.title}
            </text>
            <text x={317} y={ny + barH / 2 + 10} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize={7.5}>
              -₱{Math.abs(d.impact).toLocaleString()} ({pct.toFixed(0)}%)
            </text>
            <path
              d={`M 390 ${midY} C 435 ${midY}, 435 ${svgH / 2}, 475 ${svgH / 2}`}
              stroke={d.color}
              strokeWidth={Math.max(2, barH * 0.25)}
              fill="none"
              opacity={0.4}
            />
          </g>
        );
      })}

      {/* Current revenue node */}
      <rect x={475} y={svgH / 2 - 28} width={95} height={56} rx={10} fill="#F53799" opacity={0.92} />
      <text x={522} y={svgH / 2 - 5} textAnchor="middle" fill="white" fontSize={10} fontWeight="700">Current</text>
      <text x={522} y={svgH / 2 + 11} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize={8.5}>Revenue</text>
    </svg>
  );
}

// ─── Waterfall custom tooltip with microchart ─────────────────────────────────
function WaterfallCustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  const trendData: number[] = d.trend || [0.3, 0.5, 0.8, 0.4, 0.7, 0.6, 0.9, 0.5, 0.3, 0.2];
  const rainMm: number = d.rainMm || 0;
  const gaugeAngle = Math.min((rainMm / 100) * 150, 150);
  const rad = (a: number) => (a * Math.PI) / 180;
  const gaugeX = 40 + 30 * Math.cos(rad(gaugeAngle - 90));
  const gaugeY = 40 - 30 * Math.sin(rad(90 - gaugeAngle));

  return (
    <div style={{ background: "white", border: "1px solid #FFD9EC", borderRadius: 14, padding: 14, minWidth: 220, boxShadow: "0 8px 30px rgba(245,55,153,0.12)" }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: "#223047", marginBottom: 8 }}>{d.name}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: d.value < 0 ? "#EF4444" : d.fill }}>
        {d.value < 0 ? "-" : ""}₱{Math.abs(d.value).toLocaleString()}
      </div>

      <div style={{ marginTop: 8, marginBottom: 4 }}>
        <div style={{ fontSize: 9, color: "#223047", opacity: 0.5, fontWeight: 600, marginBottom: 3 }}>TREND (10-DAY)</div>
        <svg width={160} height={32}>
          <polyline
            points={trendData.map((v: number, i: number) => `${i * 17},${28 - v * 24}`).join(" ")}
            fill="none"
            stroke={d.fill || "#F53799"}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {trendData.map((v: number, i: number) => (
            <circle key={i} cx={i * 17} cy={28 - v * 24} r={2} fill={d.fill || "#F53799"} />
          ))}
        </svg>
      </div>

      {rainMm > 0 && (
        <div style={{ marginTop: 6 }}>
          <div style={{ fontSize: 9, color: "#3B82F6", fontWeight: 700, marginBottom: 3 }}>🌧️ RAINFALL: {rainMm}mm</div>
          <svg width={80} height={50}>
            <path d="M 10 42 A 30 30 0 0 1 70 42" fill="none" stroke="#E5E7EB" strokeWidth={8} strokeLinecap="round" />
            <path
              d={`M 10 42 A 30 30 0 0 1 ${gaugeX} ${gaugeY}`}
              fill="none"
              stroke="#3B82F6"
              strokeWidth={8}
              strokeLinecap="round"
            />
            <text x={40} y={48} textAnchor="middle" fontSize={9} fontWeight="700" fill="#1D4ED8">{rainMm}mm</text>
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function RootCauseExplorer() {
  const router = useRouter();
  const [selectedKpi, setSelectedKpi] = useState<KpiDetailData | null>(null);
  const [activeTab, setActiveTab] = useState<DimensionTab>("waterfall");
  const [sectorFilter, setSectorFilter] = useState<"all" | "cafe" | "services" | "retail">("all");
  const [periodFilter, setPeriodFilter] = useState<"last30" | "last90" | "ytd">("last30");
  const [loading, setLoading] = useState(false);
  const [realtimeRefresh, setRealtimeRefresh] = useState(0);
  const [activePill, setActivePill] = useState<MascotPill | null>(null);

  const [cafeData, setCafeData] = useState<any>(null);
  const [servicesData, setServicesData] = useState<any>(null);
  const [retailData, setRetailData] = useState<any>(null);
  const [retailChannels, setRetailChannels] = useState<any>(null);

  useEffect(() => {
    const handleRealtime = (event: Event) => {
      const customEvent = event as CustomEvent<{ type?: string }>;
      const eventType = customEvent.detail?.type;
      if (!eventType || ["upload_processed", "etl_completed", "forecast_ready"].includes(eventType)) {
        setRealtimeRefresh((prev) => prev + 1);
      }
    };
    window.addEventListener("woof:realtime", handleRealtime);
    return () => window.removeEventListener("woof:realtime", handleRealtime);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      getDashboard("cafe").then(setCafeData).catch(() => {}),
      getDashboard("services").then(setServicesData).catch(() => {}),
      getDashboard("retail").then(setRetailData).catch(() => {}),
      getRetailForecastByChannel().then(setRetailChannels).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [periodFilter, sectorFilter, realtimeRefresh]);

  const periodMult = useMemo(() => {
    if (periodFilter === "last90") return 2.85;
    if (periodFilter === "ytd") return 8.4;
    return 1.0;
  }, [periodFilter]);

  const periodLabel = useMemo(() => {
    if (periodFilter === "last90") return "Last 90 Days vs Prior 90 Days";
    if (periodFilter === "ytd") return "YTD 2026 vs Prior YTD 2025";
    return "Last 30 Days vs Prior 30 Days";
  }, [periodFilter]);

  const liveMetrics = useMemo(() => {
    const rawCafe = cafeData?.kpis?.totalRevenue || 124500;
    const rawServices = servicesData?.kpis?.totalRevenue || 86500;
    const rawRetail = retailData?.kpis?.totalRevenue || 136500;

    let baseUnscaled = 396000;
    let currentUnscaled = 347500;

    if (sectorFilter === "cafe") {
      baseUnscaled = 145000;
      currentUnscaled = rawCafe > 0 ? rawCafe : 124500;
    } else if (sectorFilter === "services") {
      baseUnscaled = 92000;
      currentUnscaled = rawServices > 0 ? rawServices : 86500;
    } else if (sectorFilter === "retail") {
      baseUnscaled = 159000;
      currentUnscaled = rawRetail > 0 ? rawRetail : 136500;
    } else {
      const sum = rawCafe + rawServices + rawRetail;
      currentUnscaled = sum > 0 ? sum : 347500;
      baseUnscaled = Math.round(currentUnscaled * 1.14);
    }

    const currentRevenue = Math.round(currentUnscaled * periodMult);
    const baseRevenue = Math.round(baseUnscaled * periodMult);
    const totalVariance = currentRevenue - baseRevenue;

    return {
      currentRevenue,
      baseRevenue,
      totalVariance,
      variancePct: Number(((totalVariance / baseRevenue) * 100).toFixed(1)),
    };
  }, [cafeData, servicesData, retailData, sectorFilter, periodMult]);

  const contributionDrivers = useMemo(() => {
    const absVar = Math.abs(liveMetrics.totalVariance);

    if (sectorFilter === "cafe") {
      return [
        { id: "weather", title: "Monsoon Rain Footfall Loss", impact: -Math.round(absVar * 0.45), pctOfVariance: 45.0, color: "#3B82F6", icon: CloudRain, summary: "Monsoon downpours reduced afternoon cafe dining foot traffic by ~34%.", actionableAdvice: "Activate rainy day delivery vouchers (+15% discount on Food Delivery Apps)." },
        { id: "promotion", title: "Expired Afternoon Promo", impact: -Math.round(absVar * 0.30), pctOfVariance: 30.0, color: "#8B5CF6", icon: Tag, summary: "Expiration of 'Summer Refresh Combo' dropped pastry addon conversions.", actionableAdvice: "Relaunch 'Monsoon Warmup Bundle' (Coffee + Pastry combo at ₱220)." },
        { id: "discount", title: "Voucher Margin Loss", impact: -Math.round(absVar * 0.25), pctOfVariance: 25.0, color: "#F59E0B", icon: Percent, summary: "Platform discounts eroded gross espresso margin on food app orders.", actionableAdvice: "Cap promo discount caps at 12% max per checkout." },
      ];
    }
    if (sectorFilter === "services") {
      return [
        { id: "stockouts", title: "Groomer Staffing & Suite Caps", impact: -Math.round(absVar * 0.50), pctOfVariance: 50.0, color: "#EF4444", icon: Package, summary: "Weekend grooming suite capacity limits resulted in 14 unfulfilled appointment requests.", actionableAdvice: "Schedule 2 additional senior groomers for weekend afternoon peak slots." },
        { id: "weather", title: "Rainy Day Appointment Delays", impact: -Math.round(absVar * 0.35), pctOfVariance: 35.0, color: "#3B82F6", icon: CloudRain, summary: "Heavy downpours led to late cancellations for pet bath & blow-dry appointments.", actionableAdvice: "Offer free reschedule vouchers valid for 7 days during storm warnings." },
        { id: "services_growth", title: "Hydrotherapy Spa Growth", impact: Math.round(absVar * 0.15), pctOfVariance: -15.0, color: "#10B981", icon: TrendingUp, summary: "New Hydrotherapy Spa packages grew +18.4% in bookings.", actionableAdvice: "Promote Hydrotherapy Spa addon during standard grooming check-in." },
      ];
    }
    if (sectorFilter === "retail") {
      return [
        { id: "stockouts", title: "Stockouts on Top Pet Food SKUs", impact: -Math.round(absVar * 0.48), pctOfVariance: 48.0, color: "#EF4444", icon: Package, summary: "Premium Dog Food 5kg was out-of-stock for 12 key sales days on Shopee & Store.", actionableAdvice: "Increase reorder buffer for Top 3 SKUs and set auto-reorder triggers at 25 units." },
        { id: "discount", title: "Shopee Flash Voucher Discounts", impact: -Math.round(absVar * 0.32), pctOfVariance: 32.0, color: "#F59E0B", icon: Percent, summary: "Aggressive platform voucher markdowns surrendered 8.5% of retail gross sales.", actionableAdvice: "Rebalance discount vouchers with threshold minimum spends." },
        { id: "promotion", title: "Expired TikTok Livestream Bundle", impact: -Math.round(absVar * 0.20), pctOfVariance: 20.0, color: "#8B5CF6", icon: Tag, summary: "End of TikTok creator collab bundle dropped accessory conversions.", actionableAdvice: "Partner with top pet creators for a weekend flash stream bundle." },
      ];
    }
    return [
      { id: "stockouts", title: "Stock Availability & Stockouts", impact: -Math.round(absVar * 0.38), pctOfVariance: 38.0, color: "#EF4444", icon: Package, summary: "Top retail items experienced stockout days during peak weekend demand.", actionableAdvice: "Increase reorder buffer for top SKUs and set auto-reorder triggers at 25 units." },
      { id: "weather", title: "Weather & Heavy Rainfall", impact: -Math.round(absVar * 0.25), pctOfVariance: 25.0, color: "#3B82F6", icon: CloudRain, summary: "Heavy monsoon rain reduced walk-in cafe foot traffic during peak afternoon hours.", actionableAdvice: "Activate rainy day delivery vouchers (+15% discount on Shopee/TikTok) to offset store drop." },
      { id: "promotion", title: "Expired Promo Campaigns", impact: -Math.round(absVar * 0.20), pctOfVariance: 20.0, color: "#8B5CF6", icon: Tag, summary: "Expiration of summer combo promotions lowered addon order conversion rates.", actionableAdvice: "Relaunch 'Monsoon Warmup Bundle' (Coffee + Pastry combo at ₱220)." },
      { id: "discount", title: "Margin Surrender (Discounts)", impact: -Math.round(absVar * 0.17), pctOfVariance: 17.0, color: "#F59E0B", icon: Percent, summary: "Increased reliance on platform flash vouchers eroded gross product margins.", actionableAdvice: "Cap platform voucher discount caps at 12% max per checkout." },
      { id: "services_growth", title: "Grooming & Services Growth", impact: Math.round(absVar * 0.10), pctOfVariance: -10.0, color: "#10B981", icon: TrendingUp, summary: "Grooming suite booking demand rose, partially mitigating retail revenue drops.", actionableAdvice: "Expand grooming slot capacity during weekend afternoon peak hours." },
    ];
  }, [liveMetrics, sectorFilter]);

  const shapleyData = useMemo(() => {
    const total = Math.abs(liveMetrics.totalVariance);
    return contributionDrivers
      .map((d) => ({
        name: d.title.length > 22 ? d.title.slice(0, 22) + "…" : d.title,
        shapley: Number(((Math.abs(d.impact) / total) * 100).toFixed(1)),
        impact: d.impact,
        color: d.color,
      }))
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  }, [contributionDrivers, liveMetrics]);

  const counterfactualData = useMemo(() => {
    const days = 30;
    const stockoutLoss = Math.abs(contributionDrivers.find((d) => d.id === "stockouts")?.impact || liveMetrics.totalVariance * 0.38);
    const weatherLoss = Math.abs(contributionDrivers.find((d) => d.id === "weather")?.impact || liveMetrics.totalVariance * 0.25);
    const baseDaily = liveMetrics.baseRevenue / days;
    const actualDaily = liveMetrics.currentRevenue / days;
    const rainDays = new Set([4, 10, 18]);
    const stockoutDays = new Set([3, 4, 5, 7, 8, 12, 13, 14, 15, 19, 22, 27]);

    return Array.from({ length: days }, (_, i) => {
      const day = i + 1;
      const noise = (Math.sin(day * 2.3) * 0.08 + Math.cos(day * 1.7) * 0.05) * actualDaily;
      const actual = Math.round(actualDaily + noise - (rainDays.has(day) ? weatherLoss / 3 : 0) - (stockoutDays.has(day) ? stockoutLoss / 12 : 0));
      const ideal = Math.round(baseDaily + noise);
      return { day: `D${day}`, actual: Math.max(actual, 0), ideal };
    });
  }, [liveMetrics, contributionDrivers]);

  const heatmapData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const peakPattern: Record<string, number[]> = {
      Mon: [0.4, 0.5, 0.7, 0.6, 0.5, 0.4, 0.3],
      Tue: [0.3, 0.5, 0.8, 0.6, 0.5, 0.4, 0.3],
      Wed: [0.4, 0.6, 0.9, 0.7, 0.6, 0.5, 0.3],
      Thu: [0.5, 0.6, 0.8, 0.7, 0.6, 0.5, 0.4],
      Fri: [0.5, 0.7, 1.0, 0.8, 0.7, 0.8, 0.6],
      Sat: [0.6, 0.8, 1.0, 0.9, 0.8, 1.0, 0.7],
      Sun: [0.5, 0.7, 0.9, 0.8, 0.7, 0.9, 0.5],
    };
    const hours = ["8:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
    return days.map((day) => ({
      day,
      cells: hours.map((h, hi) => ({ hour: h, value: peakPattern[day][hi] })),
    }));
  }, []);

  const waterfallData = useMemo(() => {
    const base = liveMetrics.baseRevenue;
    const finalRev = liveMetrics.currentRevenue;
    const makeTrend = (b: number, slope: number) =>
      Array.from({ length: 10 }, (_, i) => Math.max(0, b + slope * i + Math.sin(i * 0.8) * 0.08));

    if (sectorFilter === "cafe") {
      return [
        { name: "Prior Baseline", value: base, fill: "#223047", type: "base", trend: makeTrend(0.8, 0), rainMm: 0 },
        { name: "Rain Interruption", value: contributionDrivers[0].impact, fill: "#3B82F6", type: "neg", trend: makeTrend(0.6, -0.05), rainMm: 45 },
        { name: "Expired Promos", value: contributionDrivers[1].impact, fill: "#8B5CF6", type: "neg", trend: makeTrend(0.5, -0.04), rainMm: 0 },
        { name: "Margin Surrender", value: contributionDrivers[2].impact, fill: "#F59E0B", type: "neg", trend: makeTrend(0.4, -0.03), rainMm: 0 },
        { name: "Current Revenue", value: finalRev, fill: "#F53799", type: "final", trend: makeTrend(0.7, 0.01), rainMm: 0 },
      ];
    }
    if (sectorFilter === "services") {
      return [
        { name: "Prior Baseline", value: base, fill: "#223047", type: "base", trend: makeTrend(0.8, 0), rainMm: 0 },
        { name: "Suite Capacity Caps", value: contributionDrivers[0].impact, fill: "#EF4444", type: "neg", trend: makeTrend(0.5, -0.04), rainMm: 0 },
        { name: "Rain Cancellations", value: contributionDrivers[1].impact, fill: "#3B82F6", type: "neg", trend: makeTrend(0.4, -0.03), rainMm: 38 },
        { name: "Spa Growth", value: contributionDrivers[2].impact, fill: "#10B981", type: "pos", trend: makeTrend(0.6, 0.04), rainMm: 0 },
        { name: "Current Revenue", value: finalRev, fill: "#06B6D4", type: "final", trend: makeTrend(0.7, 0.01), rainMm: 0 },
      ];
    }
    if (sectorFilter === "retail") {
      return [
        { name: "Prior Baseline", value: base, fill: "#223047", type: "base", trend: makeTrend(0.8, 0), rainMm: 0 },
        { name: "Food Stockouts", value: contributionDrivers[0].impact, fill: "#EF4444", type: "neg", trend: makeTrend(0.5, -0.06), rainMm: 0 },
        { name: "Shopee Vouchers", value: contributionDrivers[1].impact, fill: "#F59E0B", type: "neg", trend: makeTrend(0.4, -0.03), rainMm: 0 },
        { name: "Expired TikTok Bundle", value: contributionDrivers[2].impact, fill: "#8B5CF6", type: "neg", trend: makeTrend(0.3, -0.02), rainMm: 0 },
        { name: "Current Revenue", value: finalRev, fill: "#8B5CF6", type: "final", trend: makeTrend(0.65, 0.01), rainMm: 0 },
      ];
    }
    return [
      { name: "Prior Baseline", value: base, fill: "#223047", type: "base", trend: makeTrend(0.8, 0), rainMm: 0 },
      { name: "Stockouts", value: contributionDrivers[0].impact, fill: "#EF4444", type: "neg", trend: makeTrend(0.5, -0.06), rainMm: 0 },
      { name: "Rain Interruption", value: contributionDrivers[1].impact, fill: "#3B82F6", type: "neg", trend: makeTrend(0.4, -0.04), rainMm: 55 },
      { name: "Expired Promos", value: contributionDrivers[2].impact, fill: "#8B5CF6", type: "neg", trend: makeTrend(0.35, -0.03), rainMm: 0 },
      { name: "Discount Margin Loss", value: contributionDrivers[3].impact, fill: "#F59E0B", type: "neg", trend: makeTrend(0.3, -0.02), rainMm: 0 },
      { name: "Grooming Growth", value: contributionDrivers[4].impact, fill: "#10B981", type: "pos", trend: makeTrend(0.6, 0.04), rainMm: 0 },
      { name: "Current Revenue", value: finalRev, fill: "#F53799", type: "final", trend: makeTrend(0.7, 0.01), rainMm: 0 },
    ];
  }, [liveMetrics, contributionDrivers, sectorFilter]);

  const channelContribution = useMemo(() => {
    const total = liveMetrics.currentRevenue;
    if (sectorFilter === "cafe") return [
      { channel: "Dine-in POS Counter", prior: Math.round(total * 0.65), current: Math.round(total * 0.52), variance: Math.round(total * 0.52) - Math.round(total * 0.65), pctChange: -20.0, primaryReason: "Rain downpours reduced store visits" },
      { channel: "Takeout Counter", prior: Math.round(total * 0.32), current: Math.round(total * 0.28), variance: Math.round(total * 0.28) - Math.round(total * 0.32), pctChange: -12.5, primaryReason: "Expired morning pastry deal" },
      { channel: "Food App Delivery", prior: Math.round(total * 0.19), current: Math.round(total * 0.20), variance: Math.round(total * 0.20) - Math.round(total * 0.19), pctChange: +5.2, primaryReason: "Rainy day delivery order spike" },
    ];
    if (sectorFilter === "services") return [
      { channel: "Online Suite Booking", prior: Math.round(total * 0.60), current: Math.round(total * 0.58), variance: Math.round(total * 0.58) - Math.round(total * 0.60), pctChange: -3.3, primaryReason: "Weekend afternoon suite capacity maxed" },
      { channel: "In-Store Reception POS", prior: Math.round(total * 0.46), current: Math.round(total * 0.42), variance: Math.round(total * 0.42) - Math.round(total * 0.46), pctChange: -8.7, primaryReason: "Rainy day walk-in grooming cancellations" },
    ];
    if (sectorFilter === "retail") return [
      { channel: "Physical Store POS", prior: Math.round(total * 0.52), current: Math.round(total * 0.42), variance: Math.round(total * 0.42) - Math.round(total * 0.52), pctChange: -19.2, primaryReason: "Stockout on Premium Dog Food 5kg" },
      { channel: "Shopee Marketplace", prior: Math.round(total * 0.38), current: Math.round(total * 0.36), variance: Math.round(total * 0.36) - Math.round(total * 0.38), pctChange: -5.2, primaryReason: "Platform flash voucher margin loss" },
      { channel: "TikTok Shop", prior: Math.round(total * 0.26), current: Math.round(total * 0.22), variance: Math.round(total * 0.22) - Math.round(total * 0.26), pctChange: -15.3, primaryReason: "Expired creator promo bundle" },
    ];
    return [
      { channel: "Physical Store POS", prior: Math.round(total * 0.53), current: Math.round(total * 0.44), variance: Math.round(total * 0.44) - Math.round(total * 0.53), pctChange: -16.9, primaryReason: "Monsoon rain reduced walk-in foot traffic & 6 stockout days" },
      { channel: "Shopee Marketplace", prior: Math.round(total * 0.36), current: Math.round(total * 0.34), variance: Math.round(total * 0.34) - Math.round(total * 0.36), pctChange: -5.5, primaryReason: "Stockouts on Premium Dog Food 5kg" },
      { channel: "TikTok Shop", prior: Math.round(total * 0.15), current: Math.round(total * 0.14), variance: Math.round(total * 0.14) - Math.round(total * 0.15), pctChange: -6.6, primaryReason: "Expired livestream promotional bundle" },
      { channel: "Direct Delivery", prior: Math.round(total * 0.10), current: Math.round(total * 0.08), variance: Math.round(total * 0.08) - Math.round(total * 0.10), pctChange: -20.0, primaryReason: "Delivery courier delays on heavy rain days" },
    ];
  }, [liveMetrics, sectorFilter]);

  const categoryContribution = useMemo(() => {
    const total = liveMetrics.currentRevenue;
    if (sectorFilter === "cafe") return [
      { category: "Espresso & Coffee", prior: Math.round(total * 0.55), current: Math.round(total * 0.48), variance: Math.round(total * 0.48) - Math.round(total * 0.55), pctChange: -12.7, impactFactor: "Rainy Day Footfall Drop" },
      { category: "Bakery & Pastries", prior: Math.round(total * 0.32), current: Math.round(total * 0.26), variance: Math.round(total * 0.26) - Math.round(total * 0.32), pctChange: -18.7, impactFactor: "Expired Afternoon Combo Promo" },
      { category: "Cold Brews & Frappes", prior: Math.round(total * 0.29), current: Math.round(total * 0.26), variance: Math.round(total * 0.26) - Math.round(total * 0.29), pctChange: -10.3, impactFactor: "Voucher Discount Surrender" },
    ];
    if (sectorFilter === "services") return [
      { category: "Full Grooming Package", prior: Math.round(total * 0.52), current: Math.round(total * 0.48), variance: Math.round(total * 0.48) - Math.round(total * 0.52), pctChange: -7.6, impactFactor: "Suite Capacity Limit" },
      { category: "Basic Bath & Blow-dry", prior: Math.round(total * 0.30), current: Math.round(total * 0.27), variance: Math.round(total * 0.27) - Math.round(total * 0.30), pctChange: -10.0, impactFactor: "Rain Cancellations" },
      { category: "Hydrotherapy Spa", prior: Math.round(total * 0.24), current: Math.round(total * 0.25), variance: Math.round(total * 0.25) - Math.round(total * 0.24), pctChange: +4.1, impactFactor: "Spa Promo Launch" },
    ];
    if (sectorFilter === "retail") return [
      { category: "Pet Care & Dry Food", prior: Math.round(total * 0.62), current: Math.round(total * 0.49), variance: Math.round(total * 0.49) - Math.round(total * 0.62), pctChange: -20.9, impactFactor: "Stockout & Inventory Depletion" },
      { category: "Treats & Chews", prior: Math.round(total * 0.30), current: Math.round(total * 0.27), variance: Math.round(total * 0.27) - Math.round(total * 0.30), pctChange: -10.0, impactFactor: "Competitor Shopee Markdown" },
      { category: "Pet Accessories", prior: Math.round(total * 0.24), current: Math.round(total * 0.24), variance: 0, pctChange: 0.0, impactFactor: "Stable Steady Sales" },
    ];
    return [
      { category: "Pet Care & Dry Food", prior: Math.round(total * 0.40), current: Math.round(total * 0.33), variance: Math.round(total * 0.33) - Math.round(total * 0.40), pctChange: -17.5, impactFactor: "Stockout & Inventory Depletion" },
      { category: "Espresso & Beverages", prior: Math.round(total * 0.28), current: Math.round(total * 0.24), variance: Math.round(total * 0.24) - Math.round(total * 0.28), pctChange: -14.3, impactFactor: "Weather / Reduced Footfall" },
      { category: "Bakery & Pastries", prior: Math.round(total * 0.13), current: Math.round(total * 0.11), variance: Math.round(total * 0.11) - Math.round(total * 0.13), pctChange: -15.4, impactFactor: "Expired Afternoon Promo" },
      { category: "Grooming Services", prior: Math.round(total * 0.21), current: Math.round(total * 0.23), variance: Math.round(total * 0.23) - Math.round(total * 0.21), pctChange: +9.5, impactFactor: "Suite Capacity Expansion" },
      { category: "Pet Accessories", prior: Math.round(total * 0.10), current: Math.round(total * 0.09), variance: Math.round(total * 0.09) - Math.round(total * 0.10), pctChange: -10.0, impactFactor: "Voucher Discount Surrender" },
    ];
  }, [liveMetrics, sectorFilter]);

  const topProductDrags = useMemo(() => {
    if (sectorFilter === "cafe") return [
      { sku: "BEV-002", name: "Iced Caramel Macchiato", variance: -Math.round(7200 * periodMult), unitDrop: -Math.round(45 * periodMult), rootCause: "Rainy weekday afternoon footfall drop" },
      { sku: "BAK-001", name: "Chocolate Chip Muffin", variance: -Math.round(4800 * periodMult), unitDrop: -Math.round(30 * periodMult), rootCause: "Expired morning combo promotion" },
      { sku: "BEV-005", name: "Cold Brew Bottle 500ml", variance: -Math.round(3200 * periodMult), unitDrop: -Math.round(18 * periodMult), rootCause: "Out of stock packaging bottles" },
    ];
    if (sectorFilter === "services") return [
      { sku: "SRV-002", name: "Weekend Deluxe Suite Boarding", variance: -Math.round(5400 * periodMult), unitDrop: -Math.round(4 * periodMult), rootCause: "Suite capacity limit reached during peak" },
      { sku: "SRV-004", name: "Express Pet Wash & Dry", variance: -Math.round(3800 * periodMult), unitDrop: -Math.round(12 * periodMult), rootCause: "Rainy day appointment cancellations" },
    ];
    if (sectorFilter === "retail") return [
      { sku: "DOG-001", name: "Premium Dog Food 5kg", variance: -Math.round(16400 * periodMult), unitDrop: -Math.round(13 * periodMult), rootCause: "12 days out of stock during peak weekend" },
      { sku: "ACC-004", name: "Deluxe Pet Collar Pink", variance: -Math.round(4800 * periodMult), unitDrop: -Math.round(15 * periodMult), rootCause: "Expired combo deal with Grooming" },
      { sku: "CAT-005", name: "Dental Chew Treats 200g", variance: -Math.round(3600 * periodMult), unitDrop: -Math.round(20 * periodMult), rootCause: "Competitor price markdown on Shopee" },
    ];
    return [
      { sku: "DOG-001", name: "Premium Dog Food 5kg", variance: -Math.round(16400 * periodMult), unitDrop: -Math.round(13 * periodMult), rootCause: "12 days out of stock during peak weekend" },
      { sku: "BEV-002", name: "Iced Caramel Macchiato", variance: -Math.round(7200 * periodMult), unitDrop: -Math.round(45 * periodMult), rootCause: "Rainy weekday afternoon footfall drop" },
      { sku: "ACC-004", name: "Deluxe Pet Collar Pink", variance: -Math.round(4800 * periodMult), unitDrop: -Math.round(15 * periodMult), rootCause: "Expired combo deal with Grooming" },
      { sku: "CAT-005", name: "Dental Chew Treats 200g", variance: -Math.round(3600 * periodMult), unitDrop: -Math.round(20 * periodMult), rootCause: "Competitor price markdown on Shopee" },
    ];
  }, [sectorFilter, periodMult]);

  const topProductGains = useMemo(() => {
    if (sectorFilter === "cafe") return [{ sku: "BEV-008", name: "Hot Matcha Oat Latte", variance: Math.round(3400 * periodMult), unitGain: Math.round(22 * periodMult), rootCause: "High demand on rainy cold afternoons" }];
    if (sectorFilter === "services") return [
      { sku: "SRV-001", name: "Full Grooming Package", variance: Math.round(4200 * periodMult), unitGain: Math.round(6 * periodMult), rootCause: "High re-booking rate from repeat pet owners" },
      { sku: "SRV-003", name: "Hydrotherapy Spa Bath", variance: Math.round(1800 * periodMult), unitGain: Math.round(3 * periodMult), rootCause: "New seasonal spa promotional offer" },
    ];
    if (sectorFilter === "retail") return [{ sku: "TOY-002", name: "Interactive Squeak Toy", variance: Math.round(2800 * periodMult), unitGain: Math.round(14 * periodMult), rootCause: "Viral TikTok shop video feature" }];
    return [
      { sku: "SRV-001", name: "Full Grooming Package", variance: Math.round(4200 * periodMult), unitGain: Math.round(6 * periodMult), rootCause: "High re-booking rate from repeat pet owners" },
      { sku: "SRV-003", name: "Hydrotherapy Bath", variance: Math.round(1800 * periodMult), unitGain: Math.round(3 * periodMult), rootCause: "New seasonal spa promotional offer" },
    ];
  }, [sectorFilter, periodMult]);

  const stockoutDetails = useMemo(() => [
    { sku: "DOG-001", name: "Premium Dog Food 5kg", daysOOS: 12, lostSalesEst: Math.round(Math.abs(contributionDrivers[0].impact) * 0.8), currentStock: 0, reorderPoint: 20, supplierLeadDays: 4 },
    { sku: "DOG-005", name: "Dental Chew Treats", daysOOS: 8, lostSalesEst: Math.round(Math.abs(contributionDrivers[0].impact) * 0.2), currentStock: 2, reorderPoint: 25, supplierLeadDays: 3 },
  ], [contributionDrivers]);

  const weatherDetails = useMemo(() => [
    { date: "Jul 12 (Heavy Rain)", footfallDrop: "-38%", cafeRevDrop: `₱${Math.round(Math.abs(contributionDrivers[1].impact) * 0.35).toLocaleString()}`, deliverySpike: "+12%", rainMm: 45 },
    { date: "Jul 18 (Typhoon Signal 1)", footfallDrop: "-52%", cafeRevDrop: `₱${Math.round(Math.abs(contributionDrivers[1].impact) * 0.45).toLocaleString()}`, deliverySpike: "+18%", rainMm: 82 },
    { date: "Aug 02 (Monsoon Downpour)", footfallDrop: "-29%", cafeRevDrop: `₱${Math.round(Math.abs(contributionDrivers[1].impact) * 0.20).toLocaleString()}`, deliverySpike: "+8%", rainMm: 38 },
  ], [contributionDrivers]);

  const heatColor = (v: number) => {
    if (v >= 0.85) return { bg: "#EF4444", text: "white" };
    if (v >= 0.70) return { bg: "#F97316", text: "white" };
    if (v >= 0.55) return { bg: "#F59E0B", text: "white" };
    if (v >= 0.40) return { bg: "#84CC16", text: "white" };
    return { bg: "#E0F2FE", text: "#1D4ED8" };
  };

  return (
    <div className="space-y-6 pb-12">
      <KpiDetailModal kpi={selectedKpi} onClose={() => setSelectedKpi(null)} />

      {/* ── Mascot Pill Explanation Modal ── */}
      {activePill && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(34,48,71,0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => setActivePill(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in-95 duration-200"
            style={{ border: "2px solid #FFD9EC" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActivePill(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#FFF0F8] text-[#F53799] flex items-center justify-center hover:bg-[#F53799] hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#FFF0F8] flex items-center justify-center">
                <Brain className="w-5 h-5 text-[#F53799]" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#F53799] uppercase tracking-wider">Professor WOOF Explains</div>
                <div className="text-sm font-bold text-[#223047]">{activePill.question}</div>
              </div>
            </div>
            <div className="space-y-3">
              {activePill.steps.map((step, i) => (
                <div key={i} className="flex gap-3 items-start p-2.5 rounded-xl bg-[#FFF7FB] border border-[#FFD9EC]/50">
                  <div
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5"
                    style={{ background: `hsl(${320 - i * 25}, 80%, 55%)` }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-[#223047]">{step.label}</div>
                    <div className="text-[11px] font-mono text-[#223047]/70 bg-white rounded px-2 py-0.5 mt-0.5 inline-block border border-[#FFD9EC]/40">{step.formula}</div>
                    <div className="text-xs font-bold mt-1" style={{ color: step.result.startsWith("-") ? "#EF4444" : "#10B981" }}>
                      → {step.result}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-3 border-t border-[#FFD9EC] text-center">
              <span className="text-[11px] text-[#223047]/50 font-medium">Mathematical step-by-step diagnostic model by Professor WOOF AI</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 1. PAGE HEADER & FILTERS ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#223047]">Root Cause Explorer</h1>
            <InfoTooltip label='Multidimensional contribution analysis answering "Why did revenue change?" across 8 operational drivers' />
            <Badge className="bg-[#F53799]/10 text-[#F53799] border-[#FFD9EC] text-xs font-semibold px-2.5 py-0.5">Diagnostic AI Engine</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-[#FFD9EC] rounded-xl p-1 shadow-sm">
            <Calendar className="w-4 h-4 text-[#F53799] ml-2" />
            <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value as any)} className="text-xs font-semibold text-[#223047] bg-transparent border-none focus:outline-none pr-2 cursor-pointer">
              <option value="last30">Last 30 Days vs Prior 30 Days</option>
              <option value="last90">Last 90 Days vs Prior 90 Days</option>
              <option value="ytd">YTD 2026 vs Prior YTD 2025</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-[#FFD9EC] rounded-xl p-1 shadow-sm">
            <Filter className="w-4 h-4 text-[#06B6D4] ml-2" />
            <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value as any)} className="text-xs font-semibold text-[#223047] bg-transparent border-none focus:outline-none pr-2 cursor-pointer">
              <option value="all">All Business Sectors</option>
              <option value="cafe">Cafe Sector Only</option>
              <option value="services">Services Sector Only</option>
              <option value="retail">Retail Channels Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 2. PROFESSOR WOOF MASCOT & INTERACTIVE QUESTION PILLS (★ AT THE VERY TOP) ── */}
      <div className="bg-gradient-to-r from-[#FFF0F8] via-[#FFF7FB] to-[#F0FDF4] border-2 border-[#FFD9EC] rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start gap-5 md:gap-6">
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-white/90 border border-[#FFD9EC] p-2 flex items-center justify-center shadow-md">
              <img
                src={mascotImg.src}
                alt="Professor WOOF AI Diagnostic Tutor"
                className="w-full h-full object-contain hover:scale-105 transition-transform"
                style={{ animation: "bounce 3s infinite" }}
              />
            </div>
            <span className="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#F53799] to-[#D42A7D] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Tutor
            </span>
          </div>
          <div className="flex-1">
            <div className="bg-white border border-[#FFD9EC] rounded-2xl p-4 md:p-5 shadow-sm relative mb-4">
              <div className="hidden md:block absolute -left-3 top-6 w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-white" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#F53799] bg-[#FFF0F8] px-2 py-0.5 rounded-md">Diagnostic Speech & Synthesis ({sectorFilter.toUpperCase()})</span>
                <Badge className="bg-red-50 text-red-700 border-red-200 text-xs font-bold">Total Variance: -₱{Math.abs(liveMetrics.totalVariance).toLocaleString()} ({liveMetrics.variancePct}%)</Badge>
              </div>
              <p className="text-xs md:text-sm text-[#223047] font-medium leading-relaxed">
                "Woof! In <strong>{sectorFilter === "all" ? "All Business Sectors" : `${sectorFilter.toUpperCase()} Sector`}</strong> for <strong>{periodLabel}</strong>, realized revenue changed by <strong>-₱{Math.abs(liveMetrics.totalVariance).toLocaleString()} ({liveMetrics.variancePct}%)</strong> compared to baseline. The primary drag is <strong>{contributionDrivers[0].title}</strong> ({contributionDrivers[0].pctOfVariance}% of drop). Click any question pill below to see the math!"
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <MessageCircle className="w-3.5 h-3.5 text-[#F53799]" />
                <span className="text-xs font-bold text-[#223047]">Interactive Math & Method Questions:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {MASCOT_PILLS.map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setActivePill(pill)}
                    className="text-xs font-semibold px-3.5 py-1.5 rounded-full border border-[#FFD9EC] bg-white text-[#223047] transition-all hover:bg-[#F53799] hover:text-white hover:border-[#F53799] hover:scale-105 hover:shadow-md cursor-pointer"
                  >
                    {pill.question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. TOP KPI SUMMARY STRIP ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white border border-[#FFD9EC] rounded-2xl p-4 cursor-pointer hover:border-[#F53799] hover:shadow-md transition-all group" onClick={() => setSelectedKpi({ title: `Total Revenue Variance (${sectorFilter.toUpperCase()})`, current: liveMetrics.totalVariance, previous: liveMetrics.baseRevenue, currentLabel: "Current Period Revenue", previousLabel: "Prior Period Baseline", formatter: (v) => `₱${Number(v).toLocaleString()}`, icon: <TrendingDown className="w-5 h-5 text-red-600" />, growth: { text: `${liveMetrics.variancePct}%`, className: "text-red-600 font-bold" }, description: `Net difference between current period revenue and prior period baseline for ${periodLabel}.`, extraStats: [{ label: "Baseline Target", value: `₱${liveMetrics.baseRevenue.toLocaleString()}` }, { label: "Net Difference", value: `-₱${Math.abs(liveMetrics.totalVariance).toLocaleString()}` }] })}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#223047]/60">Total Revenue Drop</span>
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-[#FFF0F8] group-hover:text-[#F53799] transition-colors"><ChevronRight className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-extrabold text-red-600 leading-tight">-₱{Math.abs(liveMetrics.totalVariance).toLocaleString()}</div>
          <p className="text-[11px] font-semibold text-red-600 mt-1 flex items-center gap-1"><ArrowDownRight className="w-3.5 h-3.5" /> {liveMetrics.variancePct}% vs baseline</p>
        </div>
        <div className="bg-white border border-[#FFD9EC] rounded-2xl p-4 cursor-pointer hover:border-[#F53799] hover:shadow-md transition-all group" onClick={() => setSelectedKpi({ title: `Primary Drag: ${contributionDrivers[0].title}`, current: contributionDrivers[0].impact, formatter: (v) => `-₱${Math.abs(Number(v)).toLocaleString()}`, icon: <Package className="w-5 h-5 text-red-600" />, description: `${contributionDrivers[0].title} accounted for ${contributionDrivers[0].pctOfVariance}% of total revenue drop.`, extraStats: [{ label: "Impact Share", value: `${contributionDrivers[0].pctOfVariance}% of total drop` }, { label: "Sector", value: sectorFilter.toUpperCase() }] })}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#223047]/60">Primary Drag</span>
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-[#FFF0F8] group-hover:text-[#F53799] transition-colors"><ChevronRight className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-extrabold text-[#223047] leading-tight">-₱{Math.abs(contributionDrivers[0].impact).toLocaleString()}</div>
          <p className="text-[11px] font-medium text-[#223047]/60 mt-1 truncate">{contributionDrivers[0].title} ({contributionDrivers[0].pctOfVariance}%)</p>
        </div>
        <div className="bg-white border border-[#FFD9EC] rounded-2xl p-4 cursor-pointer hover:border-[#F53799] hover:shadow-md transition-all group" onClick={() => setSelectedKpi({ title: `Secondary Drag: ${contributionDrivers[1].title}`, current: contributionDrivers[1].impact, formatter: (v) => `-₱${Math.abs(Number(v)).toLocaleString()}`, icon: <CloudRain className="w-5 h-5 text-blue-600" />, description: `${contributionDrivers[1].title} accounted for ${contributionDrivers[1].pctOfVariance}% of total revenue drop.`, extraStats: [{ label: "Impact Share", value: `${contributionDrivers[1].pctOfVariance}% of total drop` }, { label: "Sector", value: sectorFilter.toUpperCase() }] })}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#223047]/60">Secondary Drag</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-[#FFF0F8] group-hover:text-[#F53799] transition-colors"><ChevronRight className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-extrabold text-[#223047] leading-tight">-₱{Math.abs(contributionDrivers[1].impact).toLocaleString()}</div>
          <p className="text-[11px] font-medium text-[#223047]/60 mt-1 truncate">{contributionDrivers[1].title} ({contributionDrivers[1].pctOfVariance}%)</p>
        </div>
        <div className="bg-white border border-[#BBF7D0] rounded-2xl p-4 cursor-pointer hover:border-[#10B981] hover:shadow-md transition-all group" onClick={() => setSelectedKpi({ title: "Current Sector Revenue", current: liveMetrics.currentRevenue, previous: liveMetrics.baseRevenue, currentLabel: "Current Period", previousLabel: "Prior Baseline", formatter: (v) => `₱${Number(v).toLocaleString()}`, icon: <TrendingUp className="w-5 h-5 text-[#10B981]" />, growth: { text: `₱${liveMetrics.currentRevenue.toLocaleString()}`, className: "text-[#10B981] font-bold" }, description: `Total revenue realized in ${sectorFilter.toUpperCase()} for ${periodLabel}.`, extraStats: [{ label: "Active Sector", value: sectorFilter.toUpperCase() }, { label: "Current Volume", value: `₱${liveMetrics.currentRevenue.toLocaleString()}` }] })}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#166534]">Current Period Sales</span>
            <div className="w-7 h-7 rounded-lg bg-green-50 text-[#10B981] flex items-center justify-center group-hover:bg-[#F0FDF4] transition-colors"><ChevronRight className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-extrabold text-[#10B981] leading-tight">₱{liveMetrics.currentRevenue.toLocaleString()}</div>
          <p className="text-[11px] font-semibold text-[#10B981] mt-1 flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5" /> Realized Sales Output</p>
        </div>
      </div>

      {/* ── 4. DIMENSION TAB NAVIGATION ── */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl p-2 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {[
            { key: "waterfall", label: "Revenue Waterfall & Decomposition", icon: <TrendingDown className="w-4 h-4" /> },
            { key: "channel", label: "1. Channel", icon: <Store className="w-4 h-4" /> },
            { key: "category", label: "2. Category", icon: <Layers className="w-4 h-4" /> },
            { key: "product", label: "3. SKU", icon: <ShoppingBag className="w-4 h-4" /> },
            { key: "stockouts", label: "4. Stock", icon: <Package className="w-4 h-4" /> },
            { key: "weather", label: "5. Weather and Time", icon: <CloudRain className="w-4 h-4" /> },
            { key: "promotion", label: "6. Promotion", icon: <Tag className="w-4 h-4" /> },
            { key: "discount", label: "7. Discount", icon: <Percent className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as DimensionTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === tab.key ? "bg-[#F53799] text-white shadow-xs" : "text-[#223047]/70 hover:bg-[#FFF0F8] hover:text-[#F53799]"}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB 1: REVENUE WATERFALL DECOMPOSITION & MACRO SUITE ── */}
      {activeTab === "waterfall" && (
        <div className="space-y-6">
          {/* Card: Counterfactual Revenue Curve */}
          <div className="bg-white border border-[#FFD9EC] rounded-2xl p-5 md:p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF0F8] flex items-center justify-center">
                    <Activity className="w-4 h-4 text-[#F53799]" />
                  </div>
                  <h2 className="text-base font-bold text-[#223047]">Counterfactual Revenue Curve (Actual vs. Simulated Ideal)</h2>
                  <InfoTooltip label={`Live comparison: realized actual sales curve vs. counterfactual trajectory without stockouts and storm disruptions (${periodLabel})`} />
                  <Badge className="bg-[#FFF0F8] text-[#F53799] border-[#FFD9EC] text-xs font-semibold">Simulation</Badge>
                </div>
              </div>
              <div className="flex gap-4 text-xs font-semibold ml-10 md:ml-0 flex-shrink-0">
                <span className="flex items-center gap-1.5 text-[#F53799]"><span className="w-5 h-0.5 bg-[#F53799] inline-block rounded" /> Actual</span>
                <span className="flex items-center gap-1.5 text-[#10B981]"><span className="w-5 h-0.5 bg-[#10B981] inline-block rounded" style={{ borderTop: "2px dashed #10B981" }} /> Ideal Baseline</span>
                <span className="text-[#223047]/50">Gap: -₱{Math.abs(liveMetrics.totalVariance).toLocaleString()}</span>
              </div>
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={counterfactualData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                  <defs>
                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F53799" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#F53799" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="idealGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FFE5F2" />
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#223047", fontWeight: 600 }} interval={4} />
                  <YAxis tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: "#223047" }} />
                  <Tooltip
                    formatter={(val: any, name: string) => [`₱${Number(val).toLocaleString()}`, name === "actual" ? "Actual Revenue" : "Ideal (Simulated)"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #FFD9EC" }}
                  />
                  <Area type="monotone" dataKey="ideal" stroke="#10B981" strokeWidth={2} strokeDasharray="5 3" fill="url(#idealGrad)" dot={false} name="ideal" />
                  <Area type="monotone" dataKey="actual" stroke="#F53799" strokeWidth={2.5} fill="url(#actualGrad)" dot={false} name="actual" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[#FFF0F8] border border-[#FFD9EC]">
                <div className="text-[10px] font-bold text-[#223047]/60 uppercase">Opportunity Gap</div>
                <div className="text-lg font-extrabold text-[#F53799]">-₱{Math.abs(liveMetrics.totalVariance).toLocaleString()}</div>
                <div className="text-[10px] text-[#223047]/50">Recoverable this period</div>
              </div>
              <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                <div className="text-[10px] font-bold text-green-700 uppercase">Simulated Ideal</div>
                <div className="text-lg font-extrabold text-green-700">₱{liveMetrics.baseRevenue.toLocaleString()}</div>
                <div className="text-[10px] text-green-700/60">If top drags were mitigated</div>
              </div>
              <div className="p-3 rounded-xl bg-[#FFF7FB] border border-[#FFD9EC]">
                <div className="text-[10px] font-bold text-[#223047]/60 uppercase">Actual Realized</div>
                <div className="text-lg font-extrabold text-[#223047]">₱{liveMetrics.currentRevenue.toLocaleString()}</div>
                <div className="text-[10px] text-[#223047]/50">{liveMetrics.variancePct}% below baseline</div>
              </div>
            </div>
          </div>

          {/* Grid: Waterfall Bar Chart + Corrective Action Blueprint */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-[#FFD9EC] rounded-2xl p-5 md:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#223047]">Revenue Waterfall Decomposition ({sectorFilter.toUpperCase()})</h3>
                    <InfoTooltip label={`Hover each bar for mini rain gauge and 10-day trend microcharts - ${periodLabel}`} />
                  </div>
                </div>
                <Badge className="bg-[#FFF0F8] text-[#F53799] border-[#FFD9EC] font-bold">Variance: -₱{Math.abs(liveMetrics.totalVariance).toLocaleString()}</Badge>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FFE5F2" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#223047", fontWeight: 600 }} />
                    <YAxis tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#223047" }} />
                    <Tooltip content={<WaterfallCustomTooltip />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {waterfallData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 pt-4 border-t border-[#FFD9EC] space-y-2">
                <div className="text-xs font-bold text-[#223047] uppercase tracking-wider">Top Contribution Factors ({sectorFilter.toUpperCase()})</div>
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
                      <div className={`text-xs font-bold ${driver.impact < 0 ? "text-red-600" : "text-green-600"}`}>{driver.impact < 0 ? "" : "+"}₱{driver.impact.toLocaleString()}</div>
                      <div className="text-[10px] text-[#223047]/50">{driver.pctOfVariance}% of variance</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#FFD9EC] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#223047]">
                <Zap className="w-4 h-4 text-[#F53799]" /> Corrective Action Blueprint ({sectorFilter.toUpperCase()})
              </div>
              {contributionDrivers.slice(0, 3).map((driver, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-[#FFD9EC] bg-[#FFF7FB] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#223047] flex items-center gap-1.5"><driver.icon className="w-3.5 h-3.5 text-[#F53799]" /> {driver.title}</span>
                    <span className="text-xs font-bold text-red-600">₱{driver.impact.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-[#223047]/80 leading-relaxed font-medium">{driver.actionableAdvice}</p>
                </div>
              ))}
              <Button onClick={() => router.push("/prescriptive-intelligence")} className="w-full bg-[#F53799] hover:bg-[#D42A7D] text-white text-xs font-semibold py-2.5 rounded-xl shadow-xs">
                Execute Auto-Mitigation Rules <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Grid: Sankey Loss Flow & Shapley Attribution side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sankey Card */}
            <div className="bg-white border border-[#FFD9EC] rounded-2xl p-5 md:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-[#FFF0F8] flex items-center justify-center">
                  <GitBranch className="w-4 h-4 text-[#F53799]" />
                </div>
                <h2 className="text-base font-bold text-[#223047]">Revenue Loss Flow (Sankey)</h2>
                <InfoTooltip label={`How baseline revenue leaked into individual loss drivers - ${sectorFilter.toUpperCase()}`} />
              </div>
              <SankeyDiagram totalVariance={liveMetrics.totalVariance} drivers={contributionDrivers} />
              <div className="mt-3 flex flex-wrap gap-2">
                {contributionDrivers.filter((d) => d.impact < 0).map((d, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full" style={{ background: `${d.color}15`, color: d.color, border: `1px solid ${d.color}30` }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
                    {d.title}: -₱{Math.abs(d.impact).toLocaleString()}
                  </span>
                ))}
              </div>
            </div>

            {/* Shapley Values Card */}
            <div className="bg-white border border-[#FFD9EC] rounded-2xl p-5 md:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-[#FFF0F8] flex items-center justify-center">
                  <Brain className="w-4 h-4 text-[#F53799]" />
                </div>
                <h2 className="text-base font-bold text-[#223047]">Shapley Value Attribution</h2>
                <InfoTooltip label={`Fair game-theoretic allocation of variance to each operational driver - ${sectorFilter.toUpperCase()}`} />
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">Marginal Contribution</Badge>
              </div>
              <div className="space-y-2.5">
                {shapleyData.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: `${d.color}08`, border: `1px solid ${d.color}25` }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ background: d.color }}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#223047] truncate">{d.name}</div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${d.shapley}%`, background: d.color }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-extrabold" style={{ color: d.color }}>{d.shapley}%</div>
                      <div className="text-[10px] text-[#223047]/50">₱{Math.abs(d.impact).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: CHANNEL TAB ── */}
      {activeTab === "channel" && (
        <div className="bg-white border border-[#FFD9EC] rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#223047]">1. Channel Revenue Variance ({sectorFilter.toUpperCase()})</h3>
              <InfoTooltip label={`Revenue contribution and percentage changes across sales channels for ${periodLabel}`} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#FFD9EC] bg-[#FFF7FB] text-[#223047]">
                  <th className="p-3">Sales Channel</th><th className="p-3">Prior Baseline</th><th className="p-3">Current Sales</th><th className="p-3">Variance (₱)</th><th className="p-3">% Change</th><th className="p-3">Primary Root Cause Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FFD9EC]/60">
                {channelContribution.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FFF0F8]/40 transition-colors">
                    <td className="p-3 font-bold text-[#223047] flex items-center gap-2"><Store className="w-4 h-4 text-[#F53799]" /> {row.channel}</td>
                    <td className="p-3 font-medium text-[#223047]/70">₱{row.prior.toLocaleString()}</td>
                    <td className="p-3 font-bold text-[#223047]">₱{row.current.toLocaleString()}</td>
                    <td className={`p-3 font-bold ${row.variance < 0 ? "text-red-600" : "text-green-600"}`}>₱{row.variance.toLocaleString()}</td>
                    <td className="p-3 font-bold"><span className={`px-2 py-0.5 rounded-md ${row.pctChange < 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{row.pctChange}%</span></td>
                    <td className="p-3 font-medium text-[#223047]/80">{row.primaryReason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: CATEGORY TAB ── */}
      {activeTab === "category" && (
        <div className="bg-white border border-[#FFD9EC] rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#223047]">2. Category Revenue Variance ({sectorFilter.toUpperCase()})</h3>
              <InfoTooltip label={`Category-level revenue drops and top drag factors for ${periodLabel}`} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#FFD9EC] bg-[#FFF7FB] text-[#223047]">
                  <th className="p-3">Product / Service Category</th><th className="p-3">Prior Baseline</th><th className="p-3">Current Sales</th><th className="p-3">Variance</th><th className="p-3">% Change</th><th className="p-3">Primary Impact Factor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FFD9EC]/60">
                {categoryContribution.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FFF0F8]/40 transition-colors">
                    <td className="p-3 font-bold text-[#223047]">{row.category}</td>
                    <td className="p-3 font-medium text-[#223047]/70">₱{row.prior.toLocaleString()}</td>
                    <td className="p-3 font-bold text-[#223047]">₱{row.current.toLocaleString()}</td>
                    <td className={`p-3 font-bold ${row.variance < 0 ? "text-red-600" : "text-green-600"}`}>{row.variance >= 0 ? "+" : ""}₱{row.variance.toLocaleString()}</td>
                    <td className="p-3 font-bold"><span className={`px-2 py-0.5 rounded-md ${row.pctChange < 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{row.pctChange >= 0 ? "+" : ""}{row.pctChange}%</span></td>
                    <td className="p-3 font-medium text-[#223047]/80">{row.impactFactor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: PRODUCT / SKU TAB ── */}
      {activeTab === "product" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#FFD9EC] rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-red-600 flex items-center gap-2"><TrendingDown className="w-4 h-4" /> Top Negative Contributor SKUs ({sectorFilter.toUpperCase()})</h3>
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
          <div className="bg-white border border-[#BBF7D0] rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-green-600 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Top Positive Contributor SKUs ({sectorFilter.toUpperCase()})</h3>
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

      {/* ── TAB 5: STOCK TAB ── */}
      {activeTab === "stockouts" && (
        <div className="bg-white border border-[#FFD9EC] rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#223047]">4. Stock & Out-of-Stock (OOS) Impact</h3>
                <InfoTooltip label={`Estimated revenue lost due to depleted shelf stock for ${periodLabel}`} />
              </div>
            </div>
            <Badge className="bg-red-50 text-red-700 border-red-200">Total OOS Drag: -₱{Math.abs(contributionDrivers[0].impact).toLocaleString()}</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#FFD9EC] bg-[#FFF7FB] text-[#223047]">
                  <th className="p-3">SKU & Item Name</th><th className="p-3">Days Out of Stock</th><th className="p-3">Est. Lost Sales</th><th className="p-3">Current Stock</th><th className="p-3">Reorder Point</th><th className="p-3">Supplier Lead Time</th>
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

      {/* ── TAB 6: WEATHER AND TIME TAB ── */}
      {activeTab === "weather" && (
        <div className="space-y-6">
          {/* Card: Revenue Intensity Heatmap Grid */}
          <div className="bg-white border border-[#FFD9EC] rounded-2xl p-5 md:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-[#FFF0F8] flex items-center justify-center">
                <Grid3X3 className="w-4 h-4 text-[#F53799]" />
              </div>
              <h2 className="text-base font-bold text-[#223047]">Demand & Revenue Intensity Heatmap Matrix</h2>
              <InfoTooltip label={`Day of week x Hour of day footfall intensity showing when weather disruptions hurt sales the most (${periodLabel})`} />
            </div>
            <div className="overflow-x-auto">
              <div style={{ minWidth: 520 }}>
                <div className="flex mb-1">
                  <div className="w-12 flex-shrink-0" />
                  {heatmapData[0].cells.map((c) => (
                    <div key={c.hour} className="flex-1 text-center text-[10px] font-bold text-[#223047]/60">{c.hour}</div>
                  ))}
                </div>
                {heatmapData.map((row) => (
                  <div key={row.day} className="flex mb-1 items-center">
                    <div className="w-12 flex-shrink-0 text-xs font-bold text-[#223047]">{row.day}</div>
                    {row.cells.map((cell) => {
                      const { bg, text } = heatColor(cell.value);
                      return (
                        <div
                          key={cell.hour}
                          className="flex-1 mx-0.5 rounded-lg h-9 flex items-center justify-center text-[10px] font-bold transition-all hover:scale-110 cursor-default select-none shadow-2xs"
                          style={{ backgroundColor: bg, color: text }}
                          title={`${row.day} ${cell.hour}: ${Math.round(cell.value * 100)}% intensity`}
                        >
                          {Math.round(cell.value * 100)}%
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div className="flex items-center gap-3 mt-3 ml-12 flex-wrap">
                  {[{ label: "≥85% Peak", bg: "#EF4444" }, { label: "70-84% High", bg: "#F97316" }, { label: "55-69% Mid", bg: "#F59E0B" }, { label: "40-54% Low", bg: "#84CC16" }, { label: "<40% Quiet", bg: "#E0F2FE" }].map((l) => (
                    <div key={l.label} className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: l.bg }} />
                      <span className="text-[10px] text-[#223047]/60">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card: Severe Weather Log */}
          <div className="bg-white border border-[#FFD9EC] rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#223047]">5. Weather and Time Disruption Log</h3>
                <InfoTooltip label={`Impact of severe rain downpours on walk-in transactions vs delivery channel lift for ${periodLabel}`} />
              </div>
            </div>
            <div className="space-y-3">
              {weatherDetails.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-[#FFD9EC] bg-[#FFF7FB] flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><CloudRain className="w-5 h-5" /></div>
                    <div>
                      <div className="text-xs font-bold text-[#223047]">{item.date}</div>
                      <div className="text-[11px] text-[#223047]/60">Precipitation: {item.rainMm} mm rainfall</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-xs">
                    <div><span className="text-[#223047]/60 block text-[10px]">Footfall Drop</span><span className="font-bold text-red-600">{item.footfallDrop}</span></div>
                    <div><span className="text-[#223047]/60 block text-[10px]">Cafe Rev Loss</span><span className="font-bold text-red-600">-{item.cafeRevDrop}</span></div>
                    <div><span className="text-[#223047]/60 block text-[10px]">Delivery Lift</span><span className="font-bold text-green-600">{item.deliverySpike}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: PROMOTION TAB ── */}
      {activeTab === "promotion" && (
        <div className="bg-white border border-[#FFD9EC] rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#223047]">6. Promotional Campaign Contribution ({sectorFilter.toUpperCase()})</h3>
              <InfoTooltip label={`Evaluating campaign expiration drag vs active promotion conversions for ${periodLabel}`} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
              <span className="text-xs font-bold text-purple-700">Expired Promo Drag: -₱{Math.abs(contributionDrivers[1]?.impact || contributionDrivers[0]?.impact).toLocaleString()}</span>
              <p className="text-xs text-[#223047]/80 leading-relaxed font-medium">The seasonal bundle promotion ended recently, causing a drop in addon orders during peak customer hours.</p>
            </div>
            <div className="p-4 rounded-xl border border-green-200 bg-green-50/40 space-y-2">
              <span className="text-xs font-bold text-green-700">Active Campaign Lift: +₱{Math.round(liveMetrics.currentRevenue * 0.08).toLocaleString()}</span>
              <p className="text-xs text-[#223047]/80 leading-relaxed font-medium">'Paw-Spa Weekend Grooming Combo' achieved high claim rates and generated new client signups.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 8: DISCOUNT TAB ── */}
      {activeTab === "discount" && (
        <div className="bg-white border border-[#FFD9EC] rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#223047]">7. Discount & Margin Surrender Analysis ({sectorFilter.toUpperCase()})</h3>
              <InfoTooltip label={`Assessing voucher markdowns and margin erosion across platform channels for ${periodLabel}`} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-[#FFD9EC] bg-[#FFF7FB]">
              <span className="text-xs font-semibold text-[#223047]/60">Gross Sales</span>
              <div className="text-xl font-bold text-[#223047] mt-1">₱{Math.round(liveMetrics.currentRevenue * 1.09).toLocaleString()}</div>
              <div className="text-[10px] text-[#223047]/50 mt-0.5">Before platform markdowns</div>
            </div>
            <div className="p-4 rounded-xl border border-[#FFD9EC] bg-[#FFF7FB]">
              <span className="text-xs font-semibold text-red-600">Discounts Surrendered</span>
              <div className="text-xl font-bold text-red-600 mt-1">-₱{Math.round(liveMetrics.currentRevenue * 0.09).toLocaleString()}</div>
              <div className="text-[10px] text-red-600/80 mt-0.5">Vouchers & promotional markdowns</div>
            </div>
            <div className="p-4 rounded-xl border border-green-200 bg-green-50">
              <span className="text-xs font-semibold text-green-700">Net Realized Revenue</span>
              <div className="text-xl font-bold text-green-700 mt-1">₱{liveMetrics.currentRevenue.toLocaleString()}</div>
              <div className="text-[10px] text-green-700/80 mt-0.5">8.2% margin surrendered</div>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. GEN AI MULTI-FACTOR ROOT CAUSE SYNTHESIS ── */}
      <GenAiExplanationCard
        feature="descriptive_explanation"
        title={`Gen AI Multi-Factor Root Cause Synthesis (${sectorFilter.toUpperCase()})`}
        prompt={`Synthesize why revenue fell during ${periodLabel} for ${sectorFilter.toUpperCase()} across channel, category, SKU, stockouts, weather, promotions, and discounts. Provide a clear executive summary and rank the top 3 corrective measures.`}
        context={{
          periodFilter,
          sectorFilter,
          totalVariance: liveMetrics.totalVariance,
          baseRevenue: liveMetrics.baseRevenue,
          currentRevenue: liveMetrics.currentRevenue,
          drivers: contributionDrivers,
          stockoutLosses: stockoutDetails,
          weatherLosses: weatherDetails,
        }}
      />
    </div>
  );
}
