import { useState, useMemo, useEffect } from "react";
import * as React from "react";
import { Coffee, DollarSign, TrendingUp, PieChart, Download, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ErrorModal, ErrorType } from "../components/ErrorModal";
import { SuccessModal, SuccessType } from "../components/SuccessModal";
import { ModelDetailsModal } from "../components/ModelDetailsModal";
import { ForecastRun, getForecast } from "../lib/api";
import {
  HISTORY_START_DATE,
  INGESTED_HISTORY_END_DATE,
  addDays,
  filterByDateRange,
  forecastRangeFromHorizon,
  parseCustomRange,
  parseGlobalRange,
  countDays,
} from "../lib/dateRanges";
import cafeMascot from "../../imports/no_bg_Cafe-2.png";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

const formatChartDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });
};

const getCafeForecastUnitPrice = (forecastRun: ForecastRun | null) => {
  const matrix = forecastRun?.modelMetadata?.priceCalibration as { unitPrice?: number } | undefined;
  const forecastUnitPrice = forecastRun?.forecast?.find((point) => Number(point.unitPrice) > 0)?.unitPrice;
  const modelUnitPrice = Number(matrix?.unitPrice || forecastUnitPrice || 0);
  return Number.isFinite(modelUnitPrice) && modelUnitPrice > 0 ? modelUnitPrice : 0;
};

const getHistoricalRevenue = (
  point: ForecastRun["historical"][number],
  unitPrice: number,
) => {
  if (Number(point.revenue) > 0) return Number(point.revenue);
  return unitPrice > 0 ? Math.round((Number(point.actual) || 0) * unitPrice) : 0;
};

const getProjectedRevenue = (
  point: ForecastRun["forecast"][number],
  unitPrice: number,
) => {
  if (Number(point.projectedNetSales) > 0) return Number(point.projectedNetSales);
  const quantity = Number(point.forecastQuantity ?? point.forecast) || 0;
  return unitPrice > 0 ? Math.round(quantity * unitPrice) : quantity;
};

const getMetadataDate = (
  forecastRun: ForecastRun | null,
  key: string,
  fallback: string,
) => {
  const value = forecastRun?.modelMetadata?.[key];
  return typeof value === "string" && value ? value : fallback;
};

const getItemHistoryBounds = (forecastRun: ForecastRun | null) => ({
  min: getMetadataDate(forecastRun, "historyStartDate", HISTORY_START_DATE),
  max: getMetadataDate(forecastRun, "historyEndDate", INGESTED_HISTORY_END_DATE),
});

const minDateString = (...dates: string[]) =>
  dates.filter(Boolean).sort()[0] || "";

const aggregateItemHistory = (
  rows: NonNullable<ForecastRun["itemHistory"]>,
) => {
  const grouped = new Map<string, {
    name: string;
    revenue: number;
    quantity: number;
    orderCount: number;
    avgPrice: number;
    category: string;
    byDate: Map<string, number>;
  }>();

  for (const row of rows) {
    const existing = grouped.get(row.name) || {
      name: row.name,
      revenue: 0,
      quantity: 0,
      orderCount: 0,
      avgPrice: 0,
      category: row.category || "Cafe",
      byDate: new Map<string, number>(),
    };
    existing.revenue += Number(row.revenue) || 0;
    existing.quantity += Number(row.quantity) || 0;
    existing.orderCount += Number(row.orderCount) || 0;
    existing.byDate.set(row.date, (existing.byDate.get(row.date) || 0) + (Number(row.revenue) || 0));
    existing.avgPrice = existing.quantity > 0 ? existing.revenue / existing.quantity : Number(row.avgPrice) || 0;
    grouped.set(row.name, existing);
  }

  return [...grouped.values()]
    .map((item) => ({
      ...item,
      revenue: Math.round(item.revenue),
      quantity: Math.round(item.quantity),
      avgPrice: Math.round(item.avgPrice),
      trend: [...item.byDate.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, value]) => Math.round(value)),
    }))
    .sort((a, b) => b.revenue - a.revenue);
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

