import { useEffect, useMemo, useState } from "react";
import { FlaskConical, Sparkles, TrendingUp, Target, Network, Map, Zap } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Slider } from "../components/ui/slider";
import { getCrossSell } from "../lib/api";
import aiMascot from "../../imports/no_bg_AI.png";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
} from "recharts";
import { toast } from "sonner";

interface CrossSellRule {
  itemA: string;
  itemB: string;
  antecedents?: string[];
  consequents?: string[];
  antecedentSectors?: string[];
  consequentSectors?: string[];
  support: number;
  confidence: number;
  lift: number;
  cooccurrences?: number;
  isMultiItem?: boolean;
  crossSector?: boolean;
}

interface BundleCandidate {
  anchorItem: string;
  bundleItem: string;
  itemA?: string;
  itemB?: string;
  anchorVelocity?: string;
  bundleVelocity?: string;
  anchorSupport?: number;
  bundleSupport?: number;
  pairSupport?: number;
  confidence: number;
  lift: number;
  cooccurrences?: number;
  opportunityScore?: number;
  reason?: string;
  antecedentSectors?: string[];
  consequentSectors?: string[];
  crossSector?: boolean;
  isLowAssociation?: boolean;
}

interface ItemMetric {
  item: string;
  sector: string;
  sectors?: string[];
  support: number;
  basketCount: number;
  velocity: "fast" | "moderate" | "slow";
}

interface HourlyTransactionVolume {
  hour: number;
  label: string;
  transactions: number;
}

interface CrossSellResponse {
  rules?: CrossSellRule[];
  bundleCandidates?: BundleCandidate[];
  itemMetrics?: ItemMetric[];
  rawAnalysis?: {
    totalTransactions?: number;
    totalLineItems?: number;
    uniqueItemCount?: number;
    totalRevenue?: number;
    selectedHour?: number | null;
    multiItemBaskets?: number;
    avgItemsPerBasket?: number;
    crossSectorBasketRate?: number;
    peakHour?: HourlyTransactionVolume | null;
    hourlyTransactionVolume?: HourlyTransactionVolume[];
    sectorMix?: Array<{
      sector: string;
      lineItems: number;
      transactionCount: number;
    }>;
  };
  totalBaskets?: number;
  multiItemBaskets?: number;
  crossSectorRate?: number;
  cached?: boolean;
  message?: string;
  error?: string;
}

const sectorColors: Record<string, string> = {
  cafe: "#D2B48C",
  retail: "#F59E0B",
  services: "#0D9488",
  service: "#0D9488",
  unknown: "#A78BFA",
};

const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const formatPercent = (value?: number) =>
  `${Math.round((value || 0) * 100)}%`;

const formatPair = (left: string, right: string) => `${left} + ${right}`;

const firstSector = (sectors?: string[]) => sectors?.[0] || "unknown";

const formatSector = (sector?: string) => {
  const value = sector || "unknown";
  if (value === "cafe") return "Cafe";
  if (value === "retail") return "Retail";
  if (value === "services" || value === "service") return "Services";
  return "Unknown";
};

const formatSectorPair = (sectors: string[]) =>
  sectors.map(formatSector).join(" + ");

