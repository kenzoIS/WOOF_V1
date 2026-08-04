import { useEffect, useMemo, useState } from "react";
import { FlaskConical, Sparkles, TrendingUp, Target, Network, Map as MapIcon, Zap, HelpCircle, Info, Tag, ShoppingBag, Megaphone, Search, Users, CalendarDays, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Slider } from "../components/ui/slider";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "../components/ui/tooltip";
import { createCampaignDraft, DataRange as ApiDataRange, ForecastRun, getCrossSell, getDataRange, getForecast, getNextQuietPeriod, getPricingCatalog, getTrafficOptimizer, TrafficOptimizerResponse } from "../lib/api";
import { CampaignActivationLayer } from "../components/CampaignActivationLayer";
import { BundleExplanationDrawer, BundleCandidate as DrawerBundleCandidate } from "../components/BundleExplanationDrawer";
import {
  HISTORY_START_DATE,
  INGESTED_HISTORY_END_DATE,
  parseGlobalRange,
} from "../lib/dateRanges";
import aiMascot from "../../imports/no_bg_AI.png";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  LabelList,
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
  itemAPrice?: number;
  itemBPrice?: number;
  itemACost?: number | null;
  itemBCost?: number | null;
  regularCost?: number | null;
  regularPrice?: number;
  bundlePrice?: number;
  savings?: number;
  projectedGrossProfit?: number | null;
  projectedMarginPercent?: number | null;
  suggestedDiscountPercent?: number | null;
  proposedDiscountPercent?: number | null;
  minimumMarginPercent?: number | null;
  maxSafeDiscountPercent?: number | null;
  discountRationale?: string;
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
  baseOpportunityScore?: number;
  businessFitScore?: number;
  bundleCategory?: string;
  bundleFitReason?: string;
  reason?: string;
  antecedentSectors?: string[];
  consequentSectors?: string[];
  crossSector?: boolean;
  isLowAssociation?: boolean;
  itemAPrice?: number;
  itemBPrice?: number;
  itemACost?: number | null;
  itemBCost?: number | null;
  regularCost?: number | null;
  regularPrice?: number;
  bundlePrice?: number;
  savings?: number;
  projectedGrossProfit?: number | null;
  projectedMarginPercent?: number | null;
  suggestedDiscountPercent?: number | null;
  proposedDiscountPercent?: number | null;
  minimumMarginPercent?: number | null;
  maxSafeDiscountPercent?: number | null;
  discountRationale?: string;
}

