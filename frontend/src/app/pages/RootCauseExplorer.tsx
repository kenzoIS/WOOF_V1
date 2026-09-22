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
import { getDashboard, getRetailForecastByChannel } from "../lib/api";
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
  const [loading, setLoading] = useState(false);
  const [realtimeRefresh, setRealtimeRefresh] = useState(0);

  // Data states
  const [cafeData, setCafeData] = useState<any>(null);
  const [servicesData, setServicesData] = useState<any>(null);
  const [retailData, setRetailData] = useState<any>(null);
  const [retailChannels, setRetailChannels] = useState<any>(null);

  // Realtime socket event listener for live updates
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

  // Fetch live dashboard & channel data
  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      getDashboard("cafe").then(setCafeData).catch(() => {}),
      getDashboard("services").then(setServicesData).catch(() => {}),
      getDashboard("retail").then(setRetailData).catch(() => {}),
      getRetailForecastByChannel().then(setRetailChannels).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [periodFilter, sectorFilter, realtimeRefresh]);

  // 1. Period multiplier logic
  const periodMult = useMemo(() => {
    if (periodFilter === "last90") return 2.85;
    if (periodFilter === "ytd") return 8.4;
    return 1.0; // last30
  }, [periodFilter]);

  const periodLabel = useMemo(() => {
    if (periodFilter === "last90") return "Last 90 Days vs Prior 90 Days";
    if (periodFilter === "ytd") return "YTD 2026 vs Prior YTD 2025";
    return "Last 30 Days vs Prior 30 Days";
  }, [periodFilter]);

  // 2. Dynamic Revenue Computation based on Sector & Period Filters
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
    const totalVariance = currentRevenue - baseRevenue; // Negative drop

    return {
      currentRevenue,
      baseRevenue,
      totalVariance,
      variancePct: Number(((totalVariance / baseRevenue) * 100).toFixed(1)),
    };
  }, [cafeData, servicesData, retailData, sectorFilter, periodMult]);

  // 3. Dynamic Contribution Drivers per sector & period
  const contributionDrivers = useMemo(() => {
    const absVar = Math.abs(liveMetrics.totalVariance);

    if (sectorFilter === "cafe") {
      return [
        {
          id: "weather",
          title: "Monsoon Rain Footfall Loss",
          impact: -Math.round(absVar * 0.45),
          pctOfVariance: 45.0,
          color: "#3B82F6",
          icon: CloudRain,
          summary: "Monsoon downpours reduced afternoon cafe dining foot traffic by ~34%.",
          actionableAdvice: "Activate rainy day delivery vouchers (+15% discount on Food Delivery Apps).",
        },
        {
          id: "promotion",
          title: "Expired Afternoon Promo",
          impact: -Math.round(absVar * 0.30),
          pctOfVariance: 30.0,
          color: "#8B5CF6",
          icon: Tag,
          summary: "Expiration of 'Summer Refresh Combo' dropped pastry addon conversions.",
          actionableAdvice: "Relaunch 'Monsoon Warmup Bundle' (Coffee + Pastry combo at ₱220).",
        },
        {
          id: "discount",
          title: "Voucher Margin Loss",
          impact: -Math.round(absVar * 0.25),
          pctOfVariance: 25.0,
          color: "#F59E0B",
          icon: Percent,
          summary: "Platform discounts eroded gross espresso margin on food app orders.",
          actionableAdvice: "Cap promo discount caps at 12% max per checkout.",
        },
      ];
    }

    if (sectorFilter === "services") {
      return [
        {
          id: "stockouts",
          title: "Groomer Staffing & Suite Caps",
          impact: -Math.round(absVar * 0.50),
          pctOfVariance: 50.0,
          color: "#EF4444",
          icon: Package,
          summary: "Weekend grooming suite capacity limits resulted in 14 unfulfilled appointment requests.",
          actionableAdvice: "Schedule 2 additional senior groomers for weekend afternoon peak slots.",
        },
        {
          id: "weather",
          title: "Rainy Day Appointment Delays",
          impact: -Math.round(absVar * 0.35),
          pctOfVariance: 35.0,
          color: "#3B82F6",
          icon: CloudRain,
          summary: "Heavy downpours led to late cancellations for pet bath & blow-dry appointments.",
          actionableAdvice: "Offer free reschedule vouchers valid for 7 days during storm warnings.",
        },
        {
          id: "services_growth",
          title: "Hydrotherapy Spa Growth",
          impact: Math.round(absVar * 0.15),
          pctOfVariance: -15.0,
          color: "#10B981",
          icon: TrendingUp,
          summary: "New Hydrotherapy Spa packages grew +18.4% in bookings.",
          actionableAdvice: "Promote Hydrotherapy Spa addon during standard grooming check-in.",
        },
      ];
    }

    if (sectorFilter === "retail") {
      return [
        {
          id: "stockouts",
          title: "Stockouts on Top Pet Food SKUs",
          impact: -Math.round(absVar * 0.48),
          pctOfVariance: 48.0,
          color: "#EF4444",
          icon: Package,
          summary: "Premium Dog Food 5kg was out-of-stock for 12 key sales days on Shopee & Store.",
          actionableAdvice: "Increase reorder buffer for Top 3 SKUs and set auto-reorder triggers at 25 units.",
        },
        {
          id: "discount",
          title: "Shopee Flash Voucher Discounts",
          impact: -Math.round(absVar * 0.32),
          pctOfVariance: 32.0,
          color: "#F59E0B",
          icon: Percent,
          summary: "Aggressive platform voucher markdowns surrendered 8.5% of retail gross sales.",
          actionableAdvice: "Rebalance discount vouchers with threshold minimum spends.",
        },
        {
          id: "promotion",
          title: "Expired TikTok Livestream Bundle",
          impact: -Math.round(absVar * 0.20),
          pctOfVariance: 20.0,
          color: "#8B5CF6",
          icon: Tag,
          summary: "End of TikTok creator collab bundle dropped accessory conversions.",
          actionableAdvice: "Partner with top pet creators for a weekend flash stream bundle.",
        },
      ];
    }

    // Default: SectorFilter === "all"
    return [
      {
        id: "stockouts",
        title: "Stock Availability & Stockouts",
        impact: -Math.round(absVar * 0.38),
        pctOfVariance: 38.0,
        color: "#EF4444",
        icon: Package,
        summary: "Top retail items experienced stockout days during peak weekend demand.",
        actionableAdvice: "Increase reorder buffer for top SKUs and set auto-reorder triggers at 25 units.",
      },
      {
        id: "weather",
        title: "Weather & Heavy Rainfall",
        impact: -Math.round(absVar * 0.25),
        pctOfVariance: 25.0,
        color: "#3B82F6",
        icon: CloudRain,
        summary: "Heavy monsoon rain reduced walk-in cafe foot traffic during peak afternoon hours.",
        actionableAdvice: "Activate rainy day delivery vouchers (+15% discount on Shopee/TikTok) to offset store drop.",
      },
      {
        id: "promotion",
        title: "Expired Promo Campaigns",
        impact: -Math.round(absVar * 0.20),
        pctOfVariance: 20.0,
        color: "#8B5CF6",
        icon: Tag,
        summary: "Expiration of summer combo promotions lowered addon order conversion rates.",
        actionableAdvice: "Relaunch 'Monsoon Warmup Bundle' (Coffee + Pastry combo at ₱220).",
      },
      {
        id: "discount",
        title: "Margin Surrender (Discounts)",
        impact: -Math.round(absVar * 0.17),
        pctOfVariance: 17.0,
        color: "#F59E0B",
        icon: Percent,
        summary: "Increased reliance on platform flash vouchers eroded gross product margins.",
        actionableAdvice: "Cap platform voucher discount caps at 12% max per checkout.",
      },
      {
        id: "services_growth",
        title: "Grooming & Services Growth",
        impact: Math.round(absVar * 0.10),
        pctOfVariance: -10.0,
        color: "#10B981",
        icon: TrendingUp,
        summary: "Grooming suite booking demand rose, partially mitigating retail revenue drops.",
        actionableAdvice: "Expand grooming slot capacity during weekend afternoon peak hours.",
      },
    ];
  }, [liveMetrics, sectorFilter]);

  // 4. Waterfall Chart Data calculated dynamically
  const waterfallData = useMemo(() => {
    const base = liveMetrics.baseRevenue;
    const finalRev = liveMetrics.currentRevenue;

    if (sectorFilter === "cafe") {
      return [
        { name: "Prior Baseline", value: base, fill: "#223047", type: "base" },
        { name: "Rain Interruption", value: contributionDrivers[0].impact, fill: "#3B82F6", type: "neg" },
        { name: "Expired Promos", value: contributionDrivers[1].impact, fill: "#8B5CF6", type: "neg" },
        { name: "Margin Surrender", value: contributionDrivers[2].impact, fill: "#F59E0B", type: "neg" },
        { name: "Current Revenue", value: finalRev, fill: "#F53799", type: "final" },
      ];
    }

    if (sectorFilter === "services") {
      return [
        { name: "Prior Baseline", value: base, fill: "#223047", type: "base" },
        { name: "Suite Capacity Caps", value: contributionDrivers[0].impact, fill: "#EF4444", type: "neg" },
        { name: "Rain Cancellations", value: contributionDrivers[1].impact, fill: "#3B82F6", type: "neg" },
        { name: "Spa Growth", value: contributionDrivers[2].impact, fill: "#10B981", type: "pos" },
        { name: "Current Revenue", value: finalRev, fill: "#06B6D4", type: "final" },
      ];
    }

    if (sectorFilter === "retail") {
      return [
        { name: "Prior Baseline", value: base, fill: "#223047", type: "base" },
        { name: "Food Stockouts", value: contributionDrivers[0].impact, fill: "#EF4444", type: "neg" },
        { name: "Shopee Vouchers", value: contributionDrivers[1].impact, fill: "#F59E0B", type: "neg" },
        { name: "Expired TikTok Bundle", value: contributionDrivers[2].impact, fill: "#8B5CF6", type: "neg" },
        { name: "Current Revenue", value: finalRev, fill: "#8B5CF6", type: "final" },
      ];
    }

    // Default: SectorFilter === "all"
    return [
      { name: "Prior Baseline", value: base, fill: "#223047", type: "base" },
      { name: "Stockouts", value: contributionDrivers[0].impact, fill: "#EF4444", type: "neg" },
      { name: "Rain Interruption", value: contributionDrivers[1].impact, fill: "#3B82F6", type: "neg" },
      { name: "Expired Promos", value: contributionDrivers[2].impact, fill: "#8B5CF6", type: "neg" },
      { name: "Discount Margin Loss", value: contributionDrivers[3].impact, fill: "#F59E0B", type: "neg" },
      { name: "Grooming Growth", value: contributionDrivers[4].impact, fill: "#10B981", type: "pos" },
      { name: "Current Revenue", value: finalRev, fill: "#F53799", type: "final" },
    ];
  }, [liveMetrics, contributionDrivers, sectorFilter]);

  // 5. Dynamic Channel Contribution Data per sector
  const channelContribution = useMemo(() => {
    const total = liveMetrics.currentRevenue;

    if (sectorFilter === "cafe") {
      return [
        { channel: "Dine-in POS Counter", prior: Math.round(total * 0.65), current: Math.round(total * 0.52), variance: Math.round(total * 0.52) - Math.round(total * 0.65), pctChange: -20.0, primaryReason: "Rain downpours reduced store visits" },
        { channel: "Takeout Counter", prior: Math.round(total * 0.32), current: Math.round(total * 0.28), variance: Math.round(total * 0.28) - Math.round(total * 0.32), pctChange: -12.5, primaryReason: "Expired morning pastry deal" },
        { channel: "Food App Delivery", prior: Math.round(total * 0.19), current: Math.round(total * 0.20), variance: Math.round(total * 0.20) - Math.round(total * 0.19), pctChange: +5.2, primaryReason: "Rainy day delivery order spike" },
      ];
    }

    if (sectorFilter === "services") {
      return [
        { channel: "Online Suite Booking", prior: Math.round(total * 0.60), current: Math.round(total * 0.58), variance: Math.round(total * 0.58) - Math.round(total * 0.60), pctChange: -3.3, primaryReason: "Weekend afternoon suite capacity maxed" },
        { channel: "In-Store Reception POS", prior: Math.round(total * 0.46), current: Math.round(total * 0.42), variance: Math.round(total * 0.42) - Math.round(total * 0.46), pctChange: -8.7, primaryReason: "Rainy day walk-in grooming cancellations" },
      ];
    }

    if (sectorFilter === "retail") {
      return [
        { channel: "Physical Store POS", prior: Math.round(total * 0.52), current: Math.round(total * 0.42), variance: Math.round(total * 0.42) - Math.round(total * 0.52), pctChange: -19.2, primaryReason: "Stockout on Premium Dog Food 5kg" },
        { channel: "Shopee Marketplace", prior: Math.round(total * 0.38), current: Math.round(total * 0.36), variance: Math.round(total * 0.36) - Math.round(total * 0.38), pctChange: -5.2, primaryReason: "Platform flash voucher margin loss" },
        { channel: "TikTok Shop", prior: Math.round(total * 0.26), current: Math.round(total * 0.22), variance: Math.round(total * 0.22) - Math.round(total * 0.26), pctChange: -15.3, primaryReason: "Expired creator promo bundle" },
      ];
    }

    // Default: "all"
    return [
      { channel: "Physical Store POS", prior: Math.round(total * 0.53), current: Math.round(total * 0.44), variance: Math.round(total * 0.44) - Math.round(total * 0.53), pctChange: -16.9, primaryReason: "Monsoon rain reduced walk-in foot traffic & 6 stockout days" },
      { channel: "Shopee Marketplace", prior: Math.round(total * 0.36), current: Math.round(total * 0.34), variance: Math.round(total * 0.34) - Math.round(total * 0.36), pctChange: -5.5, primaryReason: "Stockouts on Premium Dog Food 5kg" },
      { channel: "TikTok Shop", prior: Math.round(total * 0.15), current: Math.round(total * 0.14), variance: Math.round(total * 0.14) - Math.round(total * 0.15), pctChange: -6.6, primaryReason: "Expired livestream promotional bundle" },
      { channel: "Direct Delivery", prior: Math.round(total * 0.10), current: Math.round(total * 0.08), variance: Math.round(total * 0.08) - Math.round(total * 0.10), pctChange: -20.0, primaryReason: "Delivery courier delays on heavy rain days" },
    ];
  }, [liveMetrics, sectorFilter]);

  // 6. Dynamic Category Contribution Data per sector
  const categoryContribution = useMemo(() => {
    const total = liveMetrics.currentRevenue;

    if (sectorFilter === "cafe") {
      return [
        { category: "Espresso & Coffee", prior: Math.round(total * 0.55), current: Math.round(total * 0.48), variance: Math.round(total * 0.48) - Math.round(total * 0.55), pctChange: -12.7, impactFactor: "Rainy Day Footfall Drop" },
        { category: "Bakery & Pastries", prior: Math.round(total * 0.32), current: Math.round(total * 0.26), variance: Math.round(total * 0.26) - Math.round(total * 0.32), pctChange: -18.7, impactFactor: "Expired Afternoon Combo Promo" },
        { category: "Cold Brews & Frappes", prior: Math.round(total * 0.29), current: Math.round(total * 0.26), variance: Math.round(total * 0.26) - Math.round(total * 0.29), pctChange: -10.3, impactFactor: "Voucher Discount Surrender" },
      ];
    }

    if (sectorFilter === "services") {
      return [
        { category: "Full Grooming Package", prior: Math.round(total * 0.52), current: Math.round(total * 0.48), variance: Math.round(total * 0.48) - Math.round(total * 0.52), pctChange: -7.6, impactFactor: "Suite Capacity Limit" },
        { category: "Basic Bath & Blow-dry", prior: Math.round(total * 0.30), current: Math.round(total * 0.27), variance: Math.round(total * 0.27) - Math.round(total * 0.30), pctChange: -10.0, impactFactor: "Rain Cancellations" },
        { category: "Hydrotherapy Spa", prior: Math.round(total * 0.24), current: Math.round(total * 0.25), variance: Math.round(total * 0.25) - Math.round(total * 0.24), pctChange: +4.1, impactFactor: "Spa Promo Launch" },
      ];
    }

    if (sectorFilter === "retail") {
      return [
        { category: "Pet Care & Dry Food", prior: Math.round(total * 0.62), current: Math.round(total * 0.49), variance: Math.round(total * 0.49) - Math.round(total * 0.62), pctChange: -20.9, impactFactor: "Stockout & Inventory Depletion" },
        { category: "Treats & Chews", prior: Math.round(total * 0.30), current: Math.round(total * 0.27), variance: Math.round(total * 0.27) - Math.round(total * 0.30), pctChange: -10.0, impactFactor: "Competitor Shopee Markdown" },
        { category: "Pet Accessories", prior: Math.round(total * 0.24), current: Math.round(total * 0.24), variance: 0, pctChange: 0.0, impactFactor: "Stable Steady Sales" },
      ];
    }

    // Default: "all"
    return [
      { category: "Pet Care & Dry Food", prior: Math.round(total * 0.40), current: Math.round(total * 0.33), variance: Math.round(total * 0.33) - Math.round(total * 0.40), pctChange: -17.5, impactFactor: "Stockout & Inventory Depletion" },
      { category: "Espresso & Beverages", prior: Math.round(total * 0.28), current: Math.round(total * 0.24), variance: Math.round(total * 0.24) - Math.round(total * 0.28), pctChange: -14.3, impactFactor: "Weather / Reduced Footfall" },
      { category: "Bakery & Pastries", prior: Math.round(total * 0.13), current: Math.round(total * 0.11), variance: Math.round(total * 0.11) - Math.round(total * 0.13), pctChange: -15.4, impactFactor: "Expired Afternoon Promo" },
      { category: "Grooming Services", prior: Math.round(total * 0.21), current: Math.round(total * 0.23), variance: Math.round(total * 0.23) - Math.round(total * 0.21), pctChange: +9.5, impactFactor: "Suite Capacity Expansion" },
      { category: "Pet Accessories", prior: Math.round(total * 0.10), current: Math.round(total * 0.09), variance: Math.round(total * 0.09) - Math.round(total * 0.10), pctChange: -10.0, impactFactor: "Voucher Discount Surrender" },
    ];
  }, [liveMetrics, sectorFilter]);

  // 7. Dynamic SKU Level Drag vs Growth per sector
  const topProductDrags = useMemo(() => {
    if (sectorFilter === "cafe") {
      return [
        { sku: "BEV-002", name: "Iced Caramel Macchiato", variance: -Math.round(7200 * periodMult), unitDrop: -Math.round(45 * periodMult), rootCause: "Rainy weekday afternoon footfall drop" },
        { sku: "BAK-001", name: "Chocolate Chip Muffin", variance: -Math.round(4800 * periodMult), unitDrop: -Math.round(30 * periodMult), rootCause: "Expired morning combo promotion" },
        { sku: "BEV-005", name: "Cold Brew Bottle 500ml", variance: -Math.round(3200 * periodMult), unitDrop: -Math.round(18 * periodMult), rootCause: "Out of stock packaging bottles" },
      ];
    }

    if (sectorFilter === "services") {
      return [
        { sku: "SRV-002", name: "Weekend Deluxe Suite Boarding", variance: -Math.round(5400 * periodMult), unitDrop: -Math.round(4 * periodMult), rootCause: "Suite capacity limit reached during peak" },
        { sku: "SRV-004", name: "Express Pet Wash & Dry", variance: -Math.round(3800 * periodMult), unitDrop: -Math.round(12 * periodMult), rootCause: "Rainy day appointment cancellations" },
      ];
    }

    if (sectorFilter === "retail") {
      return [
        { sku: "DOG-001", name: "Premium Dog Food 5kg", variance: -Math.round(16400 * periodMult), unitDrop: -Math.round(13 * periodMult), rootCause: "12 days out of stock during peak weekend" },
        { sku: "ACC-004", name: "Deluxe Pet Collar Pink", variance: -Math.round(4800 * periodMult), unitDrop: -Math.round(15 * periodMult), rootCause: "Expired combo deal with Grooming" },
        { sku: "CAT-005", name: "Dental Chew Treats 200g", variance: -Math.round(3600 * periodMult), unitDrop: -Math.round(20 * periodMult), rootCause: "Competitor price markdown on Shopee" },
      ];
    }

    // Default: "all"
    return [
      { sku: "DOG-001", name: "Premium Dog Food 5kg", variance: -Math.round(16400 * periodMult), unitDrop: -Math.round(13 * periodMult), rootCause: "12 days out of stock during peak weekend" },
      { sku: "BEV-002", name: "Iced Caramel Macchiato", variance: -Math.round(7200 * periodMult), unitDrop: -Math.round(45 * periodMult), rootCause: "Rainy weekday afternoon footfall drop" },
      { sku: "ACC-004", name: "Deluxe Pet Collar Pink", variance: -Math.round(4800 * periodMult), unitDrop: -Math.round(15 * periodMult), rootCause: "Expired combo deal with Grooming" },
      { sku: "CAT-005", name: "Dental Chew Treats 200g", variance: -Math.round(3600 * periodMult), unitDrop: -Math.round(20 * periodMult), rootCause: "Competitor price markdown on Shopee" },
    ];
  }, [sectorFilter, periodMult]);

  const topProductGains = useMemo(() => {
    if (sectorFilter === "cafe") {
      return [
        { sku: "BEV-008", name: "Hot Matcha Oat Latte", variance: Math.round(3400 * periodMult), unitGain: Math.round(22 * periodMult), rootCause: "High demand on rainy cold afternoons" },
      ];
    }

    if (sectorFilter === "services") {
      return [
        { sku: "SRV-001", name: "Full Grooming Package", variance: Math.round(4200 * periodMult), unitGain: Math.round(6 * periodMult), rootCause: "High re-booking rate from repeat pet owners" },
        { sku: "SRV-003", name: "Hydrotherapy Spa Bath", variance: Math.round(1800 * periodMult), unitGain: Math.round(3 * periodMult), rootCause: "New seasonal spa promotional offer" },
      ];
    }

    if (sectorFilter === "retail") {
      return [
        { sku: "TOY-002", name: "Interactive Squeak Toy", variance: Math.round(2800 * periodMult), unitGain: Math.round(14 * periodMult), rootCause: "Viral TikTok shop video feature" },
      ];
    }

    // Default: "all"
    return [
      { sku: "SRV-001", name: "Full Grooming Package", variance: Math.round(4200 * periodMult), unitGain: Math.round(6 * periodMult), rootCause: "High re-booking rate from repeat pet owners" },
      { sku: "SRV-003", name: "Hydrotherapy Bath", variance: Math.round(1800 * periodMult), unitGain: Math.round(3 * periodMult), rootCause: "New seasonal spa promotional offer" },
    ];
  }, [sectorFilter, periodMult]);

  // 8. Dynamic Stockout Details
  const stockoutDetails = useMemo(() => [
    { sku: "DOG-001", name: "Premium Dog Food 5kg", daysOOS: 12, lostSalesEst: Math.round(Math.abs(contributionDrivers[0].impact) * 0.8), currentStock: 0, reorderPoint: 20, supplierLeadDays: 4 },
    { sku: "DOG-005", name: "Dental Chew Treats", daysOOS: 8, lostSalesEst: Math.round(Math.abs(contributionDrivers[0].impact) * 0.2), currentStock: 2, reorderPoint: 25, supplierLeadDays: 3 },
  ], [contributionDrivers]);

  // 9. Dynamic Weather Details
  const weatherDetails = useMemo(() => [
    { date: "Jul 12 (Heavy Rain)", footfallDrop: "-38%", cafeRevDrop: `₱${Math.round(Math.abs(contributionDrivers[1].impact) * 0.35).toLocaleString()}`, deliverySpike: "+12%", rainMm: 45 },
    { date: "Jul 18 (Typhoon Signal 1)", footfallDrop: "-52%", cafeRevDrop: `₱${Math.round(Math.abs(contributionDrivers[1].impact) * 0.45).toLocaleString()}`, deliverySpike: "+18%", rainMm: 82 },
    { date: "Aug 02 (Monsoon Downpour)", footfallDrop: "-29%", cafeRevDrop: `₱${Math.round(Math.abs(contributionDrivers[1].impact) * 0.20).toLocaleString()}`, deliverySpike: "+8%", rainMm: 38 },
  ], [contributionDrivers]);

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
              className="text-xs font-semibold text-[#223047] bg-transparent border-none focus:outline-none pr-2 cursor-pointer"
            >
              <option value="last30">Last 30 Days vs Prior 30 Days</option>
              <option value="last90">Last 90 Days vs Prior 90 Days</option>
              <option value="ytd">YTD 2026 vs Prior YTD 2025</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-[#FFD9EC] rounded-xl p-1 shadow-sm">
            <Filter className="w-4 h-4 text-[#06B6D4] ml-2" />
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value as any)}
              className="text-xs font-semibold text-[#223047] bg-transparent border-none focus:outline-none pr-2 cursor-pointer"
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
      <div className="bg-gradient-to-r from-[#FFF0F8] via-[#FFF7FB] to-[#F0FDF4] border-2 border-[#FFD9EC] rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm relative overflow-hidden transition-all duration-300">
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
                  Diagnostic Breakdown ({sectorFilter.toUpperCase()})
                </span>
                <span className="text-xs text-[#223047]/50 font-medium">{periodLabel}</span>
              </div>
              <Badge className="bg-red-50 text-red-700 border-red-200 text-xs font-bold">
                Variance: -₱{Math.abs(liveMetrics.totalVariance).toLocaleString()} ({liveMetrics.variancePct}%)
              </Badge>
            </div>

            <p className="text-xs md:text-sm text-[#223047] font-medium leading-relaxed">
              “Woof! In <strong>{sectorFilter === "all" ? "All Business Sectors" : `${sectorFilter.toUpperCase()} Sector`}</strong> for <strong>{periodLabel}</strong>, revenue changed by <strong>-₱{Math.abs(liveMetrics.totalVariance).toLocaleString()} ({liveMetrics.variancePct}%)</strong>. My contribution analysis shows that <strong>{contributionDrivers[0].pctOfVariance}% of the drop (-₱{Math.abs(contributionDrivers[0].impact).toLocaleString()})</strong> was caused by <strong>{contributionDrivers[0].title}</strong>, while <strong>{contributionDrivers[1].pctOfVariance}% (-₱{Math.abs(contributionDrivers[1].impact).toLocaleString()})</strong> was due to <strong>{contributionDrivers[1].title}</strong>. Correcting these top 2 factors can recover up to <strong>₱{Math.round(Math.abs(liveMetrics.totalVariance) * 0.65).toLocaleString()}</strong> of lost revenue!”
            </p>

            <div className="mt-3 pt-3 border-t border-[#FFD9EC]/60 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-4 text-xs font-semibold text-[#223047]/80">
                {contributionDrivers.slice(0, 3).map((driver, idx) => (
                  <span key={idx} className="flex items-center gap-1" style={{ color: driver.color }}>
                    <driver.icon className="w-3.5 h-3.5" /> {driver.title}: -₱{(Math.abs(driver.impact) / 1000).toFixed(1)}k
                  </span>
                ))}
              </div>

              <Button
                onClick={() => setActiveTab(contributionDrivers[0].id as any || "stockouts")}
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
            title: `Total Revenue Variance (${sectorFilter.toUpperCase()})`,
            current: liveMetrics.totalVariance,
            previous: liveMetrics.baseRevenue,
            currentLabel: "Current Period Revenue",
            previousLabel: "Prior Period Baseline",
            formatter: (v) => `₱${Number(v).toLocaleString()}`,
            icon: <TrendingDown className="w-5 h-5 text-red-600" />,
            growth: { text: `${liveMetrics.variancePct}%`, className: "text-red-600 font-bold" },
            description: `Net difference between current period revenue (₱${liveMetrics.currentRevenue.toLocaleString()}) and prior period baseline (₱${liveMetrics.baseRevenue.toLocaleString()}) for ${periodLabel}.`,
            extraStats: [
              { label: "Baseline Target", value: `₱${liveMetrics.baseRevenue.toLocaleString()}` },
              { label: "Net Difference", value: `-₱${Math.abs(liveMetrics.totalVariance).toLocaleString()}` },
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
            -₱{Math.abs(liveMetrics.totalVariance).toLocaleString()}
          </div>
          <p className="text-[11px] font-semibold text-red-600 mt-1 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" /> {liveMetrics.variancePct}% vs baseline period
          </p>
        </div>

        {/* Primary Drag */}
        <div
          className="bg-white border border-[#FFD9EC] rounded-2xl p-4 cursor-pointer hover:border-[#F53799] hover:shadow-md transition-all group"
          onClick={() => setSelectedKpi({
            title: `Primary Drag: ${contributionDrivers[0].title}`,
            current: contributionDrivers[0].impact,
            formatter: (v) => `-₱${Math.abs(Number(v)).toLocaleString()}`,
            icon: <Package className="w-5 h-5 text-red-600" />,
            description: `${contributionDrivers[0].title} accounted for ${contributionDrivers[0].pctOfVariance}% of total revenue drop in ${sectorFilter.toUpperCase()}.`,
            extraStats: [
              { label: "Impact Share", value: `${contributionDrivers[0].pctOfVariance}% of total drop` },
              { label: "Sector Context", value: sectorFilter.toUpperCase() },
            ],
          })}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#223047]/60">Primary Drag</span>
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-[#FFF0F8] group-hover:text-[#F53799] transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#223047] leading-tight">
            -₱{Math.abs(contributionDrivers[0].impact).toLocaleString()}
          </div>
          <p className="text-[11px] font-medium text-[#223047]/60 mt-1 truncate">
            {contributionDrivers[0].title} ({contributionDrivers[0].pctOfVariance}%)
          </p>
        </div>

        {/* Secondary Drag */}
        <div
          className="bg-white border border-[#FFD9EC] rounded-2xl p-4 cursor-pointer hover:border-[#F53799] hover:shadow-md transition-all group"
          onClick={() => setSelectedKpi({
            title: `Secondary Drag: ${contributionDrivers[1].title}`,
            current: contributionDrivers[1].impact,
            formatter: (v) => `-₱${Math.abs(Number(v)).toLocaleString()}`,
            icon: <CloudRain className="w-5 h-5 text-blue-600" />,
            description: `${contributionDrivers[1].title} accounted for ${contributionDrivers[1].pctOfVariance}% of total revenue drop.`,
            extraStats: [
              { label: "Impact Share", value: `${contributionDrivers[1].pctOfVariance}% of total drop` },
              { label: "Sector Context", value: sectorFilter.toUpperCase() },
            ],
          })}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#223047]/60">Secondary Drag</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-[#FFF0F8] group-hover:text-[#F53799] transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#223047] leading-tight">
            -₱{Math.abs(contributionDrivers[1].impact).toLocaleString()}
          </div>
          <p className="text-[11px] font-medium text-[#223047]/60 mt-1 truncate">
            {contributionDrivers[1].title} ({contributionDrivers[1].pctOfVariance}%)
          </p>
        </div>

        {/* Positive Offset / Net Profit */}
        <div
          className="bg-white border border-[#BBF7D0] rounded-2xl p-4 cursor-pointer hover:border-[#10B981] hover:shadow-md transition-all group"
          onClick={() => setSelectedKpi({
            title: "Current Sector Revenue",
            current: liveMetrics.currentRevenue,
            previous: liveMetrics.baseRevenue,
            currentLabel: "Current Period",
            previousLabel: "Prior Baseline",
            formatter: (v) => `₱${Number(v).toLocaleString()}`,
            icon: <TrendingUp className="w-5 h-5 text-[#10B981]" />,
            growth: { text: `₱${liveMetrics.currentRevenue.toLocaleString()}`, className: "text-[#10B981] font-bold" },
            description: `Total revenue generated in ${sectorFilter.toUpperCase()} sector during ${periodLabel}.`,
            extraStats: [
              { label: "Active Sector", value: sectorFilter.toUpperCase() },
              { label: "Current Volume", value: `₱${liveMetrics.currentRevenue.toLocaleString()}` },
            ],
          })}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#166534]">Current Period Sales</span>
            <div className="w-7 h-7 rounded-lg bg-green-50 text-[#10B981] flex items-center justify-center group-hover:bg-[#F0FDF4] transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#10B981] leading-tight">
            ₱{liveMetrics.currentRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] font-semibold text-[#10B981] mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Realized Sales Output
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
                <h3 className="text-base font-bold text-[#223047]">Revenue Waterfall Decomposition ({sectorFilter.toUpperCase()})</h3>
                <p className="text-xs text-[#223047]/60">Step-by-step contribution breakdown for {periodLabel}</p>
              </div>
              <Badge className="bg-[#FFF0F8] text-[#F53799] border-[#FFD9EC] font-bold">
                Variance: -₱{Math.abs(liveMetrics.totalVariance).toLocaleString()}
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
                <Zap className="w-4 h-4 text-[#F53799]" /> Corrective Action Blueprint ({sectorFilter.toUpperCase()})
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
                className="w-full bg-[#F53799] hover:bg-[#D42A7D] text-white text-xs font-semibold py-2.5 rounded-xl shadow-xs"
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
              <h3 className="text-base font-bold text-[#223047]">1. Channel Revenue Variance ({sectorFilter.toUpperCase()})</h3>
              <p className="text-xs text-[#223047]/60">Revenue contribution & percentage changes across sales channels for {periodLabel}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#FFD9EC] bg-[#FFF7FB] text-[#223047]">
                  <th className="p-3">Sales Channel</th>
                  <th className="p-3">Prior Baseline</th>
                  <th className="p-3">Current Sales</th>
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
            <h3 className="text-base font-bold text-[#223047]">2. Category Revenue Variance ({sectorFilter.toUpperCase()})</h3>
            <p className="text-xs text-[#223047]/60">Category-level revenue drops and top drag factors for {periodLabel}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#FFD9EC] bg-[#FFF7FB] text-[#223047]">
                  <th className="p-3">Product / Service Category</th>
                  <th className="p-3">Prior Baseline</th>
                  <th className="p-3">Current Sales</th>
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
              <TrendingDown className="w-4 h-4" /> Top Negative Contributor SKUs ({sectorFilter.toUpperCase()})
            </h3>
            <div className="space-y-2.5">
              {topProductDrags.map((item: { sku: string; name: string; variance: number; unitDrop: number; rootCause: string }, idx: number) => (
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
              <TrendingUp className="w-4 h-4" /> Top Positive Contributor SKUs ({sectorFilter.toUpperCase()})
            </h3>
            <div className="space-y-2.5">
              {topProductGains.map((item: { sku: string; name: string; variance: number; unitGain: number; rootCause: string }, idx: number) => (
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
              <p className="text-xs text-[#223047]/60">Estimated revenue lost due to depleted shelf stock during peak demand periods for {periodLabel}</p>
            </div>
            <Badge className="bg-red-50 text-red-700 border-red-200">
              Total OOS Drag: -₱{Math.abs(contributionDrivers[0].impact).toLocaleString()}
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
            <p className="text-xs text-[#223047]/60">Impact of severe rain downpours on walk-in cafe transactions vs delivery channel spikes for {periodLabel}</p>
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
            <h3 className="text-base font-bold text-[#223047]">6. Promotional Campaign Contribution ({sectorFilter.toUpperCase()})</h3>
            <p className="text-xs text-[#223047]/60">Evaluating campaign expiration drag vs active promotion conversions for {periodLabel}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
              <span className="text-xs font-bold text-purple-700">Expired Promo Drag: -₱{Math.abs(contributionDrivers[1]?.impact || contributionDrivers[0]?.impact).toLocaleString()}</span>
              <p className="text-xs text-[#223047]/80 leading-relaxed font-medium">
                The seasonal bundle promotion ended recently, causing a drop in addon orders during peak customer hours.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-green-200 bg-green-50/40 space-y-2">
              <span className="text-xs font-bold text-green-700">Active Campaign Lift: +₱{Math.round(liveMetrics.currentRevenue * 0.08).toLocaleString()}</span>
              <p className="text-xs text-[#223047]/80 leading-relaxed font-medium">
                'Paw-Spa Weekend Grooming Combo' achieved high claim rates and generated new client signups.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 7. DISCOUNT TAB */}
      {activeTab === "discount" && (
        <div className="bg-white border border-[#FFD9EC] rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#223047]">7. Discount & Margin Surrender Analysis ({sectorFilter.toUpperCase()})</h3>
            <p className="text-xs text-[#223047]/60">Assessing voucher markdowns and margin erosion across platform channels for {periodLabel}</p>
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

      {/* INTEGRATED GEN AI ROOT CAUSE EXPLANATION CARD */}
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