export function AISimulation() {
  const [activeTab, setActiveTab] = useState("bundle-simulator");
  const [discountValue, setDiscountValue] = useState([15]);
  const [floorplanTime, setFloorplanTime] = useState([14]); // 2 PM (14 in 24h format)
  const [dataTime, setDataTime] = useState([13]); // 1 PM for Bundle Simulator

  // Live Behavioral Web states
  const [supportThreshold, setSupportThreshold] = useState([5]);
  const [confidenceLevel, setConfidenceLevel] = useState([60]);
  const [fpGrowthTime, setFpGrowthTime] = useState([13]); // Time slider for FP-Growth
  const [crossSellData, setCrossSellData] = useState<CrossSellResponse | null>(null);
  const [crossSellLoading, setCrossSellLoading] = useState(false);
  const [crossSellError, setCrossSellError] = useState<string | null>(null);

  // Scenario Builder states
  const [scenarioName, setScenarioName] = useState("Weekend Promo Campaign");
  const [weather, setWeather] = useState("sunny");
  const [promoActive, setPromoActive] = useState(true);
  const [dayOfWeek, setDayOfWeek] = useState("saturday");
  const [temperature, setTemperature] = useState([28]);
  const [competitorEvent, setCompetitorEvent] = useState(false);
  const [paydayWeekend, setPaydayWeekend] = useState(false);

  const tabs = [
    { id: "bundle-simulator", label: "Bundle Simulator", icon: Sparkles },
    { id: "pricing-lab", label: "Pricing Laboratory", icon: TrendingUp },
    { id: "traffic-optimizer", label: "Traffic Optimizer", icon: Map },
    { id: "scenario-builder", label: "Scenario Builder", icon: FlaskConical },
  ];

  const handleDeployBundle = (bundle: string) => {
    toast.success("Bundle deployed!", {
      description: `${bundle} is now active and will be promoted at optimal times.`,
    });
  };

  const handleBundleTimeChange = (value: number[]) => {
    setDataTime(value);
    setFpGrowthTime(value);
  };

  useEffect(() => {
    let cancelled = false;
    setCrossSellLoading(true);
    setCrossSellError(null);

    getCrossSell({
      minSupport: (supportThreshold[0] / 100).toFixed(2),
      minConfidence: (confidenceLevel[0] / 100).toFixed(2),
      minLift: "1.20",
      maxBundleCandidates: "20",
      hour: String(dataTime[0]),
    })
      .then((result: CrossSellResponse) => {
        if (!cancelled) {
          setCrossSellData(result);
          if (result.error) {
            setCrossSellError(result.error);
          }
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setCrossSellError(error.message);
          setCrossSellData(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCrossSellLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [supportThreshold, confidenceLevel, dataTime]);

  const handleRunSimulation = () => {
    toast.info("Running simulation...", {
      description: "Calculating optimal pricing and demand scenarios...",
    });
    setTimeout(() => {
      toast.success("Simulation complete!", {
        description: "Results updated with latest parameters.",
      });
    }, 2000);
  };

  // Format hour for display (7 AM - 7 PM)
  const formatHour = (value: number) => {
    if (value === 12) return "12:00 PM";
    if (value > 12) return `${value - 12}:00 PM`;
    return `${value}:00 AM`;
  };

  const rules = crossSellData?.rules || [];
  const bundleCandidates = crossSellData?.bundleCandidates || [];
  const itemMetrics = crossSellData?.itemMetrics || [];
  const rawAnalysis = crossSellData?.rawAnalysis;
  const avgRuleLift =
    rules.length > 0
      ? rules.reduce((sum, rule) => sum + (rule.lift || 0), 0) / rules.length
      : 0;
  const avgRuleConfidence =
    rules.length > 0
      ? rules.reduce((sum, rule) => sum + (rule.confidence || 0), 0) / rules.length
      : 0;
  const peakHourLabel = rawAnalysis?.peakHour?.label || "No data";
  const maxCoPurchaseFrequency = Math.max(
    1,
    ...rules.map((rule) => rule.cooccurrences || 0),
  );

  // Transaction volume data based on time selection
  const transactionVolumeData = useMemo(() => {
    const rows = rawAnalysis?.hourlyTransactionVolume || [];
    return Array.from({ length: 13 }, (_, i) => {
      const hour = i + 7; // 7 AM to 7 PM
      const row = rows.find((item) => item.hour === hour);
      return {
        hour: formatHour(hour),
        transactions: row?.transactions || 0,
        selected: hour === dataTime[0],
      };
    });
  }, [dataTime, rawAnalysis]);

  // Co-purchase patterns based on time
  const coPurchaseData = useMemo(() => {
    return rules
      .slice()
      .sort((a, b) => (b.cooccurrences || 0) - (a.cooccurrences || 0))
      .slice(0, 5)
      .map((rule) => ({
        pair: formatPair(rule.itemA, rule.itemB),
        frequency: rule.cooccurrences || 0,
      }));
  }, [rules]);

  // Bundle predictions based on time analysis
  const bundlePredictions = useMemo(() => {
    const lowAssociation = bundleCandidates.map((candidate) => ({
      bundle: formatPair(candidate.anchorItem, candidate.bundleItem),
      confidence: Math.round((candidate.confidence || 0) * 100),
      lift: candidate.lift || 0,
      score: Math.round((candidate.opportunityScore || 0) * 100),
      frequency: candidate.cooccurrences || 0,
      type: "Fast + Slow opportunity",
      sectors: [
        firstSector(candidate.antecedentSectors),
        firstSector(candidate.consequentSectors),
      ],
      sectorPair: formatSectorPair([
        firstSector(candidate.antecedentSectors),
        firstSector(candidate.consequentSectors),
      ]),
      reason:
        candidate.reason ||
        "Fast-moving item paired with a slower-moving item that is not already strongly associated.",
    }));
    const significantRules = rules.map((rule) => ({
      bundle: formatPair(rule.itemA, rule.itemB),
      confidence: Math.round((rule.confidence || 0) * 100),
      lift: rule.lift || 0,
      score: Math.round(Math.min(99, (rule.lift || 0) * 35)),
      frequency: rule.cooccurrences || 0,
      type: rule.isMultiItem ? "Multi-item FP-Growth rule" : "Significant FP-Growth rule",
      sectors: [
        firstSector(rule.antecedentSectors),
        firstSector(rule.consequentSectors),
      ],
      sectorPair: formatSectorPair([
        firstSector(rule.antecedentSectors),
        firstSector(rule.consequentSectors),
      ]),
      reason: "Significant association rule mined from ingested transaction baskets.",
    }));

    return [...lowAssociation, ...significantRules]
      .sort(
        (a, b) =>
          b.score - a.score ||
          b.confidence - a.confidence ||
          b.lift - a.lift,
      )
      .slice(0, 8);
  }, [bundleCandidates, rules]);

  const proximityRecommendations = useMemo(() => {
    return bundlePredictions.slice(0, 6).map((bundle, index) => {
      const color =
        sectorColors[bundle.sectors[0]] ||
        sectorColors[bundle.sectors[1]] ||
        sectorColors.unknown;
      const sameSector =
        bundle.sectors[0] !== "unknown" && bundle.sectors[0] === bundle.sectors[1];
      const advice = sameSector
        ? `Place these ${bundle.sectorPair.toLowerCase()} offers in the same shelf, menu, or service zone to increase discovery inside an already active category.`
        : `Place ${bundle.bundle} near the transition between ${bundle.sectorPair} touchpoints so the stronger purchase intent can expose the slower-moving offer.`;

      return {
        pairing: bundle.bundle,
        advice,
        score: Math.max(1, Math.min(100, bundle.score || bundle.confidence || 0)),
        color,
        sectorPair: bundle.sectorPair,
        rank: index + 1,
      };
    });
  }, [bundlePredictions]);

  // Live Behavioral Web Network Data - Responsive to AI Controls
  const networkNodes = useMemo(() => {
    const supportFilter = supportThreshold[0] / 100;
    const nodeSource: ItemMetric[] = itemMetrics.length
      ? itemMetrics
      : Array.from(
          new globalThis.Map<string, ItemMetric>(
            rules.flatMap((rule) => [
              [
                rule.itemA,
                {
                  item: rule.itemA,
                  sector: firstSector(rule.antecedentSectors),
                  support: rule.support || 0,
                  basketCount: rule.cooccurrences || 0,
                  velocity: "moderate" as const,
                },
              ],
              [
                rule.itemB,
                {
                  item: rule.itemB,
                  sector: firstSector(rule.consequentSectors),
                  support: rule.support || 0,
                  basketCount: rule.cooccurrences || 0,
                  velocity: "moderate" as const,
                },
              ],
            ]),
          ).values(),
        );

    return nodeSource
      .filter((node) => (node.support || 0) >= supportFilter)
      .slice(0, 10)
      .map((node, index, source) => {
        const angle = (Math.PI * 2 * index) / Math.max(source.length, 1) - Math.PI / 2;
        const radius = source.length <= 4 ? 150 : 180;
        const sector = (node.sector || "unknown").toLowerCase();
        return {
          id: slugify(node.item),
          name: node.item,
          category: sector,
          frequency: Math.round((node.support || 0) * 100),
          basketCount: node.basketCount,
          color: sectorColors[sector] || sectorColors.unknown,
          x: 300 + Math.cos(angle) * radius,
          y: 240 + Math.sin(angle) * radius,
        };
      });
  }, [itemMetrics, rules, supportThreshold]);

  const networkConnections = useMemo(() => {
    const confidenceFilter = confidenceLevel[0];
    const supportFilter = supportThreshold[0];
    const nodeIds = new Set(networkNodes.map((node) => node.id));

    return rules
      .map((rule) => ({
        source: slugify(rule.itemA),
        target: slugify(rule.itemB),
        sourceName: rule.itemA,
        targetName: rule.itemB,
        confidence: Math.round((rule.confidence || 0) * 100),
        support: Math.round((rule.support || 0) * 100),
        lift: rule.lift || 0,
        cooccurrences: rule.cooccurrences || 0,
        crossSector: Boolean(rule.crossSector),
      }))
      .filter(
        (conn) =>
          nodeIds.has(conn.source) &&
          nodeIds.has(conn.target) &&
          conn.confidence >= confidenceFilter &&
          conn.support >= supportFilter,
      )
      .sort(
        (a, b) =>
          b.confidence - a.confidence ||
          b.lift - a.lift ||
          b.cooccurrences - a.cooccurrences,
      );
  }, [confidenceLevel, networkNodes, rules, supportThreshold]);

  // Top AI Insights from network analysis
  const topInsights = useMemo(() => {
    const topConnection = networkConnections.length > 0 ? networkConnections[0] : null;
    const topBundle = bundlePredictions[0];
    const crossSectorConnection = networkConnections.find((conn) => conn.crossSector);
    const crossSectorBundle = bundlePredictions.find(
      (bundle) => bundle.sectors[0] !== bundle.sectors[1],
    );

    return {
      topBundle: topConnection
        ? formatPair(topConnection.sourceName, topConnection.targetName)
        : "No patterns detected",
      bundleConfidence: topConnection ? topConnection.confidence : 0,
      bundleLift: topConnection ? topConnection.lift : 0,
      emergingTrend: topBundle?.bundle || "No bundle candidates",
      trendGrowth: topBundle ? `${topBundle.score}% score` : "0% score",
      crossSell: crossSectorConnection
        ? formatPair(crossSectorConnection.sourceName, crossSectorConnection.targetName)
        : crossSectorBundle?.bundle || "No cross-sector pattern",
      crossSellRate: crossSectorConnection
        ? `${crossSectorConnection.confidence}%`
        : crossSectorBundle
          ? `${crossSectorBundle.confidence}%`
          : "0%",
    };
  }, [bundlePredictions, networkConnections]);

  // Dynamic pricing data based on discount slider
  const pricingScenarios = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => {
      const discount = i * 2.5;
      const demandMultiplier = 1 + (discount / 100) * 1.8;
      return {
        discount: discount,
        demand: 100 * demandMultiplier + Math.random() * 20,
        revenue: (100 * demandMultiplier) * (100 - discount) * 0.28,
        margin: 70 - discount * 1.2,
      };
    });
  }, []);

  // Generate predicted customers for floorplan based on time
  const predictedCustomers = useMemo(() => {
    const selectedHour = floorplanTime[0];
    const baseCount = selectedHour >= 12 && selectedHour <= 15 ? 20 : 15;
    const count = Math.floor(baseCount + Math.random() * 8);
    const cafeRatio = selectedHour >= 14 && selectedHour <= 16 ? 0.6 : 0.4;
    
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 90 + 5,
      y: Math.random() * 90 + 5,
      type: Math.random() > cafeRatio ? "cafe" : "grooming",
    }));
  }, [floorplanTime]);

  const capacity = (predictedCustomers.filter((c) => c.type === "grooming").length / 15) * 100;

  // Next 7 Days Traffic Prediction based on time slot
  const trafficPrediction = useMemo(() => {
    const selectedHour = floorplanTime[0];
    return Array.from({ length: 7 }, (_, i) => {
      const baseTraffic = selectedHour >= 14 && selectedHour <= 16 ? 35 : 25;
      return {
        day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
        predicted: baseTraffic + Math.random() * 10 + (i >= 5 ? 15 : 0),
        actual: i < 4 ? baseTraffic - 2 + Math.random() * 12 + (i >= 5 ? 15 : 0) : null,
      };
    });
  }, [floorplanTime]);

  // Past Happy Hour Performance
  const happyHourHistory = [
    { date: "Apr 12", time: "3-4 PM", predicted: "+15%", actual: "+18%", result: "✓", lift: 18 },
    { date: "Apr 10", time: "2-3 PM", predicted: "+12%", actual: "+14%", result: "✓", lift: 14 },
    { date: "Apr 8", time: "4-5 PM", predicted: "+20%", actual: "+16%", result: "~", lift: 16 },
    { date: "Apr 6", time: "3-4 PM", predicted: "+18%", actual: "+22%", result: "✓", lift: 22 },
  ];

  // Calculate scenario outcomes dynamically
  const calculateScenarioOutcome = () => {
    let baseRevenue = 45280;
    let baseOrders = 127;
    
    if (weather === "sunny") {
      baseRevenue *= 1.15;
      baseOrders *= 1.12;
    } else if (weather === "rainy") {
      baseRevenue *= 0.88;
      baseOrders *= 0.85;
    }
    
    if (promoActive) {
      baseRevenue *= 1.18;
      baseOrders *= 1.15;
    }
    
    if (dayOfWeek === "saturday" || dayOfWeek === "sunday") {
      baseRevenue *= 1.22;
      baseOrders *= 1.18;
    }
    
    if (temperature[0] > 30) {
      baseRevenue *= 0.95;
      baseOrders *= 0.97;
    }
    
    if (competitorEvent) {
      baseRevenue *= 0.92;
      baseOrders *= 0.95;
    }
    
    if (paydayWeekend) {
      baseRevenue *= 1.26;
      baseOrders *= 1.20;
    }
    
    const avgTransaction = baseRevenue / baseOrders;
    const cafeShare = 40.8 + (promoActive ? 2.4 : 0) + (weather === "sunny" ? 1.5 : 0);
    
    return {
      revenue: Math.round(baseRevenue),
      orders: Math.round(baseOrders),
      avgTransaction: Math.round(avgTransaction),
      cafeShare: cafeShare.toFixed(1),
      revenueChange: ((baseRevenue - 45280) / 45280 * 100).toFixed(1),
      ordersChange: ((baseOrders - 127) / 127 * 100).toFixed(1),
      avgTransactionChange: ((avgTransaction - 356) / 356 * 100).toFixed(1),
      cafeShareChange: (cafeShare - 40.8).toFixed(1),
    };
  };

  const scenarioOutcome = useMemo(calculateScenarioOutcome, [
    weather,
    promoActive,
    dayOfWeek,
    temperature,
    competitorEvent,
    paydayWeekend,
  ]);

  return (
    <div className="space-y-6 md:space-y-8 lg:space-y-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-3 md:gap-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl lg:text-[36px] font-extrabold text-[#223047]">
            AI Simulation Laboratory
          </h1>
          <p className="text-sm md:text-base text-[#223047] opacity-60 mt-1 md:mt-2" style={{ lineHeight: "1.6" }}>
            Advanced predictive modeling and scenario testing environment
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <Badge className="bg-[#5CE1E6] text-white hover:bg-[#5CE1E6] px-3 md:px-4 py-1 text-xs md:text-sm">
            AI Laboratory
          </Badge>
          <Button onClick={handleRunSimulation} className="bg-[#F53799] hover:bg-[#D42A7D] gap-2 text-sm md:text-base">
            <FlaskConical className="w-4 h-4" />
            <span className="hidden sm:inline">Run Simulation</span>
            <span className="sm:hidden">Run</span>
          </Button>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Active Simulations */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#F53799] to-[#D42A7D] flex items-center justify-center flex-shrink-0">
              <FlaskConical className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">FP-Growth Rules</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{rules.length}</div>
            </div>
          </div>

          {/* Deployed Bundles */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#3AE4FA] to-[#5CE1E6] flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Bundle Candidates</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{bundleCandidates.length}</div>
            </div>
          </div>

          {/* Avg Lift Prediction */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#F53799] to-[#D42A7D] flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Avg Rule Lift</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{avgRuleLift.toFixed(2)}x</div>
            </div>
          </div>

          {/* Confidence Score */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#3AE4FA] to-[#5CE1E6] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Avg Confidence</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{formatPercent(avgRuleConfidence)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-2 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-1.5 md:gap-2 px-2 md:px-4 py-2 md:py-3 rounded-xl transition-all ${
              activeTab === tab.id
                ? "bg-[#F53799] text-white shadow-lg"
                : "bg-white text-[#223047] hover:bg-[#FFF2FA]"
            }`}
          >
            <tab.icon className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-xs md:text-sm font-semibold">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {activeTab === "bundle-simulator" && (
        <div className="space-y-4 md:space-y-6 lg:space-y-8">
          {(crossSellLoading || crossSellError || crossSellData?.message) && (
            <div className="bg-white border border-[#FFD9EC] rounded-xl md:rounded-2xl p-3 md:p-4">
              <div className="text-sm font-semibold text-[#223047]">
                {crossSellLoading
                  ? "Loading live FP-Growth analysis..."
                  : crossSellError
                    ? "Cross-sell analysis unavailable"
                    : crossSellData?.message}
              </div>
              {(crossSellError || crossSellData?.message) && (
                <div className="text-xs text-[#223047] opacity-60 mt-1">
                  Upload more multi-item transaction data or adjust the support and confidence thresholds.
                </div>
              )}
            </div>
          )}
          {/* Raw Transaction Data Sources */}
          <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex-1">
                <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
                  Raw Transaction Data Analysis
                </h2>
                <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
                  Live transaction stream feeding AI pattern detection models
                </p>
              </div>
              <Badge className="bg-[#3AE4FA] text-white hover:bg-[#3AE4FA] text-xs md:text-sm">
                Real-Time Data
              </Badge>
            </div>

            {/* TIME SELECTION SLIDER */}
            <div className="bg-gradient-to-br from-[#FFF7FB] to-[#FFF2FA] border border-[#FFD9EC] rounded-xl md:rounded-2xl p-4 md:p-6 space-y-3 md:space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs md:text-sm font-semibold text-[#223047]">TIME WINDOW SELECTION</div>
                <div className="text-base md:text-lg font-bold text-[#F53799]">{formatHour(dataTime[0])}</div>
              </div>
              
              <div className="relative">
                <Slider
                  value={dataTime}
                  onValueChange={handleBundleTimeChange}
                  max={19}
                  min={7}
                  step={1}
                  className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-[#F53799] [&_[role=slider]]:to-[#3AE4FA] [&_[role=slider]]:w-6 [&_[role=slider]]:h-6 [&_[role=slider]]:border-4 [&_[role=slider]]:border-white [&_[role=slider]]:shadow-lg"
                />
                <div className="flex justify-between mt-3 text-xs text-[#223047] opacity-60">
                  <span>07:00</span>
                  <span>10:00</span>
                  <span>13:00</span>
                  <span>16:00</span>
                  <span>19:00</span>
                </div>
              </div>
            </div>

            {/* Transaction Volume & Co-Purchase Patterns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <div className="bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl md:rounded-2xl p-4 md:p-6 space-y-3 md:space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs md:text-sm font-bold text-[#223047]">Hourly Transaction Volume</h3>
                  <Badge variant="outline" className="text-xs border-[#F53799] text-[#F53799]">
                    Raw Data
                  </Badge>
                </div>
                <ResponsiveContainer width="100%" height={180} className="md:!h-[200px]">
                  <BarChart data={transactionVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#FFD9EC" vertical={false} />
                    <XAxis dataKey="hour" stroke="#223047" style={{ fontSize: "10px" }} />
                    <YAxis stroke="#223047" style={{ fontSize: "10px" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #FFD9EC",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar dataKey="transactions" radius={[6, 6, 0, 0]}>
                      {transactionVolumeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.selected ? "#F53799" : "#3AE4FA"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl md:rounded-2xl p-4 md:p-6 space-y-3 md:space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs md:text-sm font-bold text-[#223047]">Top Product Co-Purchases</h3>
                  <Badge variant="outline" className="text-xs border-[#3AE4FA] text-[#3AE4FA]">
                    {formatHour(dataTime[0])} Window
                  </Badge>
                </div>
                <div className="space-y-3">
                  {coPurchaseData.length === 0 && (
                    <div className="text-sm text-[#223047] opacity-60">
                      No significant co-purchase rules detected for this hour and threshold.
                    </div>
                  )}
                  {coPurchaseData.map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#223047]">{item.pair}</span>
                        <span className="font-bold text-[#F53799]">{item.frequency}×</span>
                      </div>
                      <div className="h-2 bg-[#FFD9EC] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#F53799] to-[#3AE4FA] transition-all"
                          style={{ width: `${(item.frequency / maxCoPurchaseFrequency) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Transaction Insight Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 pt-3 md:pt-4 border-t border-[#FFD9EC]">
              <div className="p-3 md:p-4 bg-gradient-to-br from-[#F53799]/10 to-[#F53799]/5 border border-[#F53799]/20 rounded-lg md:rounded-xl text-center">
                <div className="text-xs text-[#223047] opacity-60 mb-1">Peak Transaction Hour</div>
                <div className="text-base md:text-lg font-bold text-[#F53799]">{peakHourLabel}</div>
              </div>
              <div className="p-3 md:p-4 bg-gradient-to-br from-[#3AE4FA]/10 to-[#3AE4FA]/5 border border-[#3AE4FA]/20 rounded-lg md:rounded-xl text-center">
                <div className="text-xs text-[#223047] opacity-60 mb-1">Avg. Items per Cart</div>
                <div className="text-base md:text-lg font-bold text-[#3AE4FA]">
                  {(rawAnalysis?.avgItemsPerBasket || 0).toFixed(1)}
                </div>
              </div>
              <div className="p-3 md:p-4 bg-gradient-to-br from-[#D42A7D]/10 to-[#D42A7D]/5 border border-[#D42A7D]/20 rounded-lg md:rounded-xl text-center">
                <div className="text-xs text-[#223047] opacity-60 mb-1">Cross-Category %</div>
                <div className="text-base md:text-lg font-bold text-[#D42A7D]">
                  {formatPercent(rawAnalysis?.crossSectorBasketRate)}
                </div>
              </div>
            </div>
          </div>

          {/* LIVE BEHAVIORAL WEB - FP-GROWTH PATTERN DETECTION ENGINE */}
          <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 lg:space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-[#F53799] to-[#D42A7D] flex items-center justify-center shadow-lg flex-shrink-0">
                  <Network className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg md:text-xl lg:text-[24px] font-bold text-[#223047]">
                    Live Behavioral Web <span className="hidden md:inline">(FP-Growth Pattern Detection Engine)</span>
                  </h2>
                  <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
                    Real-time association rule mining with dynamic pattern visualization
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <Badge className="bg-[#F53799] text-white hover:bg-[#F53799] px-3 md:px-4 py-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    AI Learning Active
                  </div>
                </Badge>
                <Badge variant="outline" className="border-[#3AE4FA] text-[#3AE4FA] px-3 md:px-4 py-1.5 text-xs">
                  {networkNodes.length} Active Nodes
                </Badge>
              </div>
            </div>

            {/* SECTION 1 & 2: Main Network Visualization + Interactive Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 md:gap-6 lg:gap-8">
              {/* Network Graph */}
              <div className="bg-gradient-to-br from-[#FFF7FB] to-[#FFF2FA] border border-[#FFD9EC] rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 relative min-h-[400px] md:min-h-[500px] lg:min-h-[560px] overflow-hidden">
                {/* Network Canvas */}
                <div className="w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 600 480" className="w-full h-full max-w-full">
                    {/* Define gradient for glow effect */}
                    <defs>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <linearGradient key="lineGradient-gradient" id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F53799" />
                        <stop offset="100%" stopColor="#3AE4FA" />
                      </linearGradient>
                    </defs>

                    {/* Connection Lines - Varying thickness based on confidence */}
                    {networkConnections.map((conn, idx) => {
                      const sourceNode = networkNodes.find(n => n.id === conn.source);
                      const targetNode = networkNodes.find(n => n.id === conn.target);
                      if (!sourceNode || !targetNode) return null;

                      const sourcePos = { x: sourceNode.x, y: sourceNode.y };
                      const targetPos = { x: targetNode.x, y: targetNode.y };

                      // Line thickness based on confidence (2-12px)
                      const thickness = 2 + (conn.confidence / 100) * 10;
                      const opacity = 0.3 + (conn.confidence / 100) * 0.5;

                      return (
                        <g key={idx}>
                          <line
                            x1={sourcePos.x}
                            y1={sourcePos.y}
                            x2={targetPos.x}
                            y2={targetPos.y}
                            stroke="url(#lineGradient)"
                            strokeWidth={thickness}
                            opacity={opacity}
                            filter={conn.confidence >= 85 ? "url(#glow)" : "none"}
                            strokeLinecap="round"
                          />
                        </g>
                      );
                    })}

                    {/* Product Nodes - Varying sizes based on frequency */}
                    {networkNodes.map((node) => {
                      const pos = { x: node.x, y: node.y };
                      // Node size based on frequency (28-58px radius)
                      const radius = 28 + (node.frequency / 100) * 30;

                      return (
                        <g key={node.id}>
                          {/* Outer glow for high-frequency nodes */}
                          {node.frequency > 80 && (
                            <circle
                              cx={pos.x}
                              cy={pos.y}
                              r={radius + 8}
                              fill={node.color}
                              opacity="0.15"
                            />
                          )}
                          {/* Main node */}
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r={radius}
                            fill="white"
                            stroke={node.color}
                            strokeWidth="4"
                            className="cursor-pointer transition-all hover:stroke-[#F53799]"
                          />
                          {/* Node label */}
                          <text
                            x={pos.x}
                            y={pos.y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-xs font-bold pointer-events-none"
                            fill="#223047"
                          >
                            {node.name.split(" ").map((word: string, i: number) => (
                              <tspan key={i} x={pos.x} dy={i === 0 ? 0 : 14}>
                                {word}
                              </tspan>
                            ))}
                          </text>
                          {/* Frequency badge */}
                          <circle
                            cx={pos.x + radius - 8}
                            cy={pos.y - radius + 8}
                            r="12"
                            fill={node.color}
                          />
                          <text
                            x={pos.x + radius - 8}
                            y={pos.y - radius + 8}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-[9px] font-bold"
                            fill="white"
                          >
                            {Math.round(node.frequency)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Connection Strength Legend */}
                <div className="absolute bottom-3 md:bottom-6 left-3 md:left-6 bg-white/95 backdrop-blur border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 shadow-lg z-10 hidden sm:block">
                  <div className="text-[9px] md:text-[10px] font-bold text-[#223047] mb-1.5 md:mb-2 tracking-wider">CONNECTION STRENGTH</div>
                  <div className="space-y-1 md:space-y-1.5">
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <div className="w-6 md:w-8 h-1 bg-gradient-to-r from-[#F53799] to-[#3AE4FA] rounded-full opacity-40" />
                      <span className="text-[9px] md:text-[10px] text-[#223047]">Weak (&lt;70%)</span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <div className="w-6 md:w-8 h-1.5 bg-gradient-to-r from-[#F53799] to-[#3AE4FA] rounded-full opacity-60" />
                      <span className="text-[9px] md:text-[10px] text-[#223047]">Medium (70-85%)</span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <div className="w-6 md:w-8 h-2.5 bg-gradient-to-r from-[#F53799] to-[#3AE4FA] rounded-full opacity-90 shadow-lg" />
                      <span className="text-[9px] md:text-[10px] text-[#223047] font-semibold">Strong (&gt;85%)</span>
                    </div>
                  </div>
                </div>

                {/* Node Size Legend */}
                <div className="absolute bottom-3 md:bottom-6 right-3 md:right-6 bg-white/95 backdrop-blur border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 shadow-lg z-10 hidden sm:block">
                  <div className="text-[9px] md:text-[10px] font-bold text-[#223047] mb-1.5 md:mb-2 tracking-wider">NODE SIZE = FREQUENCY</div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-[#D2B48C] bg-white" />
                      <span className="text-[9px] md:text-[10px] text-[#223047]">Cafe</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-[#0D9488] bg-white" />
                      <span className="text-[9px] md:text-[10px] text-[#223047]">Service</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-[#F59E0B] bg-white" />
                      <span className="text-[9px] md:text-[10px] text-[#223047]">Retail</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive AI Controls Panel */}
              <div className="space-y-3 md:space-y-4">
                <div className="bg-gradient-to-br from-[#F53799] to-[#D42A7D] border border-[#F53799] rounded-xl md:rounded-2xl p-4 md:p-6 text-white shadow-xl">
                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                    <Target className="w-4 h-4 md:w-5 md:h-5" />
                    <h3 className="text-sm md:text-base font-bold">Interactive AI Controls</h3>
                  </div>
                  <p className="text-xs opacity-90 mb-4 md:mb-6">
                    Adjust thresholds to dynamically filter patterns and recalculate the network graph
                  </p>

                  {/* Support Threshold Slider */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wide">SUPPORT THRESHOLD (%)</span>
                      <span className="text-lg font-bold bg-white/20 backdrop-blur px-3 py-1 rounded-lg">
                        {supportThreshold[0]}%
                      </span>
                    </div>
                    <Slider
                      value={supportThreshold}
                      onValueChange={setSupportThreshold}
                      max={100}
                      min={0}
                      step={5}
                      className="[&_[role=slider]]:bg-white [&_[role=slider]]:w-5 [&_[role=slider]]:h-5 [&_[role=slider]]:shadow-xl [&_[role=slider]]:border-2 [&_[role=slider]]:border-[#F53799]"
                    />
                    <div className="flex justify-between text-[10px] opacity-75">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Confidence Level Slider */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wide">CONFIDENCE LEVEL (%)</span>
                      <span className="text-lg font-bold bg-white/20 backdrop-blur px-3 py-1 rounded-lg">
                        {confidenceLevel[0]}%
                      </span>
                    </div>
                    <Slider
                      value={confidenceLevel}
                      onValueChange={setConfidenceLevel}
                      max={100}
                      min={0}
                      step={5}
                      className="[&_[role=slider]]:bg-white [&_[role=slider]]:w-5 [&_[role=slider]]:h-5 [&_[role=slider]]:shadow-xl [&_[role=slider]]:border-2 [&_[role=slider]]:border-[#F53799]"
                    />
                    <div className="flex justify-between text-[10px] opacity-75">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                {/* Real-time Metrics */}
                <div className="bg-gradient-to-br from-[#FFF7FB] to-white border border-[#FFD9EC] rounded-xl md:rounded-2xl p-4 md:p-5 space-y-3 md:space-y-4">
                  <div className="text-xs font-bold text-[#223047] tracking-wider mb-2 md:mb-3">REAL-TIME METRICS</div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#F53799]/5 rounded-lg">
                      <span className="text-xs text-[#223047]">Active Rules</span>
                      <span className="text-lg font-bold text-[#F53799]">{networkConnections.length}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#3AE4FA]/5 rounded-lg">
                      <span className="text-xs text-[#223047]">Pattern Nodes</span>
                      <span className="text-lg font-bold text-[#3AE4FA]">{networkNodes.length}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#D42A7D]/5 rounded-lg">
                      <span className="text-xs text-[#223047]">Avg Confidence</span>
                      <span className="text-lg font-bold text-[#D42A7D]">
                        {networkConnections.length > 0
                          ? Math.round(networkConnections.reduce((sum, c) => sum + c.confidence, 0) / networkConnections.length)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: AI-Detected Patterns & Top Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
              <div className="bg-gradient-to-br from-[#F53799]/5 to-[#FFF7FB] border-2 border-[#F53799]/30 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-[#F53799] transition-all cursor-pointer">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F53799] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-xs font-bold text-[#F53799] tracking-wider">TOP BUNDLE RECOMMENDATION</div>
                </div>
                <div className="text-lg font-bold text-[#223047] mb-2 capitalize">
                  {topInsights.topBundle}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-[#223047] opacity-60">Confidence:</span>
                    <span className="ml-1 font-bold text-[#F53799]">{topInsights.bundleConfidence}%</span>
                  </div>
                  <div>
                    <span className="text-[#223047] opacity-60">Lift:</span>
                    <span className="ml-1 font-bold text-[#F53799]">{topInsights.bundleLift.toFixed(2)}x</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[#F53799]/20">
                  <div className="text-xs text-green-600 font-semibold">
                    {topInsights.bundleLift > 0
                      ? `${Math.max(0, Math.round(topInsights.bundleLift * 100 - 100))}% association lift over baseline`
                      : "No association lift detected"}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#3AE4FA]/5 to-[#FFF7FB] border-2 border-[#3AE4FA]/30 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-[#3AE4FA] transition-all cursor-pointer">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#3AE4FA] flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-xs font-bold text-[#3AE4FA] tracking-wider">EMERGING TREND</div>
                </div>
                <div className="text-lg font-bold text-[#223047] mb-2">
                  {topInsights.emergingTrend}
                </div>
                <div className="text-sm text-[#223047] opacity-60 mb-3">
                  Highest-ranked model opportunity
                </div>
                <div className="mt-3 pt-3 border-t border-[#3AE4FA]/20">
                  <div className="text-xs text-green-600 font-semibold">
                    {topInsights.trendGrowth} model score
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#D42A7D]/5 to-[#FFF7FB] border-2 border-[#D42A7D]/30 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-[#D42A7D] transition-all cursor-pointer">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D42A7D] flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-xs font-bold text-[#D42A7D] tracking-wider">CROSS-SELL OPPORTUNITY</div>
                </div>
                <div className="text-lg font-bold text-[#223047] mb-2">
                  {topInsights.crossSell}
                </div>
                <div className="text-sm text-[#223047] opacity-60 mb-3">
                  Cross-sector or cross-category pathway detected
                </div>
                <div className="mt-3 pt-3 border-t border-[#D42A7D]/20">
                  <div className="text-xs font-semibold text-[#D42A7D]">
                    {topInsights.crossSellRate} conversion rate
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: Time Selection Slider */}
            <div className="bg-gradient-to-br from-[#FFF7FB] to-[#FFF2FA] border border-[#FFD9EC] rounded-xl md:rounded-2xl p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 md:mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-[#F53799] to-[#3AE4FA] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">⏰</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs md:text-sm font-bold text-[#223047]">Time-Based Pattern Analysis</div>
                    <div className="text-xs text-[#223047] opacity-60">View patterns across different hours of the day</div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs text-[#223047] opacity-60 mb-0.5">Selected Time</div>
                  <div className="text-lg md:text-xl font-bold text-[#F53799]">{formatHour(fpGrowthTime[0])}</div>
                </div>
              </div>

              <div className="relative">
                <Slider
                  value={fpGrowthTime}
                  onValueChange={handleBundleTimeChange}
                  max={19}
                  min={7}
                  step={1}
                  className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-[#F53799] [&_[role=slider]]:to-[#3AE4FA] [&_[role=slider]]:w-6 [&_[role=slider]]:h-6 [&_[role=slider]]:border-4 [&_[role=slider]]:border-white [&_[role=slider]]:shadow-lg"
                />
                <div className="flex justify-between mt-4 text-xs text-[#223047] opacity-60">
                  <span>07:00</span>
                  <span>10:00</span>
                  <span>13:00</span>
                  <span>16:00</span>
                  <span>19:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI-Predicted Bundle Opportunities */}
          <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex-1">
                <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
                  AI-Predicted Bundle Opportunities
                </h2>
                <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
                  Generated from FP-Growth analysis of {formatHour(dataTime[0])} transaction patterns
                </p>
              </div>
              <Badge className="bg-[#5CE1E6] text-white hover:bg-[#5CE1E6] text-xs md:text-sm">
                {bundlePredictions.length} Bundles Detected
              </Badge>
            </div>

            <div className="grid gap-3 md:gap-4">
              {bundlePredictions.length === 0 && (
                <div className="p-4 md:p-6 bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl text-sm text-[#223047] opacity-70">
                  No bundle opportunities were detected for the selected hour and thresholds. Try lowering support or confidence to inspect weaker patterns.
                </div>
              )}
              {bundlePredictions.map((bundle, idx) => (
                <div
                  key={idx}
                  className="p-4 md:p-6 bg-gradient-to-br from-[#FFF7FB] to-white border border-[#FFD9EC] rounded-xl md:rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 hover:border-[#F53799] transition-all"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                      <h3 className="text-base md:text-lg font-bold text-[#223047]">{bundle.bundle}</h3>
                      <Badge className="bg-[#3AE4FA] text-white hover:bg-[#3AE4FA] text-xs">
                        {bundle.confidence}% Confidence
                      </Badge>
                      <Badge variant="outline" className="text-xs border-[#F53799] text-[#F53799]">
                        {bundle.sectorPair}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-6 text-xs md:text-sm mb-2">
                      <div>
                        <span className="text-[#223047] opacity-60">Lift:</span>
                        <span className="ml-2 font-bold text-[#F53799]">{bundle.lift.toFixed(2)}x</span>
                      </div>
                      <div>
                        <span className="text-[#223047] opacity-60">Opportunity:</span>
                        <span className="ml-2 font-semibold text-[#223047]">{bundle.score}%</span>
                      </div>
                      <div>
                        <span className="text-[#223047] opacity-60">Co-occurrence:</span>
                        <span className="ml-2 font-semibold text-[#223047]">{bundle.frequency} times</span>
                      </div>
                    </div>
                    <div className="text-xs md:text-sm text-[#223047] opacity-70" style={{ lineHeight: "1.5" }}>
                      {bundle.type}: {bundle.reason}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDeployBundle(bundle.bundle)}
                    className="bg-[#F53799] hover:bg-[#D42A7D] text-sm md:text-base w-full md:w-auto"
                  >
                    Deploy Bundle
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Proximity Recommendations */}
          <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-[#3AE4FA] to-[#5CE1E6] flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
                    Strategic Proximity Recommendations
                  </h2>
                  <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
                    AI-driven merchandising intelligence for optimal product placement
                  </p>
                </div>
              </div>
              <Badge className="bg-gradient-to-r from-[#F53799] to-[#3AE4FA] text-white hover:opacity-90 text-xs md:text-sm">
                Store Layout AI
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
              {proximityRecommendations.length === 0 && (
                <div className="lg:col-span-2 bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl md:rounded-2xl p-4 md:p-6 text-sm text-[#223047] opacity-70">
                  No proximity recommendations are available for the selected hour. The placement advice will appear once FP-Growth rules or bundle candidates are detected from the ingested baskets.
                </div>
              )}
              {proximityRecommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-white to-[#FFF7FB] border border-[#FFD9EC] rounded-xl md:rounded-2xl p-4 md:p-6 space-y-3 md:space-y-4 hover:border-[#F53799] transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${rec.color}20` }}
                    >
                      <Zap className="w-4 h-4" style={{ color: rec.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-[#3AE4FA] font-semibold mb-1">STRATEGIC PAIRING</div>
                      <h3 className="text-base font-bold text-[#223047] mb-3">{rec.pairing}</h3>
                      <div className="text-xs text-[#223047] opacity-60 mb-2">MERCHANDISING ADVICE</div>
                      <p className="text-sm text-[#223047]" style={{ lineHeight: "1.6" }}>
                        {rec.advice}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-[#FFD9EC]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#223047] opacity-60">SYNERGY SCORE</span>
                      <span className="font-bold" style={{ color: rec.color }}>{rec.score}%</span>
                    </div>
                    <div className="h-2 bg-[#FFD9EC] rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${rec.score}%`,
                          background: `linear-gradient(to right, ${rec.color}, ${rec.color}cc)`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-[#FFF7FB] to-[#FFF2FA] border border-[#3AE4FA]/30 rounded-lg md:rounded-xl p-3 md:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      WOOF AI Insight
                    </Badge>
                  </div>
                  <p className="text-xs md:text-sm text-[#223047] opacity-80 italic" style={{ lineHeight: "1.6" }}>
                    {proximityRecommendations.length > 0
                      ? `${proximityRecommendations.length} placement recommendations were generated from live FP-Growth rules and low-association bundle opportunities for ${formatHour(dataTime[0])}. Same-sector and cross-sector pairs are both included when the ingested baskets support them.`
                      : `No placement recommendation is currently available for ${formatHour(dataTime[0])}; adjust thresholds or select a busier transaction hour to inspect weaker patterns.`}
                  </p>
                </div>
                <img
                  src={aiMascot.src}
                  alt="AI Simulation Mascot"
                  className="w-24 h-24 md:w-32 md:h-32 object-contain flex-shrink-0 self-end sm:self-auto"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "pricing-lab" && (
        <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
          <div>
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              Dynamic Pricing Simulator
            </h2>
            <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
              Test discount scenarios and predict demand elasticity
            </p>
          </div>

          <div className="space-y-3 md:space-y-4">
            <div>
              <label className="text-xs md:text-sm font-semibold text-[#223047] mb-2 block">
                Discount Percentage: {discountValue[0]}%
              </label>
              <Slider
                value={discountValue}
                onValueChange={setDiscountValue}
                max={50}
                min={0}
                step={5}
              />
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300} className="md:!h-[400px]">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#FFD9EC" />
              <XAxis
                dataKey="discount"
                name="Discount %"
                stroke="#223047"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                dataKey="revenue"
                name="Revenue"
                stroke="#223047"
                style={{ fontSize: "12px" }}
              />
              <ZAxis dataKey="demand" range={[50, 400]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #FFD9EC",
                  borderRadius: "12px",
                }}
              />
              <Scatter data={pricingScenarios} fill="#F53799" />
            </ScatterChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 pt-4 md:pt-6 border-t border-[#FFD9EC]">
            <div className="p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl text-center">
              <div className="text-xs text-[#223047] opacity-60 mb-2">Optimal Discount</div>
              <div className="text-2xl md:text-3xl font-bold text-[#F53799]">20%</div>
              <div className="text-xs text-green-600 mt-1">Max revenue point</div>
            </div>
            <div className="p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl text-center">
              <div className="text-xs text-[#223047] opacity-60 mb-2">Price Elasticity</div>
              <div className="text-2xl md:text-3xl font-bold text-[#223047]">-1.42</div>
              <div className="text-xs text-[#223047] opacity-50 mt-1">Elastic demand</div>
            </div>
            <div className="p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl text-center">
              <div className="text-xs text-[#223047] opacity-60 mb-2">Break-even Point</div>
              <div className="text-2xl md:text-3xl font-bold text-[#223047]">35%</div>
              <div className="text-xs text-orange-600 mt-1">Critical threshold</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "traffic-optimizer" && (
        <div className="space-y-4 md:space-y-6 lg:space-y-8">
          <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex-1">
                <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
                  Predictive Floorplan Simulator
                </h2>
                <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
                  AI-powered customer distribution forecast for capacity planning
                </p>
              </div>

              <div className="text-left md:text-right">
                <div className="text-xs md:text-sm text-[#223047] opacity-60 mb-1">Selected Time</div>
                <div className="text-base md:text-lg font-bold text-[#F53799]">{formatHour(floorplanTime[0])}</div>
              </div>
            </div>

            {/* TIME SLIDER */}
            <div className="bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl md:rounded-2xl p-4 md:p-6 space-y-3 md:space-y-4">
              <div className="text-xs md:text-sm font-semibold text-[#223047]">TIME SELECTION</div>
              <div className="relative">
                <Slider
                  value={floorplanTime}
                  onValueChange={setFloorplanTime}
                  max={19}
                  min={7}
                  step={1}
                  className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-[#F53799] [&_[role=slider]]:to-[#3AE4FA] [&_[role=slider]]:w-6 [&_[role=slider]]:h-6 [&_[role=slider]]:border-4 [&_[role=slider]]:border-white [&_[role=slider]]:shadow-lg"
                />
                <div className="flex justify-between mt-3 text-xs text-[#223047] opacity-60">
                  <span>07:00</span>
                  <span>10:00</span>
                  <span>13:00</span>
                  <span>16:00</span>
                  <span>19:00</span>
                </div>
              </div>
            </div>

            {/* Floorplan Visualization */}
            <div className="relative h-[400px] md:h-[500px] bg-gradient-to-br from-[#FFF7FB] to-[#FFF2FA] rounded-xl md:rounded-2xl border border-[#FFD9EC] overflow-hidden">
              {/* Cafe Area */}
              <div className="absolute top-10 left-10 w-2/5 h-3/5 border-2 border-dashed border-[#F53799] rounded-xl bg-[#F53799]/5 flex items-center justify-center">
                <span className="text-sm font-semibold text-[#F53799] opacity-60">Cafe Area</span>
              </div>

              {/* Grooming Area */}
              <div className="absolute top-10 right-10 w-2/5 h-3/5 border-2 border-dashed border-[#3AE4FA] rounded-xl bg-[#3AE4FA]/5 flex items-center justify-center">
                <span className="text-sm font-semibold text-[#3AE4FA] opacity-60">Grooming Area</span>
              </div>

              {/* Predicted Customers */}
              {predictedCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="absolute w-3 h-3 rounded-full animate-pulse"
                  style={{
                    left: `${customer.x}%`,
                    top: `${customer.y}%`,
                    backgroundColor: customer.type === "cafe" ? "#F53799" : "#3AE4FA",
                  }}
                  title={customer.type === "cafe" ? "Cafe customer" : "Grooming customer"}
                />
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="p-3 md:p-4 bg-[#FFF2FA] rounded-lg md:rounded-xl text-center">
                <div className="text-xs text-[#223047] opacity-60 mb-1">Predicted Customers</div>
                <div className="text-xl md:text-2xl font-bold text-[#223047]">{predictedCustomers.length}</div>
              </div>
              <div className="p-3 md:p-4 bg-[#FFF2FA] rounded-lg md:rounded-xl text-center">
                <div className="text-xs text-[#223047] opacity-60 mb-1">Cafe Traffic</div>
                <div className="text-xl md:text-2xl font-bold text-[#F53799]">
                  {predictedCustomers.filter((c) => c.type === "cafe").length}
                </div>
              </div>
              <div className="p-3 md:p-4 bg-[#FFF2FA] rounded-lg md:rounded-xl text-center">
                <div className="text-xs text-[#223047] opacity-60 mb-1">Grooming Traffic</div>
                <div className="text-xl md:text-2xl font-bold text-[#3AE4FA]">
                  {predictedCustomers.filter((c) => c.type === "grooming").length}
                </div>
              </div>
              <div className="p-3 md:p-4 bg-[#FFF2FA] rounded-lg md:rounded-xl text-center">
                <div className="text-xs text-[#223047] opacity-60 mb-1">Capacity Usage</div>
                <div className={`text-xl md:text-2xl font-bold ${capacity > 80 ? "text-red-600" : "text-green-600"}`}>
                  {capacity.toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          {/* Next 7 Days Traffic Prediction */}
          <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
            <div>
              <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
                Next 7 Days Traffic Prediction
              </h2>
              <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
                Forecasted customer volume for selected time slot: {formatHour(floorplanTime[0])}
              </p>
            </div>

            <ResponsiveContainer width="100%" height={250} className="md:!h-[300px]">
              <AreaChart data={trafficPrediction}>
                <defs>
                  <linearGradient key="trafficGradient-gradient" id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3AE4FA" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3AE4FA" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFD9EC" vertical={false} />
                <XAxis dataKey="day" stroke="#223047" style={{ fontSize: "12px" }} />
                <YAxis stroke="#223047" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #FFD9EC",
                    borderRadius: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  stroke="#3AE4FA"
                  strokeWidth={2.5}
                  fill="url(#trafficGradient)"
                  animationDuration={800}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#223047"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>

            <div className="flex justify-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#3AE4FA] rounded-full" />
                <span className="text-sm text-[#223047]">Predicted Traffic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#223047] rounded-full" />
                <span className="text-sm text-[#223047]">Actual Traffic</span>
              </div>
            </div>
          </div>

          {/* Past Happy Hour Performance */}
          <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
            <div>
              <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
                Past Happy Hour Performance
              </h2>
              <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
                Historical effectiveness of traffic optimization campaigns
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-3">
                {happyHourHistory.map((item) => (
                  <div
                    key={item.date}
                    className="flex items-center justify-between p-4 rounded-xl bg-[#FFF2FA]"
                  >
                    <div>
                      <div className="text-sm font-semibold text-[#223047]">{item.date}</div>
                      <div className="text-xs text-[#223047] opacity-60">{item.time}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-[#223047] opacity-60">Predicted → Actual</div>
                      <div className="text-sm font-semibold text-[#223047]">
                        {item.predicted} → {item.actual}
                      </div>
                    </div>
                    <div className="text-2xl">{item.result}</div>
                  </div>
                ))}
              </div>

              <div>
                <ResponsiveContainer width="100%" height={220} className="md:!h-[250px]">
                  <BarChart data={happyHourHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#FFD9EC" vertical={false} />
                    <XAxis dataKey="date" stroke="#223047" style={{ fontSize: "11px" }} />
                    <YAxis stroke="#223047" style={{ fontSize: "11px" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #FFD9EC",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar dataKey="lift" fill="#3AE4FA" radius={[6, 6, 0, 0]} animationDuration={800} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "scenario-builder" && (
        <div className="space-y-4 md:space-y-6 lg:space-y-8">
          <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
            <div>
              <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
                Business Scenario Builder & What-If Analysis
              </h2>
              <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
                Configure scenario parameters and see real-time predicted outcomes
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
              {/* Left: Controls */}
              <div className="space-y-4 md:space-y-6">
                <div>
                  <label className="text-xs md:text-sm font-semibold text-[#223047] mb-2 block">
                    Scenario Name
                  </label>
                  <input
                    type="text"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    className="w-full px-3 md:px-4 py-2 border border-[#FFD9EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F53799] text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="text-xs md:text-sm font-semibold text-[#223047] mb-2 block">
                    Weather Condition
                  </label>
                  <select
                    value={weather}
                    onChange={(e) => setWeather(e.target.value)}
                    className="w-full px-3 md:px-4 py-2 border border-[#FFD9EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F53799] text-sm md:text-base"
                  >
                    <option value="sunny">☀️ Sunny</option>
                    <option value="rainy">🌧️ Rainy</option>
                    <option value="cloudy">☁️ Cloudy</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs md:text-sm font-semibold text-[#223047] mb-2 block">
                    Day of Week
                  </label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    className="w-full px-3 md:px-4 py-2 border border-[#FFD9EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F53799] text-sm md:text-base"
                  >
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                    <option value="saturday">Saturday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs md:text-sm font-semibold text-[#223047] mb-2 block">
                    Temperature: {temperature[0]}°C
                  </label>
                  <Slider
                    value={temperature}
                    onValueChange={setTemperature}
                    max={40}
                    min={20}
                    step={1}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div className="p-3 md:p-4 bg-[#FFF7FB] rounded-lg md:rounded-xl">
                    <label className="flex items-center gap-2 md:gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={promoActive}
                        onChange={(e) => setPromoActive(e.target.checked)}
                        className="w-4 h-4 text-[#F53799] rounded"
                      />
                      <div>
                        <div className="text-xs md:text-sm font-semibold text-[#223047]">Promo Active</div>
                        <div className="text-xs text-[#223047] opacity-60">+18% lift</div>
                      </div>
                    </label>
                  </div>

                  <div className="p-3 md:p-4 bg-[#FFF7FB] rounded-lg md:rounded-xl">
                    <label className="flex items-center gap-2 md:gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paydayWeekend}
                        onChange={(e) => setPaydayWeekend(e.target.checked)}
                        className="w-4 h-4 text-[#F53799] rounded"
                      />
                      <div>
                        <div className="text-xs md:text-sm font-semibold text-[#223047]">Payday Weekend</div>
                        <div className="text-xs text-[#223047] opacity-60">+26% lift</div>
                      </div>
                    </label>
                  </div>

                  <div className="p-3 md:p-4 bg-[#FFF7FB] rounded-lg md:rounded-xl sm:col-span-2">
                    <label className="flex items-center gap-2 md:gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={competitorEvent}
                        onChange={(e) => setCompetitorEvent(e.target.checked)}
                        className="w-4 h-4 text-[#F53799] rounded"
                      />
                      <div>
                        <div className="text-xs md:text-sm font-semibold text-[#223047]">Competitor Event Nearby</div>
                        <div className="text-xs text-[#223047] opacity-60">-8% impact</div>
                      </div>
                    </label>
                  </div>
                </div>

                <Button
                  onClick={handleRunSimulation}
                  className="w-full bg-[#F53799] hover:bg-[#D42A7D]"
                >
                  Update Predictions
                </Button>
              </div>

              {/* Right: Outcomes */}
              <div className="space-y-4 md:space-y-6">
                <div className="p-4 md:p-6 bg-gradient-to-br from-[#F53799] to-[#D42A7D] rounded-xl md:rounded-2xl text-white">
                  <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4">Predicted Outcomes</h3>
                  <div className="space-y-3">
                    {[
                      {
                        metric: "Revenue",
                        value: `₱${scenarioOutcome.revenue.toLocaleString()}`,
                        change: `${parseFloat(scenarioOutcome.revenueChange) > 0 ? "+" : ""}${scenarioOutcome.revenueChange}%`,
                      },
                      {
                        metric: "Orders",
                        value: scenarioOutcome.orders,
                        change: `${parseFloat(scenarioOutcome.ordersChange) > 0 ? "+" : ""}${scenarioOutcome.ordersChange}%`,
                      },
                      {
                        metric: "Avg Transaction",
                        value: `₱${scenarioOutcome.avgTransaction}`,
                        change: `${parseFloat(scenarioOutcome.avgTransactionChange) > 0 ? "+" : ""}${scenarioOutcome.avgTransactionChange}%`,
                      },
                      {
                        metric: "Cafe Share",
                        value: `${scenarioOutcome.cafeShare}%`,
                        change: `${parseFloat(scenarioOutcome.cafeShareChange) > 0 ? "+" : ""}${scenarioOutcome.cafeShareChange}%`,
                      },
                    ].map((item) => (
                      <div
                        key={item.metric}
                        className="flex items-center justify-between p-4 bg-white/10 backdrop-blur rounded-xl"
                      >
                        <span className="text-sm opacity-90">{item.metric}</span>
                        <div className="text-right">
                          <div className="font-bold text-lg">{item.value}</div>
                          <div className={`text-xs ${parseFloat(item.change) >= 0 ? "text-green-300" : "text-red-300"}`}>
                            {item.change}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl space-y-3 md:space-y-4">
                  <h3 className="text-sm md:text-base font-bold text-[#223047]">Impact Breakdown</h3>
                  <div className="space-y-2">
                    {[
                      { factor: "Weather", impact: weather === "sunny" ? "+15%" : weather === "rainy" ? "-12%" : "0%" },
                      { factor: "Day of Week", impact: dayOfWeek.includes("sat") || dayOfWeek.includes("sun") ? "+22%" : "0%" },
                      { factor: "Active Promo", impact: promoActive ? "+18%" : "0%" },
                      { factor: "Temperature", impact: temperature[0] > 30 ? "-5%" : "0%" },
                      { factor: "Competitor Event", impact: competitorEvent ? "-8%" : "0%" },
                      { factor: "Payday Weekend", impact: paydayWeekend ? "+26%" : "0%" },
                    ].map((item) => (
                      <div
                        key={item.factor}
                        className="flex items-center justify-between p-3 bg-white rounded-lg"
                      >
                        <span className="text-sm text-[#223047]">{item.factor}</span>
                        <span
                          className={`text-sm font-semibold ${
                            item.impact.startsWith("+")
                              ? "text-green-600"
                              : item.impact.startsWith("-")
                              ? "text-red-600"
                              : "text-gray-500"
                          }`}
                        >
                          {item.impact}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 md:p-6 bg-[#223047] rounded-xl md:rounded-2xl text-white">
                  <h3 className="text-xs md:text-sm font-semibold mb-2">WOOF Recommendation</h3>
                  <p className="text-xs md:text-sm opacity-90" style={{ lineHeight: "1.6" }}>
                    {parseFloat(scenarioOutcome.revenueChange) > 10
                      ? "Highly favorable conditions detected. Execute aggressive marketing and ensure full inventory."
                      : parseFloat(scenarioOutcome.revenueChange) < -5
                      ? "Challenging conditions predicted. Consider defensive promotions and optimize staffing levels."
                      : "Moderate conditions. Maintain standard operations with light promotional activity."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