export function Cafe() {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [menuFilter, setMenuFilter] = useState("all");
  const [menuPerformanceMode, setMenuPerformanceMode] = useState<"overall" | "header">("overall");
  const [discountValue, setDiscountValue] = useState([15]);
  const [globalDateRange, setGlobalDateRange] = useState("last-7-days");
  const [currentPage, setCurrentPage] = useState(1);
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("globalDateRange") || "last-7-days";
    setGlobalDateRange(saved);

    const handleGlobalDateChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setGlobalDateRange(customEvent.detail);
      setCurrentPage(1);
    };

    window.addEventListener("globalDateRangeChanged", handleGlobalDateChange);
    return () => {
      window.removeEventListener("globalDateRangeChanged", handleGlobalDateChange);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [menuFilter]);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; type: ErrorType | null }>({
    isOpen: false,
    type: null,
  });
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; type: SuccessType | null }>({
    isOpen: false,
    type: null,
  });
  const [showModelDetails, setShowModelDetails] = useState(false);
  const [forecastRun, setForecastRun] = useState<ForecastRun | null>(null);
  const [forecastRangeMode, setForecastRangeMode] = useState("next14days");
  const [customForecastStart, setCustomForecastStart] = useState("2026-06-01");
  const [customForecastEnd, setCustomForecastEnd] = useState("2026-06-14");
  const [weatherScenario, setWeatherScenario] = useState("default");
  const [holidayScenario, setHolidayScenario] = useState("default");
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    const customRange = parseCustomRange(globalDateRange);
    if (customRange) {
      setForecastRangeMode("custom");
      setCustomForecastStart(customRange.start);
      setCustomForecastEnd(customRange.end);
      return;
    }

    if (globalDateRange === "last-30-days" || globalDateRange === "last-90-days" || globalDateRange === "last-12-months") {
      setForecastRangeMode("next30days");
    } else if (globalDateRange === "last-7-days" || globalDateRange === "today" || globalDateRange === "yesterday") {
      setForecastRangeMode("next7days");
    }
  }, [globalDateRange]);

  const handleApplySimulation = async () => {
    setIsSimulating(true);
    toast.info("Running forecast simulation...");
    const params: Record<string, string> = {};
    if (weatherScenario === "sunny") {
      params.temp = "32";
      params.rain = "0";
    } else if (weatherScenario === "rainy") {
      params.temp = "24";
      params.rain = "1";
    }
    
    if (holidayScenario === "force") {
      params.holiday = "1";
    } else if (holidayScenario === "ignore") {
      params.holiday = "0";
    }

    try {
      const res = await getForecast("cafe", params);
      setForecastRun(res);
      toast.success("Simulation complete!", {
        description: "Forecast chart and predictions updated based on your scenario.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Simulation failed");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetSimulation = async () => {
    setIsSimulating(true);
    setWeatherScenario("default");
    setHolidayScenario("default");
    try {
      const res = await getForecast("cafe");
      setForecastRun(res);
      toast.success("Reset successful", {
        description: "Restored live forecast settings.",
      });
    } catch (error) {
      toast.error("Failed to reset forecast");
    } finally {
      setIsSimulating(false);
    }
  };

  // API data state
  useEffect(() => {
    getForecast("cafe").then(setForecastRun).catch(() => {});
  }, []);

  useEffect(() => {
    if (forecastRangeMode === "custom") return;
    const latestHistoryDate =
      forecastRun?.historical?.[forecastRun.historical.length - 1]?.date ||
      INGESTED_HISTORY_END_DATE;
    const defaultStart = addDays(latestHistoryDate, 1);
    setCustomForecastStart(defaultStart);
    setCustomForecastEnd(addDays(defaultStart, 13));
  }, [forecastRun?.generatedAt, forecastRangeMode]);

  // Build menu items from API data — maps backend topItems to table shape
  const menuItems = useMemo(() => {
    if (!forecastRun?.topItems?.length && !forecastRun?.itemHistory?.length) return [];

    const bounds = getItemHistoryBounds(forecastRun);
    const latestHistoryDate = bounds.max || INGESTED_HISTORY_END_DATE;
    const scopedRows =
      menuPerformanceMode === "header"
        ? filterByDateRange(
            forecastRun.itemHistory || [],
            parseGlobalRange(globalDateRange, latestHistoryDate, bounds),
          )
        : forecastRun.itemHistory || [];
    const sourceItems = scopedRows.length
      ? aggregateItemHistory(scopedRows)
      : (forecastRun.topItems || []).map((item) => ({
          name: item.name,
          revenue: Math.round(item.revenue),
          quantity: item.quantity,
          orderCount: item.orderCount,
          avgPrice: item.avgPrice,
          category: item.category || "Cafe",
          trend: [] as number[],
        }));

    // Get last 7 days of total revenue to build per-item trend sparklines
    const last7Days = forecastRun.historical.slice(-7);
    const unitPrice = getCafeForecastUnitPrice(forecastRun);
    const averageQuantity =
      sourceItems.reduce((sum, item) => sum + item.quantity, 0) /
      Math.max(sourceItems.length, 1);

    return sourceItems.slice(0, 15).map((item) => {
      // Scale the cafe's daily revenue shape to this item's proportion
      const itemProportion =
        item.revenue / (forecastRun.kpis.totalRevenue || 1);
      const fallbackTrend = last7Days.length > 0
        ? last7Days.map((day) =>
            Math.max(0, Math.round(getHistoricalRevenue(day, unitPrice) * itemProportion)),
          )
        : [item.revenue];
      const trend = item.trend.length ? item.trend : fallbackTrend;

      // Determine status based on quantity thresholds from actual dataset
      const equilibrium =
        item.quantity >= averageQuantity
          ? "balanced"
          : item.quantity >= averageQuantity * 0.5
            ? "diverging"
            : "critical";

      return {
        name: item.name,
        qtySold: item.quantity,
        category: item.category || "Cafe",
        equilibrium,
        trend,
        revenue: Math.round(item.revenue),
      };
    });
  }, [forecastRun, globalDateRange, menuPerformanceMode]);

  // Aggregated KPI values dynamically calculated from API history based on globalDateRange
  const aggregatedKpis = useMemo(() => {
    const defaultKpis = {
      totalRevenue: forecastRun?.kpis?.totalRevenue || 0,
      totalOrders: forecastRun?.kpis?.totalOrders || 0,
      avgOrderValue: forecastRun?.kpis?.avgOrderValue || 0,
      revenueGrowth: { text: "0.0%", className: "text-xs text-gray-500 font-medium hidden md:block" },
      ordersGrowth: { text: "0.0%", className: "text-xs text-gray-500 font-medium hidden md:block" },
      checkGrowth: { text: "0.0%", className: "text-xs text-gray-500 font-medium hidden md:block" },
    };
    if (!forecastRun?.historical?.length) {
      return defaultKpis;
    }
    const latestHistoryDate =
      forecastRun.historical[forecastRun.historical.length - 1]?.date ||
      INGESTED_HISTORY_END_DATE;
    const bounds = getItemHistoryBounds(forecastRun);
    const range = parseGlobalRange(globalDateRange, latestHistoryDate, bounds);
    const sliced = filterByDateRange(forecastRun.historical, range);
    const unitPrice = getCafeForecastUnitPrice(forecastRun);
    const totalRevenue = sliced.reduce((sum, d) => sum + getHistoricalRevenue(d, unitPrice), 0);
    const totalOrders = sliced.reduce((sum, d) => sum + (d.orders || Math.round(getHistoricalRevenue(d, unitPrice) / (forecastRun?.kpis?.avgOrderValue || 150))), 0);
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : (forecastRun?.kpis?.avgOrderValue || 0);

    const dayCount = countDays(range.start, range.end);
    const previousEnd = addDays(range.start, -1);
    const previousStart = addDays(previousEnd, -(dayCount - 1));
    const prevRange = { start: previousStart, end: previousEnd, isCustom: range.isCustom };
    const prevSliced = filterByDateRange(forecastRun.historical, prevRange);
    const prevRevenue = prevSliced.reduce((sum, d) => sum + getHistoricalRevenue(d, unitPrice), 0);
    const prevOrders = prevSliced.reduce((sum, d) => sum + (d.orders || Math.round(getHistoricalRevenue(d, unitPrice) / (forecastRun?.kpis?.avgOrderValue || 150))), 0);
    const prevAvgOrderValue = prevOrders > 0 ? Math.round(prevRevenue / prevOrders) : 0;

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      revenueGrowth: formatGrowth(totalRevenue, prevRevenue),
      ordersGrowth: formatGrowth(totalOrders, prevOrders),
      checkGrowth: formatGrowth(avgOrderValue, prevAvgOrderValue),
    };
  }, [forecastRun, globalDateRange]);

  const cafeRevenue = aggregatedKpis.totalRevenue ? `₱${aggregatedKpis.totalRevenue.toLocaleString()}` : "₱0";
  const totalOrders = aggregatedKpis.totalOrders || 0;
  const avgCheck = aggregatedKpis.avgOrderValue ? `₱${aggregatedKpis.avgOrderValue.toLocaleString()}` : "₱0";
  const activeItems = menuItems.length || forecastRun?.topItems?.length || 0;

  // Build forecast chart data from API based on globalDateRange
  const forecastData = useMemo(() => {
    if (!forecastRun?.historical?.length) {
      return [];
    }
    const latestHistoryDate =
      forecastRun.historical[forecastRun.historical.length - 1]?.date ||
      INGESTED_HISTORY_END_DATE;
    const bounds = getItemHistoryBounds(forecastRun);
    const horizon =
      forecastRangeMode === "next7days"
        ? 7
        : forecastRangeMode === "next30days"
          ? 30
          : 14;
    const selectedRange =
      forecastRangeMode === "custom"
        ? {
            start: customForecastStart,
            end:
              customForecastEnd >= customForecastStart
                ? customForecastEnd
                : customForecastStart,
            isCustom: true,
          }
        : forecastRangeFromHorizon(latestHistoryDate, horizon);
    const historyRange =
      forecastRangeMode === "custom"
        ? selectedRange
        : parseGlobalRange(globalDateRange, latestHistoryDate, bounds);
    const historicalRows = filterByDateRange(forecastRun.historical, historyRange);
    const forecastRows = filterByDateRange(forecastRun.forecast, selectedRange);
    const unitPrice = getCafeForecastUnitPrice(forecastRun);
    const shouldAnchorForecast =
      forecastRows.length > 0 &&
      (historicalRows.length === 0 ||
        historicalRows[historicalRows.length - 1]?.date !== latestHistoryDate);
    const anchorRow = shouldAnchorForecast
      ? forecastRun.historical[forecastRun.historical.length - 1]
      : null;
    const hist = [
      ...historicalRows,
      ...(anchorRow ? [anchorRow] : []),
    ].map((d, index, rows) => ({
      date: d.date,
      actual: getHistoricalRevenue(d, unitPrice),
      forecast:
        (forecastRangeMode !== "custom" || d.date === latestHistoryDate) &&
        index === rows.length - 1
          ? getHistoricalRevenue(d, unitPrice)
          : null,
      confidenceLow: null as number | null,
      confidenceHigh: null as number | null,
    }));
    const fc = forecastRows.map((d) => ({
      date: d.date,
      actual: null as number | null,
      forecast: getProjectedRevenue(d, unitPrice),
      confidenceLow:
        d.projectedConfidenceLow ??
        (d.confidenceLow !== undefined && unitPrice > 0
          ? Math.round(d.confidenceLow * unitPrice)
          : d.confidenceLow),
      confidenceHigh:
        d.projectedConfidenceHigh ??
        (d.confidenceHigh !== undefined && unitPrice > 0
          ? Math.round(d.confidenceHigh * unitPrice)
          : d.confidenceHigh),
    }));
    return [...hist, ...fc];
  }, [forecastRun, forecastRangeMode, customForecastStart, customForecastEnd, globalDateRange]);

  // Filtered menu items based on filter
  const filteredMenuItems = useMemo(() => {
    const filtered =
      menuFilter === "top"
        ? menuItems.slice(0, 5)
        : menuFilter === "under"
          ? menuItems.slice(-5)
          : menuFilter === "diverging"
            ? menuItems.filter((item: any) => item.equilibrium === "diverging" || item.equilibrium === "critical")
            : menuItems;
    if (!sortColumn) return filtered;
    return [...filtered].sort((a: any, b: any) => {
      const left =
        sortColumn === "qty" ? a.qtySold :
        sortColumn === "revenue" ? a.revenue :
        String(a.name || "");
      const right =
        sortColumn === "qty" ? b.qtySold :
        sortColumn === "revenue" ? b.revenue :
        String(b.name || "");
      const result =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right));
      return sortDirection === "asc" ? result : -result;
    });
  }, [menuFilter, menuItems, sortColumn, sortDirection]);

  const itemsPerPage = 5;
  const paginatedMenuItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMenuItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMenuItems, currentPage]);

  const totalPages = Math.ceil(filteredMenuItems.length / itemsPerPage) || 1;
  const latestCafeHistoryDate = getMetadataDate(
    forecastRun,
    "historyEndDate",
    forecastRun?.historical?.[forecastRun.historical.length - 1]?.date || INGESTED_HISTORY_END_DATE,
  );
  const cafeForecastStartMin = addDays(latestCafeHistoryDate, 1);
  const cafeForecastMaxDate = minDateString(
    getMetadataDate(forecastRun, "forecastEndDate", addDays(latestCafeHistoryDate, 30)),
    addDays(latestCafeHistoryDate, 30),
  );
  const cafeForecastEndMax = minDateString(
    cafeForecastMaxDate,
    addDays(customForecastStart || cafeForecastStartMin, 29),
  );

  useEffect(() => {
    if (forecastRangeMode !== "custom") return;
    if (customForecastStart < cafeForecastStartMin || customForecastStart > cafeForecastMaxDate) {
      setCustomForecastStart(cafeForecastStartMin);
      setCustomForecastEnd(minDateString(cafeForecastMaxDate, addDays(cafeForecastStartMin, 13)));
      return;
    }
    if (customForecastEnd < customForecastStart || customForecastEnd > cafeForecastEndMax) {
      setCustomForecastEnd(cafeForecastEndMax);
    }
  }, [
    cafeForecastEndMax,
    cafeForecastMaxDate,
    cafeForecastStartMin,
    customForecastEnd,
    customForecastStart,
    forecastRangeMode,
  ]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleExportReport = () => {
    toast.info("Generating report...");
    setTimeout(() => {
      // Simulate export failure
      setErrorModal({ isOpen: true, type: "export_failed" });
    }, 1500);
  };

  const handleRetrainModel = () => {
    const toastId = toast.loading("Retraining model with latest data... This may take a few seconds.");
    getForecast("cafe", { forceRefresh: "true" })
      .then((res) => {
        setForecastRun(res);
        toast.dismiss(toastId);
        setSuccessModal({ isOpen: true, type: "model_retrain_success" });
      })
      .catch((err) => {
        toast.dismiss(toastId);
        toast.error("Model retraining failed: " + (err instanceof Error ? err.message : String(err)));
        setErrorModal({ isOpen: true, type: "model_failed" });
      });
  };

  const handleRetryExport = () => {
    setErrorModal({ isOpen: false, type: null });
    toast.info("Retrying export with optimized parameters...");
    setTimeout(() => {
      setSuccessModal({ isOpen: true, type: "export_success" });
    }, 1500);
  };

  const handleRetryModelTraining = () => {
    setErrorModal({ isOpen: false, type: null });
    const toastId = toast.loading("Retrying model training...");
    getForecast("cafe", { forceRefresh: "true" })
      .then((res) => {
        setForecastRun(res);
        toast.dismiss(toastId);
        setSuccessModal({ isOpen: true, type: "model_retrain_success" });
      })
      .catch((err) => {
        toast.dismiss(toastId);
        toast.error("Model retraining failed: " + (err instanceof Error ? err.message : String(err)));
        setErrorModal({ isOpen: true, type: "model_failed" });
      });
  };

  const handleViewModelDetails = () => {
    setShowModelDetails(true);
  };

  const handleContactSupport = () => {
    toast.success("Support ticket created. Our team will contact you within 24 hours.");
    window.open("mailto:support@woofai.com?subject=Data Corruption Issue&body=I need assistance with a data integrity issue in my Cafe dashboard.", "_blank");
  };

  const handleRefreshData = () => {
    toast.info("Refreshing data...");
    setTimeout(() => {
      toast.success("Data refreshed successfully");
      // Simulate data refresh by forcing a re-render
      setMenuFilter("all");
    }, 1000);
  };

  const handleRetryDataSync = () => {
    setErrorModal({ isOpen: false, type: null });
    toast.info("Retrying data synchronization...");
    setTimeout(() => {
      // Update last model update time to show data was refreshed
      void getForecast("cafe").then(setForecastRun);
      setSuccessModal({ isOpen: true, type: "data_sync_success" });
    }, 2000);
  };

  const getEquilibriumColor = (status: string) => {
    if (status === "balanced") return "bg-green-500";
    if (status === "diverging") return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6 md:space-y-8 lg:space-y-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl lg:text-[36px] font-extrabold text-[#223047]">
            Cafe Intelligence Hub
          </h1>
          <p className="text-sm md:text-base text-[#223047] opacity-60 mt-1 md:mt-2" style={{ lineHeight: "1.6" }}>
            Food & Beverage performance analytics and AI-powered demand forecasting
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <Badge className="bg-[#F53799] text-white hover:bg-[#F53799] px-3 md:px-4 py-1 text-xs md:text-sm">
            Cafe Sector
          </Badge>
          <Button
            onClick={handleExportReport}
            variant="outline"
            className="border-[#FFD9EC] gap-2 text-xs md:text-sm"
            size="sm"
          >
            <Download className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Export Report</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Cafe Revenue Today */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#F53799] to-[#D42A7D] flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Historical Cafe Revenue</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{cafeRevenue}</div>
              <div className={aggregatedKpis.revenueGrowth.className}>{aggregatedKpis.revenueGrowth.text}</div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#3AE4FA] to-[#5CE1E6] flex items-center justify-center flex-shrink-0">
              <Coffee className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Total Orders</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{totalOrders}</div>
              <div className={aggregatedKpis.ordersGrowth.className}>{aggregatedKpis.ordersGrowth.text}</div>
            </div>
          </div>

          {/* Avg Check Size */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#3AE4FA] to-[#5CE1E6] flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Avg Check Size</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{avgCheck}</div>
              <div className={aggregatedKpis.checkGrowth.className}>{aggregatedKpis.checkGrowth.text}</div>
            </div>
          </div>

          {/* Active Menu Items */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#3AE4FA] to-[#5CE1E6] flex items-center justify-center flex-shrink-0">
              <PieChart className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Active Menu Items</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{activeItems}</div>
              <Badge className="bg-[#3AE4FA] text-white hover:bg-[#3AE4FA] text-xs mt-1 hidden md:inline-flex">
                All Active
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* REVENUE FORECAST PANEL - Best Model Only */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          <div className="flex-1">
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              Cafe Revenue & Demand Forecast
            </h2>
            <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
              Active model: <span className="font-semibold text-[#F53799]">{forecastRun?.modelName || "Waiting for uploaded Cafe history"}</span>
              {forecastRun && <span className="hidden sm:inline"> (MASE: {forecastRun.mase.toFixed(2)}, Accuracy: {forecastRun.accuracy.toFixed(1)}%)</span>}
            </p>
            {forecastRun?.isFallback && (
              <Badge className="mt-2 bg-amber-500 text-white hover:bg-amber-500">
                SMA fallback active: selected model could not run
              </Badge>
            )}
            {!forecastRun?.isFallback && Boolean(forecastRun?.modelMetadata?.modelQualityWarning) && (
              <Badge className="mt-2 bg-amber-500 text-white hover:bg-amber-500">
                Selected model active with quality warning
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              ["next30days", "Next 30 Days"],
              ["next14days", "Next 14 Days"],
              ["next7days", "Next 7 Days"],
              ["custom", "Custom"],
            ].map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                variant={forecastRangeMode === value ? "default" : "outline"}
                onClick={() => setForecastRangeMode(value)}
                className={
                  forecastRangeMode === value
                    ? "bg-[#F53799] hover:bg-[#D42A7D] text-xs"
                    : "border-[#FFD9EC] hover:bg-[#FFF2FA] text-xs"
                }
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {forecastRangeMode === "custom" && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#FFD9EC] bg-[#FFF7FB] p-3">
            <input
              type="date"
              min={cafeForecastStartMin}
              max={cafeForecastMaxDate}
              value={customForecastStart}
              onChange={(event) => {
                const nextStart = event.target.value;
                setCustomForecastStart(nextStart);
                setCustomForecastEnd((current) =>
                  current < nextStart || current > minDateString(cafeForecastMaxDate, addDays(nextStart, 29))
                    ? minDateString(cafeForecastMaxDate, addDays(nextStart, 29))
                    : current,
                );
              }}
              className="h-9 rounded-md border border-[#FFD9EC] px-2 text-xs text-[#223047] focus:outline-none focus:ring-2 focus:ring-[#F53799]"
            />
            <input
              type="date"
              min={customForecastStart}
              max={cafeForecastEndMax}
              value={customForecastEnd}
              onChange={(event) => setCustomForecastEnd(event.target.value > cafeForecastEndMax ? cafeForecastEndMax : event.target.value)}
              className="h-9 rounded-md border border-[#FFD9EC] px-2 text-xs text-[#223047] focus:outline-none focus:ring-2 focus:ring-[#F53799]"
            />
          </div>
        )}

        {/* Forecast Chart */}
        <ResponsiveContainer width="100%" height={250} className="md:!h-[350px] lg:!h-[400px]">
          <LineChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#FFD9EC" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#223047"
              tickFormatter={formatChartDate}
              minTickGap={28}
              interval="preserveStartEnd"
              style={{ fontSize: "11px" }}
            />
            <YAxis 
              stroke="#223047" 
              style={{ fontSize: "12px" }} 
              tickFormatter={(value) => `₱${Number(value).toLocaleString()}`}
            />
            <Tooltip
              labelFormatter={(label) => formatChartDate(String(label))}
              formatter={(value: any, name: any) => [`₱${Number(value).toLocaleString()}`, name]}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #FFD9EC",
                borderRadius: "12px",
                padding: "12px",
              }}
            />
            <Line
              key="line-actual-cafe"
              type="monotone"
              dataKey="actual"
              stroke="#223047"
              strokeWidth={2.5}
              dot={false}
              animationDuration={800}
              name="Revenue"
            />
            <Line
              key="line-forecast-cafe"
              type="monotone"
              dataKey="forecast"
              stroke="#F53799"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={false}
              animationDuration={800}
              name="Predicted revenue"
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] md:text-xs text-[#223047] opacity-70">
          <div className="flex items-center gap-2">
            <span className="h-0.5 w-7 rounded-full bg-[#223047]" />
            <span>Historical revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-0.5 w-7 rounded-full"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to right, #F53799 0 6px, transparent 6px 10px)",
              }}
            />
            <span>Predicted revenue</span>
          </div>
        </div>

        {/* Model Info, Recommendation, and Exogenous Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 pt-4 md:pt-6 border-t border-[#FFD9EC]">
          <div className="bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl md:rounded-2xl p-4 md:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm md:text-base font-bold text-[#223047]">Active Model Performance</h3>
              <button
                onClick={() => setShowInfoModal(true)}
                className="p-1 hover:bg-[#FFF2FA] rounded-full transition-colors text-[#F53799]"
                title="Explain metrics"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div>
                <div className="text-xs text-[#223047] opacity-60 mb-1">MASE</div>
                <div className="text-xl md:text-2xl font-bold text-[#F53799]">{forecastRun?.mase.toFixed(2) ?? "—"}</div>
                <div className="text-xs text-[#223047] opacity-60 hidden md:block">Quality threshold: 1.20</div>
              </div>
              <div>
                <div className="text-xs text-[#223047] opacity-60 mb-1">Accuracy</div>
                <div className="text-xl md:text-2xl font-bold text-[#223047]">{forecastRun ? `${forecastRun.accuracy.toFixed(1)}%` : "—"}</div>
              </div>
              <div>
                <div className="text-xs text-[#223047] opacity-60 mb-1">MAPE</div>
                <div className="text-xl md:text-2xl font-bold text-[#223047]">{forecastRun ? `${forecastRun.mape.toFixed(2)}%` : "—"}</div>
              </div>
              <div>
                <div className="text-xs text-[#223047] opacity-60 mb-1">Missing Days Filled</div>
                <div className="text-xl md:text-2xl font-bold text-[#223047]">{String(forecastRun?.modelMetadata?.missingDaysFilled ?? "—")}</div>
              </div>
            </div>
            {forecastRun?.modelMetadata && (
              <div className="text-[10px] text-[#223047] opacity-50 mt-2 border-t pt-2 space-y-1">
                <div>Weather Source: {String(forecastRun.modelMetadata.weatherDataSource || "N/A")}</div>
                <div>Holiday Source: {String(forecastRun.modelMetadata.holidayDataSource || "N/A")}</div>
                {!!forecastRun.modelMetadata.exogenousVariables && (
                  <div>Exogenous: {Array.isArray(forecastRun.modelMetadata.exogenousVariables) ? (forecastRun.modelMetadata.exogenousVariables as any).join(", ") : String(forecastRun.modelMetadata.exogenousVariables)}</div>
                )}
                {!!forecastRun.modelMetadata.modelQualityWarning && (
                  <div className="text-amber-700 opacity-100">
                    {String(forecastRun.modelMetadata.modelQualityWarning)}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl md:rounded-2xl p-4 md:p-6 space-y-3 md:space-y-4">
            <h3 className="text-sm md:text-base font-bold text-[#223047]">WOOF Analysis</h3>
            <p className="text-xs md:text-sm text-[#223047] opacity-70" style={{ lineHeight: "1.6" }}>
              {forecastRun
                ? `${forecastRun.modelName} was evaluated on held-out uploaded Cafe history. The active response was generated ${new Date(forecastRun.generatedAt).toLocaleString()}.`
                : "Upload Cafe history from POS or PetHub to generate a validated forecast."}
            </p>
            <Button onClick={handleRetrainModel} className="w-full bg-[#F53799] hover:bg-[#D42A7D] text-xs md:text-sm" size="sm">
              Retrain Model
            </Button>
          </div>

          {/* EXOGENOUS FACTORS OVERRIDE & SIMULATOR */}
          <div className="bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl md:rounded-2xl p-4 md:p-6 space-y-3 flex flex-col justify-between">
            <div>
              <h3 className="text-sm md:text-base font-bold text-[#223047]">Sales Simulator (What-If?)</h3>
              <p className="text-xs text-[#223047] opacity-60 mb-2">
                Simulate weather conditions and calendar holidays to forecast Cafe sales.
              </p>

              <div className="space-y-3">
                {/* Weather Select */}
                <div>
                  <label className="text-[11px] text-[#223047] opacity-70 block mb-1 font-semibold">Weather Conditions</label>
                  <select
                    value={weatherScenario}
                    onChange={(e) => setWeatherScenario(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-[#FFD9EC] rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#F53799]"
                  >
                    <option value="default">Current Live Weather</option>
                    <option value="sunny">Hot & Sunny Day (32°C, No Rain)</option>
                    <option value="rainy">Cool & Rainy Day (24°C, Rainy)</option>
                  </select>
                </div>

                {/* Holiday Select */}
                <div>
                  <label className="text-[11px] text-[#223047] opacity-70 block mb-1 font-semibold">Holiday Schedule</label>
                  <select
                    value={holidayScenario}
                    onChange={(e) => setHolidayScenario(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-[#FFD9EC] rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#F53799]"
                  >
                    <option value="default">Live Calendar Holidays</option>
                    <option value="force">Treat Everyday as a Holiday</option>
                    <option value="ignore">Treat Everyday as a Workday</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-2 border-t border-[#FFD9EC]">
              <Button
                disabled={isSimulating}
                onClick={handleApplySimulation}
                className="flex-1 bg-[#F53799] hover:bg-[#D42A7D] text-white text-xs py-1"
                size="sm"
              >
                {isSimulating ? "Simulating..." : "Run Simulator"}
              </Button>
              <Button
                disabled={isSimulating}
                onClick={handleResetSimulation}
                variant="outline"
                className="border-[#FFD9EC] text-xs py-1 px-2"
                size="sm"
              >
                Reset to Live
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* VISUAL RELIEF DIVIDER - AI INSIGHT WITH MASCOT */}
      <div
        className="rounded-2xl flex items-center justify-between px-4 md:px-8 py-4 relative overflow-hidden"
        style={{ background: "linear-gradient(to right, #FFF7FB, #FFF2FA)" }}
      >
        <div className="flex-1">
          <div className="mb-2">
            <Badge variant="outline" className="text-xs">
              WOOF AI Insight
            </Badge>
          </div>
          <p className="text-sm md:text-base italic text-[#223047] opacity-70" style={{ lineHeight: "1.6" }}>
            {forecastRun?.topItems?.[0]
              ? `${forecastRun.topItems[0].name} leads Cafe revenue at ₱${forecastRun.topItems[0].revenue.toLocaleString()} across ${forecastRun.topItems[0].quantity} units.`
              : "Upload Cafe history from POS or PetHub to populate item-level insights."}
          </p>
        </div>
        <img
          src={cafeMascot.src}
          alt="Cafe Mascot"
          className="w-24 h-24 md:w-32 md:h-32 object-contain flex-shrink-0 ml-4 md:ml-6"
        />
      </div>

      {/* MENU PERFORMANCE */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              Menu Item Performance
            </h2>
            <div className="flex items-center gap-1 rounded-lg border border-[#FFD9EC] bg-[#FFF7FB] p-1">
              {[
                ["overall", "Overall"],
                ["header", "Header Filter"],
              ].map(([value, label]) => (
                <Button
                  key={value}
                  size="sm"
                  variant={menuPerformanceMode === value ? "default" : "ghost"}
                  onClick={() => {
                    setMenuPerformanceMode(value as "overall" | "header");
                    setCurrentPage(1);
                  }}
                  className={
                    menuPerformanceMode === value
                      ? "h-8 bg-[#F53799] hover:bg-[#D42A7D] text-xs"
                      : "h-8 text-xs hover:bg-[#FFF2FA]"
                  }
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="max-h-[620px] overflow-auto pr-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-[#FFF2FA]"
                    onClick={() => handleSort("name")}
                  >
                    Item Name {sortColumn === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-[#FFF2FA] text-center"
                    onClick={() => handleSort("qty")}
                  >
                    Qty Sold {sortColumn === "qty" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="text-center">Category</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Trend</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-[#FFF2FA] text-center"
                    onClick={() => handleSort("revenue")}
                  >
                    Revenue {sortColumn === "revenue" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="text-center w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMenuItems.map((item: any, itemIndex: number) => (
                  <React.Fragment key={`menu-item-${item.name}-${itemIndex}`}>
                    <TableRow
                      className="cursor-pointer hover:bg-[#FFF2FA]"
                      onClick={() => setExpandedRow(expandedRow === item.name ? null : item.name)}
                    >
                      <TableCell className="font-semibold">{item.name}</TableCell>
                      <TableCell className="text-center">{item.qtySold}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFF2FA] text-[#223047] opacity-80">{item.category}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className={`w-2 h-2 rounded-full mx-auto ${getEquilibriumColor(item.equilibrium)}`} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center h-8">
                          <LineChart width={80} height={30} data={item.trend.map((v: any, idx: number) => ({ value: v, index: idx }))}>
                            <Line
                              key={`line-trend-${item.name}`}
                              type="monotone"
                              dataKey="value"
                              stroke="#F53799"
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold">₱{item.revenue.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center justify-center p-1 rounded hover:bg-[#FFF2FA] text-[#F53799] transition-colors">
                          {expandedRow === item.name ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedRow === item.name && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-[#FFF7FB]">
                          <div className="p-4 space-y-3">
                            <ResponsiveContainer width="100%" height={120} className="md:!h-[150px]">
                              <LineChart data={item.trend.map((sales: number, index: number) => ({
                                day: `Day ${index + 1}`,
                                sales,
                              }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#FFD9EC" />
                                <XAxis dataKey="day" style={{ fontSize: "10px" }} />
                                <YAxis style={{ fontSize: "10px" }} />
                                <Tooltip />
                                <Line
                                  key={`line-sales-${item.name}`}
                                  type="monotone"
                                  dataKey="sales"
                                  stroke="#F53799"
                                  strokeWidth={2}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                            <Button size="sm" className="bg-[#F53799] hover:bg-[#D42A7D] text-xs md:text-sm">
                              Promote This Item
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-[#FFD9EC]">
              <span className="text-xs text-[#223047] opacity-60">
                Showing {Math.min(filteredMenuItems.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredMenuItems.length, currentPage * itemsPerPage)} of {filteredMenuItems.length} items
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="border-[#FFD9EC] text-xs h-8 px-3 hover:bg-[#FFF2FA]"
                >
                  Previous
                </Button>
                <span className="text-xs font-semibold text-[#223047] px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="border-[#FFD9EC] text-xs h-8 px-3 hover:bg-[#FFF2FA]"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

      {/* QUIET PERIOD + HAPPY HOUR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-4 md:space-y-6">
          <div className="bg-[#223047] text-white rounded-2xl md:rounded-3xl p-4 md:p-6 space-y-3 md:space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="text-base md:text-lg font-bold">Next Quiet Period</h3>
              <Badge className="bg-[#5CE1E6] text-white hover:bg-[#5CE1E6] text-xs">
                ⚙ ENGINE
              </Badge>
            </div>

            <div className="text-2xl md:text-3xl lg:text-4xl font-bold">Tomorrow 3:00 PM</div>

            <div className="flex items-center gap-2 text-xs md:text-sm">
              <span className="opacity-70">Predicted Traffic:</span>
              <span className="font-semibold text-[#3AE4FA]">42% below avg</span>
            </div>

            <div className="space-y-3 pt-2 md:pt-4">
              <div>
                <label className="text-xs opacity-70 mb-2 block">Discount %</label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={discountValue}
                    onValueChange={setDiscountValue}
                    max={80}
                    min={5}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-base md:text-lg font-bold w-10 md:w-12">{discountValue[0]}%</span>
                </div>
              </div>
            </div>

            <Button className="w-full bg-[#F53799] hover:bg-[#D42A7D] text-xs md:text-sm">
              Activate Happy Hour
            </Button>
          </div>

        </div>

        <div className="space-y-4 md:space-y-6">
          <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 space-y-3 md:space-y-4 h-full">
            <div>
              <h3 className="text-sm md:text-base font-bold text-[#223047]">Past Happy Hour Effectiveness</h3>
              <p className="text-xs text-[#223047] opacity-60 mt-1">
                Percentages show <strong>Revenue Lift</strong> (the increase in sales achieved compared to typical quiet hours).
              </p>
            </div>

            <div className="space-y-2">
              {[
                { date: "Apr 12", predicted: "+15%", actual: "+18%", result: "✓" },
                { date: "Apr 10", predicted: "+12%", actual: "+14%", result: "✓" },
                { date: "Apr 8", predicted: "+20%", actual: "+16%", result: "~" },
                { date: "Apr 6", predicted: "+18%", actual: "+22%", result: "✓" },
              ].map((item) => (
                <div
                  key={item.date}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#FFF2FA]"
                >
                  <span className="text-xs text-[#223047] opacity-60">{item.date}</span>
                  <span className="text-xs font-medium text-[#223047]">
                    {item.predicted} → {item.actual}
                  </span>
                  <span className="text-sm">{item.result}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 md:pt-4 border-t border-[#FFD9EC]">
              <p className="text-xs text-[#223047] opacity-60 mb-2 md:mb-3">Was this helpful?</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs md:text-sm">
                  👍 <span className="hidden sm:inline ml-1">Yes</span>
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs md:text-sm">
                  👎 <span className="hidden sm:inline ml-1">No</span>
                </Button>
              </div>
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
          onRetry={() => {
            if (errorModal.type === "export_failed") {
              handleRetryExport();
            } else if (errorModal.type === "data_sync_failed") {
              handleRetryDataSync();
            }
          }}
          onViewDetails={errorModal.type === "model_failed" ? handleViewModelDetails : undefined}
          onContactSupport={errorModal.type === "data_corruption" ? handleContactSupport : undefined}
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

      {/* Model Details Modal */}
      <ModelDetailsModal
        isOpen={showModelDetails}
        onClose={() => setShowModelDetails(false)}
      />
      {/* Model Performance Metrics Guide modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#FFD9EC] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#FFD9EC]">
              <h3 className="text-base font-bold text-[#223047]">Model Performance Metrics Guide</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-xs text-gray-500 hover:text-[#F53799] font-bold"
              >
                Close
              </button>
            </div>
            <div className="space-y-4 text-xs md:text-sm text-[#223047] opacity-80 animate-in fade-in zoom-in-95 duration-150" style={{ lineHeight: "1.6" }}>
              <div>
                <strong className="text-sm text-[#F53799]">MASE (Mean Absolute Scaled Error)</strong>
                <p className="mt-1">
                  Measures how smart the AI's prediction is compared to a simple baseline guess (such as assuming today's sales are identical to yesterday's). A score **below 1.0** indicates that our AI model is performing significantly better and is highly reliable.
                </p>
              </div>
              <div>
                <strong className="text-sm text-[#F53799]">Accuracy</strong>
                <p className="mt-1">
                  The overall correctness rate of the AI's forecasts. For example, a **90% accuracy** means the system's daily sales projections are 90% close to the actual final sales numbers.
                </p>
              </div>
              <div>
                <strong className="text-sm text-[#F53799]">MAPE (Mean Absolute Percentage Error)</strong>
                <p className="mt-1">
                  The average margin of error in percentage terms. A **lower percentage** (such as 5%) indicates that the AI's predictions deviate only slightly from reality, ensuring higher precision.
                </p>
              </div>
              <div>
                <strong className="text-sm text-[#F53799]">Missing Days Filled</strong>
                <p className="mt-1">
                  The count of days with missing sales data (due to closures or system downtime) that the AI automatically calculated and filled using smart estimations to keep the forecasting model accurate and complete.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowInfoModal(false)}
              className="w-full bg-[#F53799] hover:bg-[#D42A7D] text-white rounded-lg mt-4"
            >
              Understood
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