interface ItemMetric {
  item: string;
  sector: string;
  sectors?: string[];
  support: number;
  basketCount: number;
  velocity: "fast" | "moderate" | "slow";
  price?: number;
  unitCost?: number;
  unitGrossProfit?: number;
  margin?: number;
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

interface PricingCatalogResponse {
  itemMetrics?: ItemMetric[];
  totalItems?: number;
  totalTransactions?: number;
  source?: "header_filter" | "all_history";
  dateStart?: string;
  dateEnd?: string;
}

interface ScenarioForecastSet {
  cafe?: ForecastRun | null;
  services?: ForecastRun | null;
  retail?: any;
}

interface ScenarioFactor {
  factor: string;
  impact: number;
  description: string;
}

type DemandLevel = "Low" | "Medium" | "High";

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

const formatCurrency = (value?: number | null) =>
  value !== undefined && value !== null && Number.isFinite(value)
    ? `₱${value.toFixed(2)}`
    : "Unavailable";

const formatCompactCurrency = (value?: number | null) => {
  if (value === undefined || value === null || !Number.isFinite(value)) return "";
  const absValue = Math.abs(value);
  if (absValue >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  if (absValue >= 1_000) return `₱${(value / 1_000).toFixed(1)}K`;
  return `₱${Math.round(value)}`;
};

const formatPair = (left: string, right: string) => `${left} + ${right}`;

const firstSector = (sectors?: string[]) => sectors?.[0] || "unknown";

const getBundleKey = (itemA: string, itemB: string) =>
  [itemA, itemB].sort().join("::");

const calculateDiscountEconomics = (
  regularPrice: number,
  regularCost: number | null | undefined,
  discountPercent: number,
) => {
  if (!regularPrice || regularPrice <= 0) {
    return {
      bundlePrice: 0,
      savings: 0,
      projectedGrossProfit: null,
      projectedMarginPercent: null,
    };
  }

  const bundlePrice = Math.round(regularPrice * (1 - discountPercent / 100) * 100) / 100;
  const savings = Math.round((regularPrice - bundlePrice) * 100) / 100;
  if (regularCost === undefined || regularCost === null) {
    return {
      bundlePrice,
      savings,
      projectedGrossProfit: null,
      projectedMarginPercent: null,
    };
  }

  const projectedGrossProfit = Math.round((bundlePrice - regularCost) * 100) / 100;
  const projectedMarginPercent = bundlePrice > 0
    ? Math.round((projectedGrossProfit / bundlePrice) * 1000) / 10
    : null;

  return {
    bundlePrice,
    savings,
    projectedGrossProfit,
    projectedMarginPercent,
  };
};

const formatSector = (sector?: string) => {
  const value = sector || "unknown";
  if (value === "cafe") return "Cafe";
  if (value === "retail") return "Retail";
  if (value === "services" || value === "service") return "Services";
  return "Unknown";
};

const formatSectorPair = (sectors: string[]) =>
  sectors.map(formatSector).join(" + ");

const sectorSortOrder: Record<string, number> = {
  cafe: 0,
  services: 1,
  service: 1,
  retail: 2,
  unknown: 3,
};

const normalizeSectorForCategory = (sector?: string) => {
  const value = (sector || "unknown").toLowerCase();
  return value === "service" ? "services" : value;
};

const getBundleCategoryKey = (sectors: string[]) =>
  sectors
    .map(normalizeSectorForCategory)
    .sort((a, b) => (sectorSortOrder[a] ?? 99) - (sectorSortOrder[b] ?? 99) || a.localeCompare(b))
    .join("__");

const formatBundleCategoryKey = (key: string) =>
  key.split("__").map(formatSector).join(" + ");

function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function AISimulation() {
  const [activeTab, setActiveTab] = useState("bundle-simulator");
  const [discountValue, setDiscountValue] = useState([15]);
  const [trafficOptimizerTime, setTrafficOptimizerTime] = useState([14]); // 2 PM (14 in 24h format)
  const [dataTime, setDataTime] = useState([13]); // 1 PM for Bundle Simulator

  // Live Behavioral Web states
  const [supportThreshold, setSupportThreshold] = useState([5]);
  const [confidenceLevel, setConfidenceLevel] = useState([60]);
  const [fpGrowthTime, setFpGrowthTime] = useState([13]); // Time slider for FP-Growth
  const [crossSellData, setCrossSellData] = useState<CrossSellResponse | null>(null);
  const [crossSellLoading, setCrossSellLoading] = useState(false);
  const [crossSellError, setCrossSellError] = useState<string | null>(null);
  const [bundleDiscountOverrides, setBundleDiscountOverrides] = useState<Record<string, number>>({});
  const [bundleCategoryFilter, setBundleCategoryFilter] = useState("all");
  const [selectedCandidateForDrawer, setSelectedCandidateForDrawer] = useState<DrawerBundleCandidate | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [globalDateRange, setGlobalDateRange] = useState("last-7-days");
  const [dataRangeInfo, setDataRangeInfo] = useState<ApiDataRange | null>(null);
  const [pricingSearch, setPricingSearch] = useState("");
  const [pricingCategoryFilter, setPricingCategoryFilter] = useState("all");
  const [pricingPage, setPricingPage] = useState(1);
  const [pricingUsesFullCatalog, setPricingUsesFullCatalog] = useState(false);
  const [pricingCatalogData, setPricingCatalogData] = useState<PricingCatalogResponse | null>(null);
  const [pricingCatalogLoading, setPricingCatalogLoading] = useState(false);
  const [pricingCatalogError, setPricingCatalogError] = useState<string | null>(null);
  const [selectedPricingItemName, setSelectedPricingItemName] = useState<string | null>(null);
  const [trafficOptimizerData, setTrafficOptimizerData] = useState<TrafficOptimizerResponse | null>(null);
  const [trafficOptimizerLoading, setTrafficOptimizerLoading] = useState(false);
  const [trafficOptimizerError, setTrafficOptimizerError] = useState<string | null>(null);

  const handleOpenDrawer = (candidate: DrawerBundleCandidate) => {
    setSelectedCandidateForDrawer(candidate);
    setIsDrawerOpen(true);
  };

  const debouncedSupportThreshold = useDebouncedValue(supportThreshold[0]);
  const debouncedConfidenceLevel = useDebouncedValue(confidenceLevel[0]);
  const debouncedDataTime = useDebouncedValue(dataTime[0]);
  const debouncedTrafficOptimizerTime = useDebouncedValue(trafficOptimizerTime[0]);
  const latestHistoryDate = dataRangeInfo?.historyEndDate || INGESTED_HISTORY_END_DATE;
  const historyStartDate = dataRangeInfo?.historyStartDate || HISTORY_START_DATE;
  const selectedHeaderRange = useMemo(
    () =>
      parseGlobalRange(globalDateRange, latestHistoryDate, {
        min: historyStartDate,
        max: latestHistoryDate,
      }),
    [globalDateRange, historyStartDate, latestHistoryDate],
  );
  const selectedHeaderRangeLabel = `${selectedHeaderRange.start} to ${selectedHeaderRange.end}`;
  const pricingCatalogRangeLabel = pricingUsesFullCatalog
    ? "All ingested history"
    : selectedHeaderRangeLabel;

  // Scenario Builder states
  const [scenarioName, setScenarioName] = useState("Weekend Promo Campaign");
  const [weather, setWeather] = useState("sunny");
  const [promoActive, setPromoActive] = useState(true);
  const [dayOfWeek, setDayOfWeek] = useState("saturday");
  const [temperature, setTemperature] = useState([28]);
  const [paydayWeekend, setPaydayWeekend] = useState(false);
  const [scenarioForecasts, setScenarioForecasts] = useState<ScenarioForecastSet>({});
  const [scenarioBaselineForecasts, setScenarioBaselineForecasts] = useState<ScenarioForecastSet>({});
  const [scenarioPromoModel, setScenarioPromoModel] = useState<any>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [scenarioError, setScenarioError] = useState<string | null>(null);
  const [scenarioRefreshKey, setScenarioRefreshKey] = useState(0);
  const debouncedScenarioTemperature = useDebouncedValue(temperature[0], 500);

  const tabs = [
    { id: "bundle-simulator", label: "Bundle Simulator", icon: Sparkles },
    { id: "pricing-lab", label: "Pricing Laboratory", icon: TrendingUp },
    { id: "traffic-optimizer", label: "Traffic Optimizer", icon: MapIcon },
    { id: "scenario-builder", label: "Scenario Builder", icon: FlaskConical },
    { id: "activation-layer", label: "Activation Layer", icon: Megaphone },
  ];

  const handleBundleTimeChange = (value: number[]) => {
    setDataTime(value);
    setFpGrowthTime(value);
  };

  const handleSubmitBundleForReview = async (bundle: {
    bundle: string;
    itemA: string;
    itemB: string;
    regularPrice: number;
    regularCost?: number | null;
    bundlePrice: number;
    suggestedDiscountPercent?: number | null;
    selectedDiscountPercent: number;
    projectedGrossProfit?: number | null;
    projectedMarginPercent?: number | null;
    minimumMarginPercent?: number | null;
    maxSafeDiscountPercent?: number | null;
    confidence: number;
    lift: number;
    support?: number;
    antecedentSectors?: string[];
    consequentSectors?: string[];
  }) => {
    try {
      await createCampaignDraft({
        sourceType: "bundle_recommendation",
        bundleItems: [bundle.itemA, bundle.itemB],
        itemASector: bundle.antecedentSectors?.[0] || null,
        itemBSector: bundle.consequentSectors?.[0] || null,
        status: "pending",
        bundleName: bundle.bundle,
        itemA: bundle.itemA,
        itemB: bundle.itemB,
        regularPrice: bundle.regularPrice > 0 ? bundle.regularPrice : null,
        proposedBundlePrice: bundle.bundlePrice > 0 ? bundle.bundlePrice : null,
        regularCost: bundle.regularCost ?? null,
        suggestedDiscountPercent: bundle.suggestedDiscountPercent ?? null,
        selectedDiscountPercent: bundle.selectedDiscountPercent,
        proposedDiscountPercent: bundle.selectedDiscountPercent,
        projectedGrossProfit: bundle.projectedGrossProfit ?? null,
        projectedMarginPercent: bundle.projectedMarginPercent ?? null,
        minimumMarginPercent: bundle.minimumMarginPercent ?? null,
        maxSafeDiscountPercent: bundle.maxSafeDiscountPercent ?? null,
        support: bundle.support || 0,
        confidence: bundle.confidence / 100,
        lift: bundle.lift,
      });
      toast.success("Bundle submitted for owner review", {
        description: `${bundle.bundle} is saved as a pending campaign draft and is not active until approved.`,
      });
    } catch (error) {
      toast.error("Unable to submit bundle", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  useEffect(() => {
    const savedRange = window.localStorage.getItem("globalDateRange");
    if (savedRange) {
      setGlobalDateRange(savedRange);
    }

    const handleRangeChange = (event: Event) => {
      const nextRange = (event as CustomEvent<string>).detail;
      if (nextRange) {
        setGlobalDateRange(nextRange);
      }
    };

    window.addEventListener("globalDateRangeChanged", handleRangeChange);
    return () => window.removeEventListener("globalDateRangeChanged", handleRangeChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getDataRange()
      .then((range) => {
        if (!cancelled) {
          setDataRangeInfo(range);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setCrossSellLoading(true);
    setCrossSellError(null);

    getCrossSell({
      minSupport: (debouncedSupportThreshold / 100).toFixed(2),
      minConfidence: (debouncedConfidenceLevel / 100).toFixed(2),
      minLift: "1.20",
      maxBundleCandidates: "20",
      hour: String(debouncedDataTime),
      sector: "all",
      dateStart: selectedHeaderRange.start,
      dateEnd: selectedHeaderRange.end,
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
  }, [
    debouncedSupportThreshold,
    debouncedConfidenceLevel,
    debouncedDataTime,
    selectedHeaderRange.end,
    selectedHeaderRange.start,
  ]);

  useEffect(() => {
    let cancelled = false;
    setPricingCatalogLoading(true);
    setPricingCatalogError(null);

    getPricingCatalog({
      sector: "all",
      ...(pricingUsesFullCatalog
        ? {}
        : {
            dateStart: selectedHeaderRange.start,
            dateEnd: selectedHeaderRange.end,
          }),
    })
      .then((result: PricingCatalogResponse) => {
        if (!cancelled) {
          setPricingCatalogData(result);
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setPricingCatalogError(error.message);
          setPricingCatalogData(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPricingCatalogLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pricingUsesFullCatalog, selectedHeaderRange.end, selectedHeaderRange.start]);

  useEffect(() => {
    let cancelled = false;
    setTrafficOptimizerLoading(true);
    setTrafficOptimizerError(null);

    getTrafficOptimizer({
      hour: String(debouncedTrafficOptimizerTime),
      dateStart: selectedHeaderRange.start,
      dateEnd: selectedHeaderRange.end,
    })
      .then((result) => {
        if (!cancelled) {
          setTrafficOptimizerData(result);
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setTrafficOptimizerError(error.message);
          setTrafficOptimizerData(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setTrafficOptimizerLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    debouncedTrafficOptimizerTime,
    selectedHeaderRange.end,
    selectedHeaderRange.start,
  ]);

  const handleRunSimulation = () => {
    setScenarioRefreshKey((key) => key + 1);
    toast.info("Updating scenario predictions...", {
      description: "Pulling forecasts and recalculating the what-if outcome.",
    });
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
  const pricingCatalogMetrics = pricingCatalogData?.itemMetrics?.length
    ? pricingCatalogData.itemMetrics
    : itemMetrics;
  const rawAnalysis = crossSellData?.rawAnalysis;
  const avgRuleLift =
    rules.length > 0
      ? rules.reduce((sum, rule) => sum + (rule.lift || 0), 0) / rules.length
      : 0;
  const avgRuleConfidence =
    rules.length > 0
      ? rules.reduce((sum, rule) => sum + (rule.confidence || 0), 0) / rules.length
      : 0;
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

  // Co-purchase patterns based on time - deduplicated symmetric pairs
  const coPurchaseData = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ pair: string; frequency: number }> = [];

    const sortedRules = rules.slice().sort((a, b) => (b.cooccurrences || 0) - (a.cooccurrences || 0));
    for (const rule of sortedRules) {
      const canonicalKey = [rule.itemA, rule.itemB].sort().join(" + ");
      if (!seen.has(canonicalKey)) {
        seen.add(canonicalKey);
        list.push({
          pair: formatPair(rule.itemA, rule.itemB),
          frequency: rule.cooccurrences || 0,
        });
      }
      if (list.length >= 5) break;
    }
    return list;
  }, [rules]);

  // Helper function to enforce 3 Golden Banning Rules on candidate pairs
  const isExcludedPair = (itemA: string, itemB: string, archetype?: string) => {
    if (archetype && archetype.startsWith("Excluded")) return true;
    const a = (itemA || "").toLowerCase();
    const b = (itemB || "").toLowerCase();

    const drinks = ["coffee", "latte", "cappuccino", "americano", "espresso", "macchiato", "mocha", "frappe", "tea", "matcha", "beverage", "drink", "brew", "chocolate", "iced"];
    const foods = ["pasta", "snack", "sandwich", "waffle", "fries", "burger", "spaghetti", "carbonara", "bread", "toast", "pancake", "muffin", "rice", "meal", "pork", "chicken", "beef", "cordon bleu"];
    const utilities = ["shampoo", "conditioner", "soap", "diaper", "toy", "chew", "brush", "comb", "cologne", "spray", "litter", "leash", "harness"];

    const isADrink = drinks.some((k) => a.includes(k));
    const isBDrink = drinks.some((k) => b.includes(k));

    const isAFood = foods.some((k) => a.includes(k));
    const isBFood = foods.some((k) => b.includes(k));

    const isAUtility = utilities.some((k) => a.includes(k));
    const isBUtility = utilities.some((k) => b.includes(k));

    // Rule 1: Same High-Level Type Exclusion (Drink+Drink, Food+Food)
    if (isADrink && isBDrink) return true;
    if (isAFood && isBFood) return true;

    // Rule 2: Human Beverage + Utility Restriction (Drink+Utility)
    if ((isADrink && isBUtility) || (isBDrink && isAUtility)) return true;

    // Rule 3: Species Mismatch
    const isADog = a.includes("dog") || a.includes("pup") || a.includes("woof");
    const isBDog = b.includes("dog") || b.includes("pup") || b.includes("woof");
    const isACat = a.includes("cat") || a.includes("kitten") || a.includes("feline") || a.includes("meow");
    const isBCat = b.includes("cat") || b.includes("kitten") || b.includes("feline") || b.includes("meow");

    if ((isADog && isBCat) || (isACat && isBDog)) return true;

    return false;
  };

  // Bundle predictions based on time analysis with real item prices
  const allBundlePredictions = useMemo(() => {
    const lowAssociation = bundleCandidates.map((candidate) => ({
      bundle: formatPair(candidate.anchorItem, candidate.bundleItem),
      itemA: candidate.anchorItem,
      itemB: candidate.bundleItem,
      confidence: Math.round((candidate.confidence || 0) * 100),
      lift: candidate.lift || 0,
      support: candidate.pairSupport || 0,
      score: (candidate as any).synergyScore !== undefined && (candidate as any).synergyScore !== null ? Math.round((candidate as any).synergyScore) : Math.round((candidate.opportunityScore || 0) * 100),
      businessFitScore: candidate.businessFitScore ?? null,
      bundleFitReason: candidate.bundleFitReason,
      frequency: candidate.cooccurrences || 0,
      type: "Fast + Slow Opportunity",
      itemAPrice: candidate.itemAPrice || 0,
      itemBPrice: candidate.itemBPrice || 0,
      itemACost: candidate.itemACost ?? null,
      itemBCost: candidate.itemBCost ?? null,
      regularCost: candidate.regularCost ?? null,
      regularPrice: candidate.regularPrice || 0,
      bundlePrice: candidate.bundlePrice || 0,
      savings: candidate.savings || 0,
      projectedGrossProfit: candidate.projectedGrossProfit ?? null,
      projectedMarginPercent: candidate.projectedMarginPercent ?? null,
      suggestedDiscountPercent: candidate.suggestedDiscountPercent ?? candidate.proposedDiscountPercent ?? null,
      minimumMarginPercent: candidate.minimumMarginPercent ?? null,
      maxSafeDiscountPercent: candidate.maxSafeDiscountPercent ?? null,
      discountRationale: candidate.discountRationale,
      sectors: [
        firstSector(candidate.antecedentSectors),
        firstSector(candidate.consequentSectors),
      ],
      bundleCategory:
        candidate.bundleCategory ||
        getBundleCategoryKey([
          firstSector(candidate.antecedentSectors),
          firstSector(candidate.consequentSectors),
        ]),
      sectorPair: formatSectorPair([
        firstSector(candidate.antecedentSectors),
        firstSector(candidate.consequentSectors),
      ]),
      reason:
        candidate.reason ||
        candidate.bundleFitReason ||
        "Fast-moving item paired with a slower-moving item that is not already strongly associated.",
      synergyScore: (candidate as any).synergyScore,
      bundleArchetype: (candidate as any).bundleArchetype,
      synergyBreakdown: (candidate as any).synergyBreakdown,
      isEmergingTrend: (candidate as any).isEmergingTrend,
      baselineAttachRate: (candidate as any).baselineAttachRate,
      predictedAttachRate: (candidate as any).predictedAttachRate,
      attachRateLift: (candidate as any).attachRateLift,
      backtestValidationStatus: (candidate as any).backtestValidationStatus,
      estimatedMarginImpact: (candidate as any).estimatedMarginImpact,
      rawCandidate: candidate,
    }));
    const significantRules = rules.map((rule) => ({
      bundle: formatPair(rule.itemA, rule.itemB),
      itemA: rule.itemA,
      itemB: rule.itemB,
      confidence: Math.round((rule.confidence || 0) * 100),
      lift: rule.lift || 0,
      support: rule.support || 0,
      score: (rule as any).synergyScore !== undefined && (rule as any).synergyScore !== null ? Math.round((rule as any).synergyScore) : Math.round(Math.min(95, (rule.lift || 0) * 20 + 20)),
      businessFitScore: null,
      bundleFitReason: undefined,
      frequency: rule.cooccurrences || 0,
      type: rule.isMultiItem ? "Multi-item Pattern Rule" : "Significant Association Rule",
      itemAPrice: rule.itemAPrice || 0,
      itemBPrice: rule.itemBPrice || 0,
      itemACost: rule.itemACost ?? null,
      itemBCost: rule.itemBCost ?? null,
      regularCost: rule.regularCost ?? null,
      regularPrice: rule.regularPrice || 0,
      bundlePrice: rule.bundlePrice || 0,
      savings: rule.savings || 0,
      projectedGrossProfit: rule.projectedGrossProfit ?? null,
      projectedMarginPercent: rule.projectedMarginPercent ?? null,
      suggestedDiscountPercent: rule.suggestedDiscountPercent ?? rule.proposedDiscountPercent ?? null,
      minimumMarginPercent: rule.minimumMarginPercent ?? null,
      maxSafeDiscountPercent: rule.maxSafeDiscountPercent ?? null,
      discountRationale: rule.discountRationale,
      sectors: [
        firstSector(rule.antecedentSectors),
        firstSector(rule.consequentSectors),
      ],
      bundleCategory: getBundleCategoryKey([
        firstSector(rule.antecedentSectors),
        firstSector(rule.consequentSectors),
      ]),
      sectorPair: formatSectorPair([
        firstSector(rule.antecedentSectors),
        firstSector(rule.consequentSectors),
      ]),
      reason: `Co-purchased ${rule.cooccurrences || 0}x in transaction history with ${rule.lift.toFixed(2)}x sales lift multiplier. Pricing is recalculated from the selected owner-review discount.`,
      synergyScore: (rule as any).synergyScore,
      bundleArchetype: (rule as any).bundleArchetype,
      synergyBreakdown: (rule as any).synergyBreakdown,
      isEmergingTrend: (rule as any).isEmergingTrend,
      baselineAttachRate: (rule as any).baselineAttachRate,
      predictedAttachRate: (rule as any).predictedAttachRate,
      attachRateLift: (rule as any).attachRateLift,
      backtestValidationStatus: (rule as any).backtestValidationStatus,
      estimatedMarginImpact: (rule as any).estimatedMarginImpact,
      rawCandidate: rule as any,
    }));

    const seenKeys = new Set<string>();
    const combined: Array<(typeof lowAssociation)[number] | (typeof significantRules)[number]> = [];

    [...lowAssociation, ...significantRules].forEach((item) => {
      const canonicalKey = [item.itemA, item.itemB].sort().join(" + ");
      if (!seenKeys.has(canonicalKey)) {
        seenKeys.add(canonicalKey);
        combined.push(item);
      }
    });

    return combined
      .sort(
        (a, b) =>
          b.score - a.score ||
          b.confidence - a.confidence ||
          b.lift - a.lift,
      )
      .map((item) => {
        const key = getBundleKey(item.itemA, item.itemB);
        const suggestedDiscount = Math.max(0, Math.round(item.suggestedDiscountPercent || 0));
        const selectedDiscount = bundleDiscountOverrides[key] ?? suggestedDiscount;
        const economics = calculateDiscountEconomics(
          item.regularPrice,
          item.regularCost,
          selectedDiscount,
        );
        const minimumMargin = item.minimumMarginPercent ?? null;
        const maxSafeDiscount = item.maxSafeDiscountPercent ?? null;
        return {
          ...item,
          key,
          suggestedDiscountPercent: suggestedDiscount,
          selectedDiscountPercent: selectedDiscount,
          bundlePrice: economics.bundlePrice,
          savings: economics.savings,
          projectedGrossProfit: economics.projectedGrossProfit,
          projectedMarginPercent: economics.projectedMarginPercent,
          minimumMarginPercent: minimumMargin,
          maxSafeDiscountPercent: maxSafeDiscount,
          marginIsSafe:
            minimumMargin === null ||
            economics.projectedMarginPercent === null ||
            economics.projectedMarginPercent >= minimumMargin,
        };
      });
  }, [bundleCandidates, bundleDiscountOverrides, rules]);

  const bundleCategoryOptions = useMemo(() => {
    return Array.from(new Set(allBundlePredictions.map((bundle) => bundle.bundleCategory)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [allBundlePredictions]);

  const bundlePredictions = useMemo(() => {
    const filtered =
      bundleCategoryFilter === "all"
        ? allBundlePredictions
        : allBundlePredictions.filter((bundle) => bundle.bundleCategory === bundleCategoryFilter);
    return filtered.slice(0, 8);
  }, [allBundlePredictions, bundleCategoryFilter]);

  useEffect(() => {
    if (
      bundleCategoryFilter !== "all" &&
      !bundleCategoryOptions.includes(bundleCategoryFilter)
    ) {
      setBundleCategoryFilter("all");
    }
  }, [bundleCategoryFilter, bundleCategoryOptions]);

  const proximityRecommendations = useMemo(() => {
    const valid = allBundlePredictions.filter((b) => !isExcludedPair(b.itemA, b.itemB, b.bundleArchetype));
    const pool = valid.length > 0 ? valid : allBundlePredictions;
    return pool.slice(0, 6).map((bundle, index) => {
      const color =
        sectorColors[bundle.sectors[0]] ||
        sectorColors[bundle.sectors[1]] ||
        sectorColors.unknown;
      const sameSector =
        bundle.sectors[0] !== "unknown" && bundle.sectors[0] === bundle.sectors[1];
      const advice = sameSector
        ? `Place these ${bundle.sectorPair.toLowerCase()} offers in the same shelf, menu, or service zone to increase discovery inside an already active category.`
        : `Place ${bundle.bundle} near the transition between ${bundle.sectorPair} touchpoints so the stronger purchase intent can expose the slower-moving offer.`;

      const synergyVal = bundle.synergyScore !== undefined && bundle.synergyScore !== null
        ? Math.round(bundle.synergyScore)
        : (bundle.score || 85);

      return {
        pairing: bundle.bundle,
        advice,
        score: synergyVal,
        color,
        sectorPair: bundle.sectorPair,
        rank: index + 1,
        regularPrice: bundle.regularPrice,
        bundlePrice: bundle.bundlePrice,
        savings: bundle.savings,
      };
    });
  }, [allBundlePredictions]);

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

  // Top AI Insights from network analysis - strictly filtered to exclude banned/excluded pairs
  const topInsights = useMemo(() => {
    const valid = allBundlePredictions.filter((b) => !isExcludedPair(b.itemA, b.itemB, b.bundleArchetype));
    const pool = valid.length > 0 ? valid : allBundlePredictions;

    const topLiftRule = rules.find((r) => !isExcludedPair(r.itemA, r.itemB, (r as any).bundleArchetype)) || rules[0];
    const topLiftBundle = pool.slice().sort((a, b) => (b.lift || 0) - (a.lift || 0))[0];

    const emergingTrendCandidate =
      pool.find((b) => b.isEmergingTrend) ||
      pool.filter((b) => (b.frequency || 0) <= 3).sort((a, b) => (b.synergyScore || 0) - (a.synergyScore || 0))[0] ||
      pool.slice().sort((a, b) => (b.synergyScore || 0) - (a.synergyScore || 0))[0];

    const crossSectorMatch =
      pool.find((b) => (b as any).crossSector || (b.sectors[0] !== "unknown" && b.sectors[0] !== b.sectors[1])) ||
      rules.find((r) => r.crossSector && !isExcludedPair(r.itemA, r.itemB, (r as any).bundleArchetype));

    const displayTopBundle = topLiftBundle ? topLiftBundle.bundle : (topLiftRule ? formatPair(topLiftRule.itemA, topLiftRule.itemB) : "No patterns detected");
    const displayTopLift = topLiftBundle ? topLiftBundle.lift : (topLiftRule ? topLiftRule.lift || 0 : 0);
    const displayTopConf = topLiftBundle ? topLiftBundle.confidence : (topLiftRule ? Math.round((topLiftRule.confidence || 0) * 100) : 0);

    return {
      topBundle: displayTopBundle,
      bundleConfidence: displayTopConf,
      bundleLift: displayTopLift,
      emergingTrend: emergingTrendCandidate ? emergingTrendCandidate.bundle : "No emerging trend candidates",
      trendGrowth: emergingTrendCandidate
        ? emergingTrendCandidate.synergyScore !== undefined && emergingTrendCandidate.synergyScore !== null
          ? `${Math.round(emergingTrendCandidate.synergyScore)}% Synergy`
          : `Score: ${emergingTrendCandidate.score || 85}`
        : "N/A",
      crossSell: crossSectorMatch
        ? ("bundle" in crossSectorMatch ? crossSectorMatch.bundle : formatPair(crossSectorMatch.itemA, crossSectorMatch.itemB))
        : "No cross-sector pattern",
      crossSellRate: crossSectorMatch ? `${crossSectorMatch.confidence}%` : "0%",
    };
  }, [allBundlePredictions, rules]);

  const pricingItemCatalog = useMemo(() => {
    type PricingItem = {
      name: string;
      sector: string;
      sectors: string[];
      support: number;
      basketCount: number;
      velocity: "fast" | "moderate" | "slow";
      price: number | null;
      unitCost: number | null;
      unitGrossProfit: number | null;
      margin: number | null;
    };

    const items = new Map<string, PricingItem>();
    const upsert = (input: Partial<PricingItem> & { name: string }) => {
      const existing = items.get(input.name);
      const next: PricingItem = {
        name: input.name,
        sector: input.sector || existing?.sector || "unknown",
        sectors: input.sectors || existing?.sectors || [input.sector || existing?.sector || "unknown"],
        support: input.support ?? existing?.support ?? 0,
        basketCount: input.basketCount ?? existing?.basketCount ?? 0,
        velocity: input.velocity || existing?.velocity || "moderate",
        price: input.price ?? existing?.price ?? null,
        unitCost: input.unitCost ?? existing?.unitCost ?? null,
        unitGrossProfit: input.unitGrossProfit ?? existing?.unitGrossProfit ?? null,
        margin: input.margin ?? existing?.margin ?? null,
      };
      items.set(input.name, next);
    };

    pricingCatalogMetrics.forEach((metric) => {
      upsert({
        name: metric.item,
        sector: metric.sector,
        sectors: metric.sectors || [metric.sector],
        support: metric.support || 0,
        basketCount: metric.basketCount || 0,
        velocity: metric.velocity,
        price: metric.price ?? null,
        unitCost: metric.unitCost ?? null,
        unitGrossProfit: metric.unitGrossProfit ?? null,
        margin: metric.margin ?? null,
      });
    });

    [...bundleCandidates, ...rules].forEach((entry: any) => {
      if (entry.itemA || entry.anchorItem) {
        upsert({
          name: entry.itemA || entry.anchorItem,
          sector: firstSector(entry.antecedentSectors),
          sectors: entry.antecedentSectors || [firstSector(entry.antecedentSectors)],
          price: entry.itemAPrice ?? null,
          unitCost: entry.itemACost ?? null,
        });
      }
      if (entry.itemB || entry.bundleItem) {
        upsert({
          name: entry.itemB || entry.bundleItem,
          sector: firstSector(entry.consequentSectors),
          sectors: entry.consequentSectors || [firstSector(entry.consequentSectors)],
          price: entry.itemBPrice ?? null,
          unitCost: entry.itemBCost ?? null,
        });
      }
    });

    return Array.from(items.values()).sort(
      (a, b) => b.basketCount - a.basketCount || a.name.localeCompare(b.name),
    );
  }, [bundleCandidates, pricingCatalogMetrics, rules]);

  const pricingCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: pricingItemCatalog.length,
      cafe: 0,
      services: 0,
      retail: 0,
    };

    pricingItemCatalog.forEach((item) => {
      const sectors = new Set(
        (item.sectors?.length ? item.sectors : [item.sector]).map(normalizeSectorForCategory),
      );
      sectors.forEach((sector) => {
        if (sector in counts && sector !== "all") {
          counts[sector] += 1;
        }
      });
    });

    return counts;
  }, [pricingItemCatalog]);
  const pricingCategoryOptions = [
    { id: "all", label: "All Items" },
    { id: "cafe", label: "Cafe" },
    { id: "services", label: "Services" },
    { id: "retail", label: "Retail" },
  ];

  const filteredPricingItems = useMemo(() => {
    const query = pricingSearch.trim().toLowerCase();
    return pricingItemCatalog
      .filter((item) => {
        const sectors = (item.sectors?.length ? item.sectors : [item.sector]).map(normalizeSectorForCategory);
        const matchesCategory =
          pricingCategoryFilter === "all" || sectors.includes(pricingCategoryFilter);
        const matchesSearch =
          !query ||
          item.name.toLowerCase().includes(query) ||
          sectors.some((sector) => formatSector(sector).toLowerCase().includes(query));

        return matchesCategory && matchesSearch;
      });
  }, [pricingCategoryFilter, pricingItemCatalog, pricingSearch]);
  const pricingPageCount = Math.max(1, Math.ceil(filteredPricingItems.length / 5));
  const visiblePricingItems = useMemo(() => {
    const pageStart = (pricingPage - 1) * 5;
    return filteredPricingItems.slice(pageStart, pageStart + 5);
  }, [filteredPricingItems, pricingPage]);

  useEffect(() => {
    setPricingPage(1);
  }, [pricingCategoryFilter, pricingSearch]);

  useEffect(() => {
    if (pricingPage > pricingPageCount) {
      setPricingPage(pricingPageCount);
    }
  }, [pricingPage, pricingPageCount]);

  useEffect(() => {
    if (
      filteredPricingItems.length > 0 &&
      (!selectedPricingItemName ||
        !filteredPricingItems.some((item) => item.name === selectedPricingItemName))
    ) {
      setSelectedPricingItemName(filteredPricingItems[0].name);
    } else if (filteredPricingItems.length === 0 && selectedPricingItemName !== null) {
      setSelectedPricingItemName(null);
    }
  }, [filteredPricingItems, selectedPricingItemName]);

  const selectedPricingItem =
    filteredPricingItems.find((item) => item.name === selectedPricingItemName) ||
    null;

  const pricingScenarios = useMemo(() => {
    if (!selectedPricingItem?.price || selectedPricingItem.price <= 0) return [];

    const price = selectedPricingItem.price;
    const unitCost = selectedPricingItem.unitCost ?? null;
    const baseDemand = Math.max(1, selectedPricingItem.basketCount || 1);
    const sectorSensitivity =
      selectedPricingItem.sector === "retail"
        ? 1.2
        : selectedPricingItem.sector === "cafe"
          ? 1.05
          : selectedPricingItem.sector === "services"
            ? 0.8
            : 1;
    const velocitySensitivity =
      selectedPricingItem.velocity === "slow"
        ? 1.35
        : selectedPricingItem.velocity === "fast"
          ? 0.75
          : 1;
    const responseRate = sectorSensitivity * velocitySensitivity;

    return Array.from({ length: 11 }, (_, index) => {
      const discount = index * 5;
      const customerLift = Math.min(1.4, (discount / 100) * responseRate);
      const expectedSales = Math.max(1, Math.round(baseDemand * (1 + customerLift)));
      const sellingPrice = Math.round(price * (1 - discount / 100) * 100) / 100;
      const projectedRevenue = Math.round(sellingPrice * expectedSales * 100) / 100;
      const projectedProfit =
        unitCost !== null
          ? Math.round((sellingPrice - unitCost) * expectedSales * 100) / 100
          : null;
      const projectedMargin =
        projectedProfit !== null && projectedRevenue > 0
          ? Math.round((projectedProfit / projectedRevenue) * 1000) / 10
          : null;

      return {
        discount,
        discountLabel: `${discount}%`,
        sellingPrice,
        expectedSales,
        customerLiftPercent: Math.round(customerLift * 100),
        projectedRevenue,
        projectedProfit,
        projectedMargin,
      };
    });
  }, [selectedPricingItem]);

  const currentPricingScenario =
    pricingScenarios.find((scenario) => scenario.discount === discountValue[0]) ||
    pricingScenarios[0] ||
    null;
  const baselinePricingScenario = pricingScenarios[0] || null;
  const minimumPricingMargin = 30;
  const profitablePricingScenarios = pricingScenarios.filter(
    (scenario) =>
      scenario.projectedProfit !== null &&
      (scenario.projectedMargin ?? 0) >= minimumPricingMargin,
  );
  const recommendedPricingScenario =
    (profitablePricingScenarios.length ? profitablePricingScenarios : pricingScenarios)
      .slice()
      .sort(
        (a, b) =>
          (b.projectedProfit ?? b.projectedRevenue) -
          (a.projectedProfit ?? a.projectedRevenue),
      )[0] || null;
  const maxSafeItemDiscount =
    selectedPricingItem?.price &&
    selectedPricingItem.unitCost !== null &&
    selectedPricingItem.unitCost !== undefined
      ? Math.max(
          0,
          Math.min(
            50,
            Math.floor(
              (1 -
                selectedPricingItem.unitCost /
                  (selectedPricingItem.price * (1 - minimumPricingMargin / 100))) *
                100,
            ),
          ),
        )
      : null;
  const selectedProfitChange =
    currentPricingScenario &&
    baselinePricingScenario &&
    currentPricingScenario.projectedProfit !== null &&
    baselinePricingScenario.projectedProfit !== null
      ? Math.round(
          (currentPricingScenario.projectedProfit -
            baselinePricingScenario.projectedProfit) *
            100,
        ) / 100
      : null;

  const trafficSectors = [
    { name: "Services", color: "#3AE4FA", placeholderStaff: 2 },
    { name: "Cafe", color: "#F53799", placeholderStaff: 2 },
    { name: "Retail", color: "#F59E0B", placeholderStaff: 1 },
  ];
  const trafficColumns = useMemo(
    () => trafficOptimizerData?.columns || [],
    [trafficOptimizerData],
  );
  const trafficDisplayMode = trafficOptimizerData?.displayMode || "daily";
  const trafficVisitDefinition = trafficOptimizerData?.visitDefinition ||
    "Unique transaction IDs from ingested physical-channel rows.";

  const demandStyles: Record<DemandLevel, { bg: string; text: string; label: string }> = {
    Low: { bg: "bg-green-50", text: "text-green-700", label: "Low" },
    Medium: { bg: "bg-yellow-50", text: "text-yellow-700", label: "Medium" },
    High: { bg: "bg-red-50", text: "text-red-700", label: "High" },
  };

  const getDemandLevel = (value: number): DemandLevel => {
    if (value >= 42) return "High";
    if (value >= 28) return "Medium";
    return "Low";
  };

  const getRequiredStaff = (sector: string, level: string) => {
    if (sector === "Services") {
      if (level === "High") return 4;
      if (level === "Medium") return 2;
      return 1;
    }
    if (sector === "Cafe") {
      if (level === "High") return 3;
      if (level === "Medium") return 2;
      return 1;
    }
    if (level === "High") return 2;
    return 1;
  };

  const sectorTrafficForecast = useMemo(() => {
    const trafficRowsBySector = new Map(
      (trafficOptimizerData?.sectors || []).map((sector) => [sector.sector, sector]),
    );

    return trafficSectors.map((sector) => {
      const trafficRow = trafficRowsBySector.get(sector.name as "Services" | "Cafe" | "Retail");
      const valuesByKey = new Map(
        (trafficRow?.values || []).map((value) => [value.key, value]),
      );
      const dayForecasts = trafficColumns.map((column) => {
        const trafficValue = valuesByKey.get(column.key);
        const visits = Number(trafficValue?.visits || 0);
        const level = getDemandLevel(visits);
        const requiredStaff = getRequiredStaff(sector.name, level);
        const scheduledStaff = sector.placeholderStaff;
        const staffDelta = requiredStaff - scheduledStaff;

        return {
          day: column.dayLabel,
          label: column.label,
          key: column.key,
          date: column.date,
          predicted: visits,
          actual: visits,
          level,
          requiredStaff,
          scheduledStaff,
          staffDelta,
        };
      });

      return {
        ...sector,
        forecasts: dayForecasts,
        totalVisits: trafficRow?.totalVisits || 0,
        peakVisits: trafficRow?.peakVisits || 0,
        averageVisits: trafficRow?.averageVisits || 0,
      };
    });
  }, [trafficOptimizerData, trafficColumns]);

  const selectedTimeStaffPlan = sectorTrafficForecast.map((sector) => {
    const peakForecast = sector.forecasts.reduce(
      (peak, forecast) => (forecast.predicted > peak.predicted ? forecast : peak),
      sector.forecasts[0] || {
        day: "",
        label: "No matching transactions",
        key: "empty",
        predicted: 0,
        actual: 0,
        level: "Low",
        requiredStaff: getRequiredStaff(sector.name, "Low"),
        scheduledStaff: sector.placeholderStaff,
        staffDelta: getRequiredStaff(sector.name, "Low") - sector.placeholderStaff,
      },
    );

    return {
      sector: sector.name,
      color: sector.color,
      ...peakForecast,
    };
  });

  const totalPredictedTraffic = trafficOptimizerData?.totalVisits ||
    sectorTrafficForecast.reduce((sum, sector) => sum + (sector.totalVisits || 0), 0);
  const highDemandSectors = selectedTimeStaffPlan.filter((sector) => sector.level === "High").length;
  const totalScheduledPlaceholderStaff = selectedTimeStaffPlan.reduce((sum, sector) => sum + sector.scheduledStaff, 0);
  const totalRecommendedStaff = selectedTimeStaffPlan.reduce((sum, sector) => sum + sector.requiredStaff, 0);

  const formatTrafficVisitValue = (value: number) =>
    Number.isInteger(value) ? String(value) : value.toFixed(1);

  // Traffic volume based on the Header Filter and selected time slot
  const trafficPrediction = useMemo(() => {
    return trafficColumns.map((column, columnIndex) => {
      const sectorTotals = sectorTrafficForecast.map((sector) => sector.forecasts[columnIndex]);
      return {
        day: column.label,
        visits: sectorTotals.reduce((sum, item) => sum + (item?.predicted || 0), 0),
      };
    });
  }, [sectorTrafficForecast, trafficColumns]);

  // Past Happy Hour Performance
  const happyHourHistory = [
    { date: "Apr 12", time: "3-4 PM", predicted: "+15%", actual: "+18%", result: "✓", lift: 18 },
    { date: "Apr 10", time: "2-3 PM", predicted: "+12%", actual: "+14%", result: "✓", lift: 14 },
    { date: "Apr 8", time: "4-5 PM", predicted: "+20%", actual: "+16%", result: "~", lift: 16 },
    { date: "Apr 6", time: "3-4 PM", predicted: "+18%", actual: "+22%", result: "✓", lift: 22 },
  ];

  const extractForecastTotals = (run?: ForecastRun | any | null) => {
    const forecastRows = Array.isArray(run?.forecast) ? run.forecast.slice(0, 7) : [];
    const historicalRows = Array.isArray(run?.historical) ? run.historical.slice(-7) : [];
    const unitPrice = Number(run?.modelMetadata?.priceCalibration?.unitPrice || run?.kpis?.avgOrderValue || 0);
    const avgOrderValue = Number(run?.kpis?.avgOrderValue || 0) || 350;
    const rows = forecastRows.length ? forecastRows : historicalRows;
    const revenue = rows.reduce((sum: number, point: any) => {
      const projected = Number(point.projectedNetSales ?? point.revenue ?? point.actual);
      const quantity = Number(point.forecastQuantity ?? point.forecast ?? point.orders ?? 0);
      return sum + (Number.isFinite(projected) && projected > 0 ? projected : quantity * unitPrice);
    }, 0);
    const orders = rows.reduce((sum: number, point: any) => {
      const quantity = Number(point.forecastQuantity ?? point.forecast ?? point.orders);
      if (Number.isFinite(quantity) && quantity > 0) return sum + quantity;
      const projected = Number(point.projectedNetSales ?? point.revenue ?? point.actual);
      return sum + (Number.isFinite(projected) && projected > 0 ? projected / avgOrderValue : 0);
    }, 0);

    return { revenue, orders };
  };

  const combineForecastTotals = (set: ScenarioForecastSet) => {
    const cafe = extractForecastTotals(set.cafe);
    const services = extractForecastTotals(set.services);
    const retail = extractForecastTotals(set.retail);
    return {
      revenue: cafe.revenue + services.revenue + retail.revenue,
      orders: cafe.orders + services.orders + retail.orders,
      cafeRevenue: cafe.revenue,
      servicesRevenue: services.revenue,
      retailRevenue: retail.revenue,
    };
  };

  useEffect(() => {
    let cancelled = false;
    setScenarioLoading(true);
    setScenarioError(null);

    const scenarioParams = {
      days: "7",
      temp: String(debouncedScenarioTemperature),
      rain: weather === "rainy" ? "1" : "0",
      holiday: paydayWeekend ? "1" : "0",
    };

    Promise.all([
      getForecast("Cafe", { days: "7" }),
      getForecast("Services", { days: "7" }),
      getForecast("Retail", { days: "7" }),
      getForecast("Cafe", scenarioParams),
      getForecast("Services", scenarioParams),
      getForecast("Retail", scenarioParams),
      getNextQuietPeriod().catch(() => null),
    ])
      .then(([baselineCafe, baselineServices, baselineRetail, scenarioCafe, scenarioServices, scenarioRetail, quietPeriod]) => {
        if (!cancelled) {
          setScenarioBaselineForecasts({ cafe: baselineCafe, services: baselineServices, retail: baselineRetail });
          setScenarioForecasts({ cafe: scenarioCafe, services: scenarioServices, retail: scenarioRetail });
          setScenarioPromoModel(quietPeriod);
          if (scenarioRefreshKey > 0) {
            toast.success("Scenario predictions updated.", {
              description: "Forecast and promo model outputs are reflected in Scenario Builder.",
            });
          }
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setScenarioError(error.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setScenarioLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedScenarioTemperature, paydayWeekend, scenarioRefreshKey, weather]);

  const scenarioFactorBreakdown = useMemo<ScenarioFactor[]>(() => {
    const isWeekend = dayOfWeek === "saturday" || dayOfWeek === "sunday";
    const promoProbability =
      scenarioPromoModel?.status === "success"
        ? Number(scenarioPromoModel.probabilityScore || 0)
        : 0.55;
    const promoImpact = promoActive ? 0.08 + Math.min(0.12, promoProbability * 0.12) : 0;

    return [
      {
        factor: "Forecast Model",
        impact: 0,
        description: "Cafe, Services, and Retail forecasts provide the baseline demand and revenue.",
      },
      {
        factor: "Weather",
        impact: weather === "rainy" ? -0.06 : weather === "sunny" ? 0.04 : 0,
        description: weather === "rainy" ? "Rain usually softens walk-in demand." : weather === "sunny" ? "Clear weather can improve walk-ins." : "Cloudy weather is treated as neutral.",
      },
      {
        factor: "Day of Week",
        impact: isWeekend ? 0.12 : 0,
        description: isWeekend ? "Weekend scenarios usually support more visits." : "Weekday demand is kept near forecast baseline.",
      },
      {
        factor: "Active Promo",
        impact: promoImpact,
        description: promoActive
          ? scenarioPromoModel?.modelMetrics?.trainingSource === "real_discount_history"
            ? `Promo lift uses the dynamic promo model trained from ${scenarioPromoModel.modelMetrics.trainingRows} historical discount examples.`
            : "Promo lift uses the dynamic promo model; fallback assumptions apply until enough historical discount examples are available."
          : "No promotion lift is applied.",
      },
      {
        factor: "Temperature",
        impact: debouncedScenarioTemperature > 32 ? -0.04 : debouncedScenarioTemperature < 24 ? -0.02 : 0.02,
        description: "Comfortable weather gets a small lift; very hot or cool days reduce visits slightly.",
      },
      {
        factor: "Payday Weekend",
        impact: paydayWeekend ? 0.16 : 0,
        description: paydayWeekend ? "Payday timing increases expected spend and orders." : "No payday lift is applied.",
      },
    ];
  }, [
    dayOfWeek,
    debouncedScenarioTemperature,
    paydayWeekend,
    promoActive,
    scenarioPromoModel,
    weather,
  ]);

  const scenarioOutcome = useMemo(() => {
    const baseline = combineForecastTotals(scenarioBaselineForecasts);
    const scenarioBase = combineForecastTotals(scenarioForecasts);
    const baselineRevenue = baseline.revenue || rawAnalysis?.totalRevenue || 1;
    const baselineOrders = baseline.orders || rawAnalysis?.totalTransactions || 1;
    const totalImpact = scenarioFactorBreakdown.reduce((sum, factor) => sum + factor.impact, 0);
    const cappedImpact = Math.max(-0.35, Math.min(0.55, totalImpact));
    const modelRevenue = scenarioBase.revenue || baselineRevenue;
    const modelOrders = scenarioBase.orders || baselineOrders;
    const projectedRevenue = Math.max(0, modelRevenue * (1 + cappedImpact));
    const projectedOrders = Math.max(0, modelOrders * (1 + cappedImpact * 0.8));
    const baselineAvgTransaction = baselineRevenue / Math.max(1, baselineOrders);
    const avgTransaction = projectedRevenue / Math.max(1, projectedOrders);
    const cafeShare = projectedRevenue > 0 ? (scenarioBase.cafeRevenue / projectedRevenue) * 100 : 0;
    const baselineCafeShare = baselineRevenue > 0 ? (baseline.cafeRevenue / baselineRevenue) * 100 : 0;
    const accuracyValues = [
      scenarioForecasts.cafe?.accuracy,
      scenarioForecasts.services?.accuracy,
      scenarioForecasts.retail?.modelInfo?.accuracy,
    ]
      .map(Number)
      .filter((value) => Number.isFinite(value) && value > 0);
    const confidence = accuracyValues.length
      ? Math.round(accuracyValues.reduce((sum, value) => sum + value, 0) / accuracyValues.length)
      : 0;

    return {
      revenue: Math.round(projectedRevenue),
      orders: Math.round(projectedOrders),
      avgTransaction: Math.round(avgTransaction),
      cafeShare: Number.isFinite(cafeShare) ? cafeShare.toFixed(1) : "0.0",
      revenueChange: (((projectedRevenue - baselineRevenue) / baselineRevenue) * 100).toFixed(1),
      ordersChange: (((projectedOrders - baselineOrders) / baselineOrders) * 100).toFixed(1),
      avgTransactionChange: (((avgTransaction - baselineAvgTransaction) / baselineAvgTransaction) * 100).toFixed(1),
      cafeShareChange: (cafeShare - baselineCafeShare).toFixed(1),
      baselineRevenue: Math.round(baselineRevenue),
      baselineOrders: Math.round(baselineOrders),
      confidence,
      sourceLabel: baseline.revenue > 0 ? "Forecast APIs" : "Current filtered transaction summary",
    };
  }, [rawAnalysis, scenarioBaselineForecasts, scenarioFactorBreakdown, scenarioForecasts]);

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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="border-[#FFD9EC] text-[#223047] px-3 md:px-4 py-1 text-xs md:text-sm cursor-help">
                  Range Source: {selectedHeaderRangeLabel}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-[260px]">
                Bundle Simulator reports are scoped to the Header Filter and anchored on the latest ingested transaction date, not today's calendar date.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
      <TooltipProvider>
        <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {/* Active Patterns */}
            <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#F53799] to-[#D42A7D] flex items-center justify-center flex-shrink-0">
                <FlaskConical className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 text-xs text-[#223047] opacity-70">
                  <span className="truncate">Discovered Item Bundles</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3 h-3 text-[#F53799] cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[220px]">
                      Number of statistically validated product combination rules automatically extracted from customer transaction history.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-base md:text-xl font-bold text-[#223047]">{rules.length}</div>
              </div>
            </div>

            {/* Bundle Candidates */}
            <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#3AE4FA] to-[#5CE1E6] flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 text-xs text-[#223047] opacity-70">
                  <span className="truncate">Bundle Candidates</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3 h-3 text-[#3AE4FA] cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[220px]">
                      High-potential product pairs combining popular fast-sellers with slower-moving offers to boost revenue.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-base md:text-xl font-bold text-[#223047]">{bundleCandidates.length}</div>
              </div>
            </div>

            {/* Avg Rule Lift */}
            <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#F53799] to-[#D42A7D] flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 text-xs text-[#223047] opacity-70">
                  <span className="truncate">Avg Sales Boost (Lift)</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3 h-3 text-[#F53799] cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[240px]">
                      Lift measures how much more frequently two items are bought together compared to random chance. 2.0x means double the normal co-purchase probability.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-base md:text-xl font-bold text-[#223047]">{avgRuleLift.toFixed(2)}x</div>
              </div>
            </div>

            {/* Avg Historical Confidence */}
            <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#3AE4FA] to-[#5CE1E6] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 text-xs text-[#223047] opacity-70">
                  <span className="truncate">Avg Historical Confidence</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3 h-3 text-[#3AE4FA] cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[220px]">
                      Historical confidence measures how often Item B appeared in uploaded baskets that contained Item A.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-base md:text-xl font-bold text-[#223047]">{formatPercent(avgRuleConfidence)}</div>
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>

      {/* TAB NAVIGATION */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-2 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-1.5 md:gap-2 px-2 md:px-4 py-2 md:py-3 rounded-xl transition-all ${activeTab === tab.id
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
                  Live transaction stream feeding AI pattern detection models for {selectedHeaderRangeLabel}
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
                    <RechartsTooltip
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
                        <span className="text-[#223047] font-medium">{item.pair}</span>
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
                    Association rule mining and pattern visualization for {selectedHeaderRangeLabel}
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
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                      <linearGradient key="lineGradient-gradient" id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F53799" />
                        <stop offset="100%" stopColor="#3AE4FA" />
                      </linearGradient>
                    </defs>

                    {networkNodes.length === 0 && (
                      <text
                        x="300"
                        y="240"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-sm font-semibold"
                        fill="#223047"
                      >
                        No association rules match the selected thresholds.
                      </text>
                    )}

                    {/* Connection Lines - Varying thickness based on historical confidence */}
                    {networkConnections.map((conn, idx) => {
                      const sourceNode = networkNodes.find(n => n.id === conn.source);
                      const targetNode = networkNodes.find(n => n.id === conn.target);
                      if (!sourceNode || !targetNode) return null;

                      const sourcePos = { x: sourceNode.x, y: sourceNode.y };
                      const targetPos = { x: targetNode.x, y: targetNode.y };

                      // Line thickness based on historical confidence (2-12px)
                      const thickness = 2 + (conn.confidence / 100) * 10;
                      const opacity = 0.3 + (conn.confidence / 100) * 0.5;

                      return (
                        <g key={idx}>
                          <title>{`${conn.sourceName} + ${conn.targetName} | Historical Confidence: ${conn.confidence}%, Lift: ${conn.lift.toFixed(2)}x, Co-occurrences: ${conn.cooccurrences}`}</title>
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
                      // Node size based on frequency (32-56px radius)
                      const radius = 32 + (node.frequency / 100) * 24;

                      // Smart SVG text wrapping
                      const words = (node.name || "").split(" ");
                      const lines: string[] = [];
                      let currentLine = "";
                      words.forEach((w) => {
                        if ((currentLine + " " + w).trim().length <= 11) {
                          currentLine = (currentLine + " " + w).trim();
                        } else {
                          if (currentLine) lines.push(currentLine);
                          currentLine = w.length > 11 ? w.slice(0, 10) + "…" : w;
                        }
                      });
                      if (currentLine) lines.push(currentLine);
                      const displayLines = lines.slice(0, 3);

                      return (
                        <g key={node.id}>
                          <title>{`${node.name} (${formatSector(node.category)}) - Appears in ${node.frequency}% of baskets, Basket Count: ${node.basketCount}`}</title>
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
                            className="text-[10px] font-bold pointer-events-none"
                            fill="#223047"
                          >
                            {displayLines.map((line: string, i: number, arr: string[]) => {
                              const total = arr.length;
                              const startDy = total === 1 ? 0 : total === 2 ? -5 : -10;
                              return (
                                <tspan key={i} x={pos.x} dy={i === 0 ? startDy : 12}>
                                  {line}
                                </tspan>
                              );
                            })}
                          </text>
                          {/* Basket appearance badge */}
                          <rect
                            x={pos.x + radius - 42}
                            y={pos.y - radius - 4}
                            width="54"
                            height="24"
                            rx="8"
                            fill={node.color}
                          />
                          <text
                            x={pos.x + radius - 15}
                            y={pos.y - radius + 4}
                            textAnchor="middle"
                            className="text-[8px] font-bold"
                            fill="white"
                          >
                            <tspan x={pos.x + radius - 15} dy="0">{Math.round(node.frequency)}%</tspan>
                            <tspan x={pos.x + radius - 15} dy="9">of baskets</tspan>
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
                  <div className="text-[9px] md:text-[10px] font-bold text-[#223047] mb-1.5 md:mb-2 tracking-wider">NODE SIZE = ITEM APPEARANCE</div>
                  <div className="text-[9px] md:text-[10px] text-[#223047] opacity-70 mb-2">Badge shows % of baskets containing the item.</div>
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
              <TooltipProvider>
                <div className="space-y-3 md:space-y-4">
                  <div className="bg-gradient-to-br from-[#F53799] to-[#D42A7D] border border-[#F53799] rounded-xl md:rounded-2xl p-4 md:p-6 text-white shadow-xl">
                    <div className="flex items-center gap-2 mb-3 md:mb-4">
                      <Target className="w-4 h-4 md:w-5 md:h-5" />
                      <h3 className="text-sm md:text-base font-bold">Pattern Filters</h3>
                    </div>
                    <p className="text-xs opacity-90 mb-4 md:mb-6">
                      Choose how strict the graph should be when showing repeated item appearances and co-purchase links.
                    </p>

                    <div className="grid grid-cols-3 gap-2 mb-5">
                      {[
                        { label: "Explore", support: 5, confidence: 60 },
                        { label: "Balanced", support: 10, confidence: 70 },
                        { label: "Strict", support: 20, confidence: 85 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setSupportThreshold([preset.support]);
                            setConfidenceLevel([preset.confidence]);
                          }}
                          className={`rounded-lg border px-2 py-2 text-[11px] font-bold transition ${supportThreshold[0] === preset.support && confidenceLevel[0] === preset.confidence
                              ? "bg-white text-[#D42A7D] border-white"
                              : "bg-white/10 text-white border-white/30 hover:bg-white/20"
                            }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Product Appearance Slider */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
                          <span>ITEM APPEARANCE FLOOR</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3.5 h-3.5 text-white/80 cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[220px]">
                              The smallest basket share an item or pair must reach before it appears in the graph.
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="text-lg font-bold bg-white/20 backdrop-blur px-3 py-1 rounded-lg">
                          {supportThreshold[0]}%
                        </span>
                      </div>
                      <Slider
                        value={supportThreshold}
                        onValueChange={setSupportThreshold}
                        max={100}
                        min={5}
                        step={5}
                        className="[&_[role=slider]]:bg-white [&_[role=slider]]:w-5 [&_[role=slider]]:h-5 [&_[role=slider]]:shadow-xl [&_[role=slider]]:border-2 [&_[role=slider]]:border-[#F53799]"
                      />
                      <div className="flex justify-between text-[10px] opacity-75">
                        <span>5%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Connection Strength Slider */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
                          <span>CONNECTION STRENGTH FLOOR</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3.5 h-3.5 text-white/80 cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[220px]">
                              The minimum historical chance that the second item appears when the first item is purchased.
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="text-lg font-bold bg-white/20 backdrop-blur px-3 py-1 rounded-lg">
                          {confidenceLevel[0]}%
                        </span>
                      </div>
                      <Slider
                        value={confidenceLevel}
                        onValueChange={setConfidenceLevel}
                        max={100}
                        min={60}
                        step={5}
                        className="[&_[role=slider]]:bg-white [&_[role=slider]]:w-5 [&_[role=slider]]:h-5 [&_[role=slider]]:shadow-xl [&_[role=slider]]:border-2 [&_[role=slider]]:border-[#F53799]"
                      />
                      <div className="flex justify-between text-[10px] opacity-75">
                        <span>60%</span>
                        <span>80%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Metrics */}
                  <div className="bg-gradient-to-br from-[#FFF7FB] to-white border border-[#FFD9EC] rounded-xl md:rounded-2xl p-4 md:p-5 space-y-3 md:space-y-4">
                    <div className="text-xs font-bold text-[#223047] tracking-wider mb-2 md:mb-3">VISIBLE PATTERNS</div>

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
                        <span className="text-xs text-[#223047]">Avg Historical Confidence</span>
                        <span className="text-lg font-bold text-[#D42A7D]">
                          {networkConnections.length > 0
                            ? Math.round(networkConnections.reduce((sum, c) => sum + c.confidence, 0) / networkConnections.length)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TooltipProvider>
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
                    <span className="text-[#223047] opacity-60">Historical Confidence:</span>
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
                  Highest-ranked model recommendation
                </div>
                <div className="mt-3 pt-3 border-t border-[#3AE4FA]/20">
                  <div className="text-xs text-emerald-600 font-semibold">
                    {topInsights.trendGrowth}
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
                  Generated from FP-Growth analysis of {formatHour(dataTime[0])} transaction patterns for {selectedHeaderRangeLabel}
                </p>
              </div>
              <Badge className="bg-[#5CE1E6] text-white hover:bg-[#5CE1E6] text-xs md:text-sm">
                {bundlePredictions.length} of {allBundlePredictions.length} Bundles Shown
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setBundleCategoryFilter("all")}
                className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${bundleCategoryFilter === "all"
                    ? "bg-[#F53799] text-white border-[#F53799]"
                    : "bg-white text-[#223047] border-[#FFD9EC] hover:border-[#F53799]"
                  }`}
              >
                All Bundle Types
              </button>
              {bundleCategoryOptions.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setBundleCategoryFilter(category)}
                  className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${bundleCategoryFilter === category
                      ? "bg-[#F53799] text-white border-[#F53799]"
                      : "bg-white text-[#223047] border-[#FFD9EC] hover:border-[#F53799]"
                    }`}
                >
                  {formatBundleCategoryKey(category)}
                </button>
              ))}
            </div>

            <div className="grid gap-3 md:gap-4">
              {bundlePredictions.length === 0 && (
                <div className="p-4 md:p-6 bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl text-sm text-[#223047] opacity-70">
                  No bundle opportunities match the selected type and thresholds. Try another bundle type or use a broader pattern filter.
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
                      {bundle.bundleArchetype && (
                        <Badge className="bg-[#F53799]/10 text-[#F53799] border border-[#F53799]/30 text-xs font-semibold">
                          {bundle.bundleArchetype}
                        </Badge>
                      )}
                      {bundle.isEmergingTrend && (
                        <Badge className="bg-amber-500 text-white font-bold text-xs shadow-xs animate-pulse">
                          🔥 Emerging Trend
                        </Badge>
                      )}
                      {bundle.synergyScore !== undefined && bundle.synergyScore !== null && (
                        <div className="relative group inline-block">
                          <Badge className="bg-gradient-to-r from-[#F53799] to-[#3AE4FA] text-white border-0 text-xs font-mono font-bold cursor-help shadow-xs">
                            {bundle.synergyScore.toFixed(0)}% Synergy
                          </Badge>
                          {bundle.synergyBreakdown && (
                            <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-30 bg-[#223047] text-white text-[11px] p-3 rounded-xl shadow-xl w-60 space-y-1.5 border border-slate-700">
                              <p className="font-bold border-b border-slate-700 pb-1 text-[#3AE4FA]">
                                Synergy Formula Breakdown
                              </p>
                              <div className="flex justify-between">
                                <span>Norm. Lift (35%):</span>
                                <span className="font-mono text-emerald-400">{(bundle.synergyBreakdown.liftScore * 100).toFixed(0)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Category Fit (35%):</span>
                                <span className="font-mono text-amber-400">{(bundle.synergyBreakdown.categoryCompat * 100).toFixed(0)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Species Match (15%):</span>
                                <span className="font-mono text-purple-400">{(bundle.synergyBreakdown.speciesMatch * 100).toFixed(0)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Price Affinity (15%):</span>
                                <span className="font-mono text-teal-400">{(bundle.synergyBreakdown.priceAffinity * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <Badge className="bg-[#3AE4FA] text-white hover:bg-[#3AE4FA] text-xs">
                        {bundle.confidence}% Historical Confidence
                      </Badge>
                      <Badge variant="outline" className="text-xs border-[#F53799] text-[#F53799]">
                        {bundle.sectorPair}
                      </Badge>
                      {bundle.businessFitScore !== null && (
                        <Badge variant="outline" className="text-xs border-emerald-500 text-emerald-700">
                          Business Fit {Math.round((bundle.businessFitScore || 0) * 100)}%
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-6 text-xs md:text-sm mb-2">
                      <div>
                        <span className="text-[#223047] opacity-60">Lift:</span>
                        <span className="ml-2 font-bold text-[#F53799]">{bundle.lift.toFixed(2)}x</span>
                      </div>
                      <div>
                        <span className="text-[#223047] opacity-60">Model Score:</span>
                        <span className="ml-2 font-semibold text-[#223047]">{bundle.score}</span>
                      </div>
                      <div>
                        <span className="text-[#223047] opacity-60">Co-occurrence:</span>
                        <span className="ml-2 font-semibold text-[#223047]">{bundle.frequency} times</span>
                      </div>
                    </div>

                    {/* Pricing Breakdown Bar */}
                    {bundle.regularPrice > 0 ? (
                      <div className="my-2.5 bg-[#FFF2FA] p-3 rounded-xl border border-[#FFD9EC]/70 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#223047]">
                            <Tag className="w-3.5 h-3.5 text-[#F53799]" />
                            <span>{bundle.itemA}: {formatCurrency(bundle.itemAPrice)}</span>
                            <span className="text-gray-400">+</span>
                            <span>{bundle.itemB}: {formatCurrency(bundle.itemBPrice)}</span>
                          </div>
                          <div className="flex items-center gap-2.5 ml-auto">
                            <span className="line-through text-gray-400 text-xs font-medium">{formatCurrency(bundle.regularPrice)}</span>
                            <span className="font-extrabold text-[#F53799] text-base">{formatCurrency(bundle.bundlePrice)}</span>
                            <Badge className="bg-emerald-500 text-white text-[11px] px-2.5 py-0.5 font-bold">
                              Save {formatCurrency(bundle.savings)} ({bundle.selectedDiscountPercent}% OFF)
                            </Badge>
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                            <div className="text-xs font-semibold text-[#223047]">
                              Suggested Discount: {bundle.suggestedDiscountPercent}%
                            </div>
                            <div className="text-xs text-[#223047] opacity-70">
                              Selected: {bundle.selectedDiscountPercent}%
                            </div>
                          </div>
                          <Slider
                            value={[bundle.selectedDiscountPercent]}
                            onValueChange={(value) =>
                              setBundleDiscountOverrides((prev) => ({
                                ...prev,
                                [bundle.key]: value[0],
                              }))
                            }
                            max={Math.max(1, Math.floor(bundle.maxSafeDiscountPercent || 25))}
                            min={0}
                            step={1}
                            className="[&_[role=slider]]:bg-white [&_[role=slider]]:w-5 [&_[role=slider]]:h-5 [&_[role=slider]]:shadow-xl [&_[role=slider]]:border-2 [&_[role=slider]]:border-[#F53799]"
                          />
                          <div className="text-[11px] text-[#223047] opacity-70">
                            {bundle.discountRationale || "WOOF recommends a discount only when price and cost data can protect margin."}
                          </div>
                          {bundle.selectedDiscountPercent !== bundle.suggestedDiscountPercent && (
                            <div className={`text-[11px] font-semibold ${bundle.marginIsSafe ? "text-emerald-700" : "text-red-600"}`}>
                              {bundle.selectedDiscountPercent > bundle.suggestedDiscountPercent
                                ? `You chose ${bundle.selectedDiscountPercent - bundle.suggestedDiscountPercent} percentage points above the suggestion.`
                                : `You chose ${bundle.suggestedDiscountPercent - bundle.selectedDiscountPercent} percentage points below the suggestion.`}
                              {bundle.projectedMarginPercent !== null
                                ? ` Projected margin is ${bundle.projectedMarginPercent}% against the ${bundle.minimumMarginPercent ?? 30}% minimum.`
                                : " Margin impact cannot be computed without cost data."}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-[#223047]">
                          <div className="bg-white/70 rounded-lg p-2">
                            <div className="opacity-60">Projected Gross Profit</div>
                            <div className="font-bold">{formatCurrency(bundle.projectedGrossProfit)}</div>
                          </div>
                          <div className="bg-white/70 rounded-lg p-2">
                            <div className="opacity-60">Projected Margin</div>
                            <div className={`font-bold ${bundle.marginIsSafe ? "text-emerald-700" : "text-red-600"}`}>
                              {bundle.projectedMarginPercent !== null ? `${bundle.projectedMarginPercent}%` : "Unavailable"}
                            </div>
                          </div>
                          <div className="bg-white/70 rounded-lg p-2">
                            <div className="opacity-60">Safe Discount Ceiling</div>
                            <div className="font-bold">
                              {bundle.maxSafeDiscountPercent !== null ? `${bundle.maxSafeDiscountPercent}%` : "Unavailable"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-[#223047] opacity-60 my-1">
                        Price or cost data is incomplete, so the owner must set promotion terms manually before approval.
                      </div>
                    )}
                    <div className="text-xs md:text-sm text-[#223047] opacity-70" style={{ lineHeight: "1.5" }}>
                      {bundle.type}: {bundle.reason}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2 w-full md:w-auto shrink-0">
                    <Button
                      variant="outline"
                      onClick={() => handleOpenDrawer((bundle as any).rawCandidate || (bundle as any))}
                      className="border-[#F53799] text-[#F53799] hover:bg-[#FFF2FA] text-xs md:text-sm font-bold flex items-center justify-center gap-1.5"
                    >
                      <HelpCircle className="w-4 h-4" />
                      Why this bundle?
                    </Button>
                    <Button
                      onClick={() => handleSubmitBundleForReview(bundle)}
                      className="bg-[#F53799] hover:bg-[#D42A7D] text-xs md:text-sm font-bold shadow-md"
                    >
                      Submit for Review
                    </Button>
                  </div>
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
                  No proximity recommendations are available for the selected hour and Header Filter range. The placement advice will appear once FP-Growth rules or bundle candidates are detected from the ingested baskets.
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
        <div className="space-y-4 md:space-y-6">
          <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
                  Choose Item To Price
                </h2>
                <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
                  Search {pricingCatalogRangeLabel} and choose one product, item, or service to test.
                </p>
              </div>
              <div className="w-full lg:w-[360px] space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#223047] opacity-40" />
                  <input
                    value={pricingSearch}
                    onChange={(event) => setPricingSearch(event.target.value)}
                    placeholder="Search item or service"
                    className="w-full h-10 rounded-lg border border-[#FFD9EC] pl-9 pr-3 text-sm text-[#223047] focus:outline-none focus:ring-2 focus:ring-[#F53799]"
                  />
                </div>
                <label className="flex items-center justify-between gap-3 rounded-lg border border-[#FFD9EC] bg-[#FFF7FB] px-3 py-2 text-xs text-[#223047]">
                  <span className="font-semibold">Full Catalog</span>
                  <input
                    type="checkbox"
                    checked={pricingUsesFullCatalog}
                    onChange={(event) => setPricingUsesFullCatalog(event.target.checked)}
                    className="h-4 w-4 accent-[#F53799]"
                    aria-label="Show full pricing catalog"
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {pricingCategoryOptions.map((option) => {
                  const isActive = pricingCategoryFilter === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setPricingCategoryFilter(option.id)}
                      className={`h-9 rounded-lg border px-3 text-xs font-semibold transition ${
                        isActive
                          ? "border-[#F53799] bg-[#F53799] text-white"
                          : "border-[#FFD9EC] bg-white text-[#223047] hover:border-[#F53799]"
                      }`}
                    >
                      {option.label} ({pricingCategoryCounts[option.id] || 0})
                    </button>
                  );
                })}
              </div>
              <div className="text-xs text-[#223047] opacity-60">
                {pricingCatalogLoading
                  ? "Loading catalog..."
                  : `Showing ${visiblePricingItems.length ? (pricingPage - 1) * 5 + 1 : 0}-${Math.min(pricingPage * 5, filteredPricingItems.length)} of ${filteredPricingItems.length}`}
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1">
              {visiblePricingItems.length === 0 && (
                <div className="min-w-full rounded-xl border border-[#FFD9EC] bg-[#FFF7FB] p-4 text-sm text-[#223047] opacity-70">
                  {pricingCatalogError || `No matching items were found for ${pricingCatalogRangeLabel}.`}
                </div>
              )}
              {visiblePricingItems.map((item) => {
                const isSelected = item.name === selectedPricingItem?.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedPricingItemName(item.name)}
                    className={`min-w-[220px] max-w-[240px] rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? "border-[#F53799] bg-[#FFF2FA] shadow-sm"
                        : "border-[#FFD9EC] bg-white hover:border-[#F53799]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-[#223047]">{item.name}</div>
                        <div className="mt-1 text-[11px] text-[#223047] opacity-60">
                          {formatSector(item.sector)} | {item.velocity} mover
                        </div>
                      </div>
                      <ShoppingBag className="w-4 h-4 text-[#F53799] flex-shrink-0" />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-[#223047]">
                      <div>
                        <div className="opacity-60">Current Price</div>
                        <div className="font-bold">{formatCurrency(item.price)}</div>
                      </div>
                      <div>
                        <div className="opacity-60">Sold In Baskets</div>
                        <div className="font-bold">{item.basketCount}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredPricingItems.length > 5 && (
              <div className="flex items-center gap-2 overflow-x-auto pt-1">
                {Array.from({ length: pricingPageCount }, (_, index) => index + 1).map((page) => {
                  const isActive = pricingPage === page;
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setPricingPage(page)}
                      className={`h-8 min-w-8 rounded-lg border px-2 text-xs font-bold transition ${
                        isActive
                          ? "border-[#223047] bg-[#223047] text-white"
                          : "border-[#FFD9EC] bg-white text-[#223047] hover:border-[#F53799]"
                      }`}
                      aria-label={`Show pricing items page ${page}`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div>
                <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
                  Dynamic Pricing Simulator
                </h2>
                <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
                  Estimate sales, revenue, profit, and margin for {selectedPricingItem?.name || "a selected item"} using documented pricing assumptions.
                </p>
              </div>
              <Badge variant="outline" className="border-[#FFD9EC] text-[#223047] text-xs">
                {selectedHeaderRangeLabel}
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-4 md:gap-6">
              <div className="space-y-4">
                <div className="rounded-xl border border-[#FFD9EC] bg-[#FFF7FB] p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <label className="text-xs md:text-sm font-semibold text-[#223047]">
                      Customer Discount: {discountValue[0]}%
                    </label>
                    <div className="text-xs text-[#223047] opacity-70">
                      Suggested: {recommendedPricingScenario ? `${recommendedPricingScenario.discount}%` : "Unavailable"}
                    </div>
                  </div>
                  <Slider
                    value={discountValue}
                    onValueChange={setDiscountValue}
                    max={50}
                    min={0}
                    step={5}
                    className="[&_[role=slider]]:bg-white [&_[role=slider]]:w-5 [&_[role=slider]]:h-5 [&_[role=slider]]:shadow-xl [&_[role=slider]]:border-2 [&_[role=slider]]:border-[#F53799]"
                  />
                  <div className="flex justify-between text-[10px] text-[#223047] opacity-60 mt-2">
                    <span>No discount</span>
                    <span>25%</span>
                    <span>50%</span>
                  </div>
                  <div className="mt-3 rounded-lg bg-white border border-[#FFD9EC] px-3 py-2 text-xs text-[#223047] opacity-75" style={{ lineHeight: "1.5" }}>
                    Simulation note: expected sales use an assumed elasticity based on sector and item velocity. This is decision support, not a guaranteed ML price forecast.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="rounded-lg border border-[#FFD9EC] bg-white p-3">
                    <div className="text-[11px] text-[#223047] opacity-60">Selected Discount</div>
                    <div className="text-lg font-bold text-[#223047]">{discountValue[0]}%</div>
                  </div>
                  <div className="rounded-lg border border-[#FFD9EC] bg-white p-3">
                    <div className="text-[11px] text-[#223047] opacity-60">Revenue At Selection</div>
                    <div className="text-lg font-bold text-[#3AA7B5]">
                      {formatCurrency(currentPricingScenario?.projectedRevenue)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#FFD9EC] bg-white p-3">
                    <div className="text-[11px] text-[#223047] opacity-60">Profit At Selection</div>
                    <div className="text-lg font-bold text-[#F53799]">
                      {formatCurrency(currentPricingScenario?.projectedProfit)}
                    </div>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={300} className="md:!h-[360px]">
                  <LineChart data={pricingScenarios} margin={{ top: 30, right: 18, left: 8, bottom: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#FFD9EC" vertical={false} />
                    <XAxis
                      dataKey="discountLabel"
                      stroke="#223047"
                      style={{ fontSize: "12px" }}
                      label={{ value: "Customer discount", position: "insideBottom", offset: -10, fill: "#223047", fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#223047"
                      style={{ fontSize: "12px" }}
                      tickFormatter={(value) => formatCompactCurrency(Number(value))}
                      label={{ value: "Projected pesos", angle: -90, position: "insideLeft", fill: "#223047", fontSize: 11 }}
                    />
                    <RechartsTooltip
                      labelFormatter={(label) => `Discount: ${label}`}
                      formatter={(value: any, name: any) => [
                        typeof value === "number" ? formatCurrency(value) : value,
                        String(name),
                      ]}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #FFD9EC",
                        borderRadius: "12px",
                      }}
                    />
                    {currentPricingScenario && (
                      <ReferenceLine
                        x={currentPricingScenario.discountLabel}
                        stroke="#223047"
                        strokeDasharray="4 4"
                        label={{
                          value: `Selected ${currentPricingScenario.discountLabel}`,
                          position: "top",
                          fill: "#223047",
                          fontSize: 11,
                        }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="projectedRevenue"
                      name="Projected Revenue"
                      stroke="#3AE4FA"
                      strokeWidth={2.5}
                      dot={(props: any) => {
                        const isSelected = props.payload?.discount === discountValue[0];
                        if (props.cy === null || props.cy === undefined) {
                          return <circle cx={props.cx || 0} cy={0} r={0} />;
                        }
                        return (
                          <circle
                            cx={props.cx}
                            cy={props.cy}
                            r={isSelected ? 5 : 3}
                            fill={isSelected ? "white" : "#3AE4FA"}
                            stroke={isSelected ? "#223047" : "#3AE4FA"}
                            strokeWidth={isSelected ? 2 : 1}
                          />
                        );
                      }}
                    >
                      <LabelList
                        dataKey="projectedRevenue"
                        position="top"
                        formatter={(value: any) => formatCompactCurrency(typeof value === "number" ? value : null)}
                        fill="#3AA7B5"
                        fontSize={10}
                      />
                    </Line>
                    <Line
                      type="monotone"
                      dataKey="projectedProfit"
                      name="Projected Gross Profit"
                      stroke="#F53799"
                      strokeWidth={2.5}
                      dot={(props: any) => {
                        const isSelected = props.payload?.discount === discountValue[0];
                        if (props.cy === null || props.cy === undefined) {
                          return <circle cx={props.cx || 0} cy={0} r={0} />;
                        }
                        return (
                          <circle
                            cx={props.cx}
                            cy={props.cy}
                            r={isSelected ? 5 : 3}
                            fill={isSelected ? "white" : "#F53799"}
                            stroke={isSelected ? "#223047" : "#F53799"}
                            strokeWidth={isSelected ? 2 : 1}
                          />
                        );
                      }}
                    >
                      <LabelList
                        dataKey="projectedProfit"
                        position="bottom"
                        formatter={(value: any) => formatCompactCurrency(typeof value === "number" ? value : null)}
                        fill="#F53799"
                        fontSize={10}
                      />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl bg-[#FFF2FA] border border-[#FFD9EC] p-4">
                  <div className="text-xs text-[#223047] opacity-60">New Selling Price</div>
                  <div className="text-2xl font-bold text-[#F53799]">
                    {formatCurrency(currentPricingScenario?.sellingPrice)}
                  </div>
                  <div className="text-[11px] text-[#223047] opacity-70 mt-1">
                    Current price: {formatCurrency(selectedPricingItem?.price)}
                  </div>
                </div>
                <div className="rounded-xl bg-[#FFF7FB] border border-[#FFD9EC] p-4">
                  <div className="text-xs text-[#223047] opacity-60">Expected Sales</div>
                  <div className="text-2xl font-bold text-[#223047]">
                    {currentPricingScenario?.expectedSales ?? 0}
                  </div>
                  <div className="text-[11px] text-[#223047] opacity-70 mt-1">
                    {currentPricingScenario?.customerLiftPercent ?? 0}% more than current basket count
                  </div>
                </div>
                <div className="rounded-xl bg-[#FFF7FB] border border-[#FFD9EC] p-4">
                  <div className="text-xs text-[#223047] opacity-60">Projected Gross Profit</div>
                  <div className={`text-2xl font-bold ${selectedProfitChange !== null && selectedProfitChange < 0 ? "text-red-600" : "text-emerald-700"}`}>
                    {formatCurrency(currentPricingScenario?.projectedProfit)}
                  </div>
                  <div className="text-[11px] text-[#223047] opacity-70 mt-1">
                    Change vs no discount: {selectedProfitChange !== null ? formatCurrency(selectedProfitChange) : "Unavailable"}
                  </div>
                </div>
                <div className="rounded-xl bg-[#FFF7FB] border border-[#FFD9EC] p-4">
                  <div className="text-xs text-[#223047] opacity-60">Margin After Discount</div>
                  <div className={`text-2xl font-bold ${
                    currentPricingScenario?.projectedMargin !== null &&
                    currentPricingScenario?.projectedMargin !== undefined &&
                    currentPricingScenario.projectedMargin < minimumPricingMargin
                      ? "text-red-600"
                      : "text-[#223047]"
                  }`}>
                    {currentPricingScenario?.projectedMargin !== null &&
                    currentPricingScenario?.projectedMargin !== undefined
                      ? `${currentPricingScenario.projectedMargin}%`
                      : "Unavailable"}
                  </div>
                  <div className="text-[11px] text-[#223047] opacity-70 mt-1">
                    Safe ceiling: {maxSafeItemDiscount !== null ? `${maxSafeItemDiscount}%` : "Cost data unavailable"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#FFD9EC] bg-[#FFF7FB] px-4 py-3 text-xs text-[#223047]">
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-8 rounded-full bg-[#3AE4FA]" />
                Projected Revenue
              </span>
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-8 rounded-full bg-[#F53799]" />
                Projected Gross Profit
              </span>
            </div>

            <div className="rounded-xl border border-[#FFD9EC] bg-[#223047] p-4 text-white">
              <div className="text-xs font-bold tracking-wide mb-2">WOOF Pricing Recommendation</div>
              <p className="text-sm opacity-90" style={{ lineHeight: "1.6" }}>
                {selectedPricingItem?.price
                  ? recommendedPricingScenario
                    ? `For ${selectedPricingItem.name}, WOOF estimates that testing around ${recommendedPricingScenario.discount}% is sustainable because it produces the strongest projected gross profit under the current margin and elasticity assumptions.`
                    : `For ${selectedPricingItem.name}, WOOF needs more pricing history before recommending a discount.`
                  : "Select an item with price data to simulate a business-ready pricing recommendation."}
                {maxSafeItemDiscount !== null && discountValue[0] > maxSafeItemDiscount
                  ? ` The selected ${discountValue[0]}% discount is above the safe ceiling, so profit margin may fall below the ${minimumPricingMargin}% target.`
                : ""}
              </p>
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
                  Sector Traffic From Transactions
                </h2>
                <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
                  Observed transaction-visits for Services, Cafe, and Retail within {selectedHeaderRangeLabel}
                </p>
              </div>

              <div className="text-left md:text-right">
                <div className="text-xs md:text-sm text-[#223047] opacity-60 mb-1">Selected Time</div>
                <div className="text-base md:text-lg font-bold text-[#F53799]">{formatHour(trafficOptimizerTime[0])}</div>
              </div>
            </div>

            {/* TIME SLIDER */}
            <div className="bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl md:rounded-2xl p-4 md:p-6 space-y-3 md:space-y-4">
              <div className="text-xs md:text-sm font-semibold text-[#223047]">TIME SELECTION</div>
              <div className="relative">
                <Slider
                  value={trafficOptimizerTime}
                  onValueChange={setTrafficOptimizerTime}
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

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="p-3 md:p-4 bg-[#FFF2FA] rounded-lg md:rounded-xl text-center">
                <div className="text-xs text-[#223047] opacity-60 mb-1">Observed Visits</div>
                <div className="text-xl md:text-2xl font-bold text-[#223047]">{totalPredictedTraffic}</div>
              </div>
              <div className="p-3 md:p-4 bg-[#FFF2FA] rounded-lg md:rounded-xl text-center">
                <div className="text-xs text-[#223047] opacity-60 mb-1">High Demand Sectors</div>
                <div className="text-xl md:text-2xl font-bold text-[#F53799]">{highDemandSectors}</div>
              </div>
              <div className="p-3 md:p-4 bg-[#FFF2FA] rounded-lg md:rounded-xl text-center">
                <div className="text-xs text-[#223047] opacity-60 mb-1">Placeholder Staff</div>
                <div className="text-xl md:text-2xl font-bold text-[#3AE4FA]">{totalScheduledPlaceholderStaff}</div>
              </div>
              <div className="p-3 md:p-4 bg-[#FFF2FA] rounded-lg md:rounded-xl text-center">
                <div className="text-xs text-[#223047] opacity-60 mb-1">Recommended Staff</div>
                <div className="text-xl md:text-2xl font-bold text-[#223047]">{totalRecommendedStaff}</div>
              </div>
            </div>

            <div className="rounded-xl md:rounded-2xl border border-[#FFD9EC] overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-[#FFF7FB] px-4 py-3">
                <div>
                  <div className="text-sm font-bold text-[#223047]">Header Filter Sector Traffic Heatmap</div>
                  <div className="text-xs text-[#223047] opacity-60 mt-1">
                    {trafficVisitDefinition} {trafficDisplayMode === "weekday_average" ? "Values are weekday averages because the selected range is longer than 14 days." : "Values are daily counts for the selected range."}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#223047]">
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-green-100 border border-green-200" /> Low</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-yellow-100 border border-yellow-200" /> Medium</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-100 border border-red-200" /> High</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-t border-[#FFD9EC] bg-white text-left text-xs uppercase tracking-wide text-[#223047] opacity-70">
                      <th className="px-4 py-3 font-semibold">Sector</th>
                      {trafficColumns.map((column) => (
                        <th key={column.key} className="px-3 py-3 font-semibold text-center">{column.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trafficOptimizerLoading && (
                      <tr className="border-t border-[#FFD9EC]">
                        <td colSpan={Math.max(trafficColumns.length + 1, 2)} className="px-4 py-8 text-center text-sm text-[#223047] opacity-60">
                          Loading transaction traffic for the selected Header Filter range...
                        </td>
                      </tr>
                    )}
                    {!trafficOptimizerLoading && trafficOptimizerError && (
                      <tr className="border-t border-[#FFD9EC]">
                        <td colSpan={Math.max(trafficColumns.length + 1, 2)} className="px-4 py-8 text-center text-sm text-red-600">
                          Unable to load transaction traffic: {trafficOptimizerError}
                        </td>
                      </tr>
                    )}
                    {!trafficOptimizerLoading && !trafficOptimizerError && sectorTrafficForecast.map((sector) => (
                      <tr key={sector.name} className="border-t border-[#FFD9EC]">
                        <td className="px-4 py-3 font-semibold text-[#223047]">
                          <span className="inline-flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sector.color }} />
                            {sector.name}
                          </span>
                        </td>
                        {sector.forecasts.map((forecast) => (
                          <td key={`${sector.name}-${forecast.day}`} className="px-3 py-3">
                            <div
                              className={`mx-auto flex min-h-[54px] w-full max-w-[92px] items-center justify-center rounded-lg px-2 py-2 text-center ${demandStyles[forecast.level].bg}`}
                              title={`${forecast.level} demand from ingested transactions`}
                            >
                              <div className={`text-sm font-bold ${demandStyles[forecast.level].text}`}>
                                {formatTrafficVisitValue(forecast.predicted)}
                                <span className="block text-[10px] font-semibold text-[#223047] opacity-65">visits</span>
                              </div>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl md:rounded-2xl border border-[#FFD9EC] p-4 md:p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base md:text-lg font-bold text-[#223047]">Staffing Recommendation</h3>
                  <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1">
                    Based on the busiest matching period in the selected Header Filter range; staff counts are placeholders until staff-sector schedules are added
                  </p>
                </div>
                <Badge className="bg-[#FFF2FA] text-[#F53799] border border-[#FFD9EC]">Placeholder Data</Badge>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {selectedTimeStaffPlan.map((sector) => {
                  const needsMoreStaff = sector.staffDelta > 0;
                  const canReduceStaff = sector.staffDelta < 0;
                  return (
                    <div key={sector.sector} className="rounded-xl bg-[#FFF7FB] border border-[#FFD9EC] p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-bold text-[#223047]">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sector.color }} />
                            {sector.sector}
                          </div>
                          <div className="mt-1 text-xs text-[#223047] opacity-65">
                            {sector.level} demand at {formatHour(trafficOptimizerTime[0])}{sector.label ? `, ${sector.label}` : ""}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center text-xs">
                          <div className="rounded-lg bg-white border border-[#FFD9EC] px-3 py-2">
                            <div className="text-[#223047] opacity-60">Scheduled</div>
                            <div className="font-bold text-[#223047]">{sector.scheduledStaff}</div>
                          </div>
                          <div className="rounded-lg bg-white border border-[#FFD9EC] px-3 py-2">
                            <div className="text-[#223047] opacity-60">Needed</div>
                            <div className="font-bold text-[#223047]">{sector.requiredStaff}</div>
                          </div>
                        </div>
                      </div>
                      <div className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                        needsMoreStaff ? "bg-red-50 text-red-700" :
                        canReduceStaff ? "bg-yellow-50 text-yellow-700" :
                        "bg-green-50 text-green-700"
                      }`}>
                        {needsMoreStaff ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        {needsMoreStaff
                          ? `Add ${sector.staffDelta} staff for this sector.`
                          : canReduceStaff
                            ? `Possible to reassign ${Math.abs(sector.staffDelta)} staff if service quality remains stable.`
                            : "Keep current placeholder coverage."}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl md:rounded-2xl border border-[#FFD9EC] p-4 md:p-5 space-y-4">
              <h3 className="text-base md:text-lg font-bold text-[#223047]">Optimization Inputs Needed Later</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {[
                  { icon: Users, title: "Staff roster", detail: "Name, role, sector, and service capability" },
                  { icon: CalendarDays, title: "Shift schedule", detail: "Start time, end time, day, and assigned sector" },
                  { icon: Target, title: "Service capacity", detail: "How many visits each staff member can handle" },
                  { icon: Zap, title: "Cost rules", detail: "Hourly rate or salary estimate for cost efficiency" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-xl bg-[#FFF7FB] border border-[#FFD9EC] p-4">
                      <Icon className="h-5 w-5 text-[#F53799] mb-3" />
                      <div className="text-sm font-bold text-[#223047]">{item.title}</div>
                      <div className="text-xs text-[#223047] opacity-65 mt-1" style={{ lineHeight: "1.5" }}>{item.detail}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl md:rounded-2xl bg-[#223047] p-4 md:p-5 text-white">
              <div className="text-xs font-bold tracking-wide mb-2">WOOF Traffic Recommendation</div>
              <p className="text-sm opacity-90" style={{ lineHeight: "1.6" }}>
                At {formatHour(trafficOptimizerTime[0])}, WOOF found {formatTrafficVisitValue(totalPredictedTraffic)} transaction-visits across Services, Cafe, and Retail for {selectedHeaderRangeLabel}. Replace the placeholder staff counts with real schedules to turn these recommendations into accurate shift adjustments and salary-cost insights.
              </p>
            </div>
          </div>

          {/* Header Filter Traffic Trend */}
          <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
            <div>
              <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
                Header Filter Traffic Trend
              </h2>
              <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
                Transaction-visit volume for {formatHour(trafficOptimizerTime[0])} within {selectedHeaderRangeLabel}
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
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #FFD9EC",
                    borderRadius: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="visits"
                  stroke="#3AE4FA"
                  strokeWidth={2.5}
                  fill="url(#trafficGradient)"
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>

            <div className="flex justify-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#3AE4FA] rounded-full" />
                <span className="text-sm text-[#223047]">Observed Transaction Visits</span>
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
                    <RechartsTooltip
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
                Test operational scenarios using forecast APIs, weather inputs, and the promo response model.
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
                    <option value="sunny">Sunny</option>
                    <option value="rainy">Rainy</option>
                    <option value="cloudy">Cloudy</option>
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
                    Temperature: {temperature[0]}C
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
                        <div className="text-xs text-[#223047] opacity-60">Uses promo response model</div>
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
                        <div className="text-xs text-[#223047] opacity-60">Adds spend timing lift</div>
                      </div>
                    </label>
                  </div>
                </div>

                <Button
                  onClick={handleRunSimulation}
                  disabled={scenarioLoading}
                  className="w-full bg-[#F53799] hover:bg-[#D42A7D]"
                >
                  {scenarioLoading ? "Updating Predictions..." : "Update Predictions"}
                </Button>
              </div>

              {/* Right: Outcomes */}
              <div className="space-y-4 md:space-y-6">
                <div className="p-4 md:p-6 bg-gradient-to-br from-[#F53799] to-[#D42A7D] rounded-xl md:rounded-2xl text-white">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3 md:mb-4">
                    <div>
                      <h3 className="text-base md:text-lg font-bold">Predicted Outcomes</h3>
                      <div className="text-xs opacity-75 mt-1">Source: {scenarioOutcome.sourceLabel}</div>
                    </div>
                    <div className="text-xs bg-white/15 rounded-lg px-3 py-2">
                      Model confidence: {scenarioOutcome.confidence ? `${scenarioOutcome.confidence}%` : "Calibrating"}
                    </div>
                  </div>
                  {scenarioError && (
                    <div className="mb-3 rounded-lg bg-white/15 p-3 text-xs">
                      {scenarioError}
                    </div>
                  )}
                  <div className="space-y-3">
                    {[
                      {
                        metric: "Revenue",
                        value: formatCurrency(scenarioOutcome.revenue),
                        change: `${parseFloat(scenarioOutcome.revenueChange) > 0 ? "+" : ""}${scenarioOutcome.revenueChange}%`,
                      },
                      {
                        metric: "Orders",
                        value: scenarioOutcome.orders,
                        change: `${parseFloat(scenarioOutcome.ordersChange) > 0 ? "+" : ""}${scenarioOutcome.ordersChange}%`,
                      },
                      {
                        metric: "Avg Transaction",
                        value: formatCurrency(scenarioOutcome.avgTransaction),
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
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg bg-white/10 p-3">
                      <div className="opacity-70">Baseline Revenue</div>
                      <div className="font-bold">{formatCurrency(scenarioOutcome.baselineRevenue)}</div>
                    </div>
                    <div className="rounded-lg bg-white/10 p-3">
                      <div className="opacity-70">Baseline Orders</div>
                      <div className="font-bold">{scenarioOutcome.baselineOrders}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl space-y-3 md:space-y-4">
              <h3 className="text-sm md:text-base font-bold text-[#223047]">Impact Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {scenarioFactorBreakdown.map((item) => {
                  const impactLabel = `${item.impact > 0 ? "+" : ""}${Math.round(item.impact * 100)}%`;
                  return (
                    <div
                      key={item.factor}
                      className="flex min-h-[96px] items-start justify-between gap-3 p-4 bg-white rounded-lg"
                    >
                      <div>
                        <div className="text-sm font-semibold text-[#223047]">{item.factor}</div>
                        <div className="text-xs text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.5" }}>{item.description}</div>
                      </div>
                      <span
                        className={`text-sm font-semibold flex-shrink-0 ${impactLabel.startsWith("+")
                            ? "text-green-600"
                            : impactLabel.startsWith("-")
                              ? "text-red-600"
                              : "text-gray-500"
                          }`}
                      >
                        {impactLabel}
                      </span>
                    </div>
                  );
                })}
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
      )}

      {activeTab === "activation-layer" && (
        <CampaignActivationLayer />
      )}

      {/* Bundle Explanation Side Drawer */}
      <BundleExplanationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        candidate={selectedCandidateForDrawer}
      />
    </div>
  );
}
