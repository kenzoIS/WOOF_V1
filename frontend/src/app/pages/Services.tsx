import { useState, useMemo, useEffect } from "react";
import * as React from "react";
import { Scissors, DollarSign, Calendar, TrendingUp, AlertTriangle, Users, Clock, Sun, CloudRain, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ErrorModal, ErrorType } from "../components/ErrorModal";
import { SuccessModal, SuccessType } from "../components/SuccessModal";
import servicesMascot from "../../imports/no_bg_Services-1.png";
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
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
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

const getHistoricalRevenue = (point: ForecastRun["historical"][number]) =>
  Number(point.revenue) > 0 ? Number(point.revenue) : Number(point.actual) || 0;

const getProjectedRevenue = (point: ForecastRun["forecast"][number]) =>
  Number(point.projectedNetSales) > 0
    ? Number(point.projectedNetSales)
    : Number(point.forecast) || 0;

const aggregateServiceHistory = (
  rows: NonNullable<ForecastRun["itemHistory"]>,
) => {
  const grouped = new Map<string, {
    service: string;
    current: number;
    bookings: number;
    avgPrice: number;
    revenue: number;
    category: string;
    byDate: Map<string, number>;
  }>();

  for (const row of rows) {
    const existing = grouped.get(row.name) || {
      service: row.name,
      current: 0,
      bookings: 0,
      avgPrice: 0,
      revenue: 0,
      category: row.category || "Services",
      byDate: new Map<string, number>(),
    };
    existing.bookings += Number(row.orderCount) || 0;
    existing.revenue += Number(row.revenue) || 0;
    existing.byDate.set(row.date, (existing.byDate.get(row.date) || 0) + (Number(row.orderCount) || 0));
    existing.avgPrice = existing.bookings > 0 ? existing.revenue / existing.bookings : Number(row.avgPrice) || 0;
    grouped.set(row.name, existing);
  }

  return [...grouped.values()]
    .map((item) => ({
      ...item,
      bookings: Math.round(item.bookings),
      avgPrice: Math.round(item.avgPrice),
      revenue: Math.round(item.revenue),
      trend: [...item.byDate.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, value]) => Math.round(value)),
    }))
    .sort((a, b) => b.bookings - a.bookings);
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

export function Services() {
  const [viewMode, setViewMode] = useState("next30days");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [serviceUtilizationMode, setServiceUtilizationMode] = useState<"overall" | "header">("overall");
  const [globalDateRange, setGlobalDateRange] = useState("last-7-days");
  const [showInfoModal, setShowInfoModal] = useState(false);

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
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; type: ErrorType | null }>({
    isOpen: false,
    type: null,
  });
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; type: SuccessType | null }>({
    isOpen: false,
    type: null,
  });

  const [forecastRun, setForecastRun] = useState<ForecastRun | null>(null);
  const [customForecastStart, setCustomForecastStart] = useState("2026-06-01");
  const [customForecastEnd, setCustomForecastEnd] = useState("2026-06-30");
  const [weatherScenario, setWeatherScenario] = useState("default");
  const [holidayScenario, setHolidayScenario] = useState("default");
  const [tempOverride, setTempOverride] = useState(28);
  const [rainChanceOverride, setRainChanceOverride] = useState(0); // 0 or 1
  const [humidityOverride, setHumidityOverride] = useState(60);
  const [forecastMode, setForecastMode] = useState<string>("production");
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    let targetDays = 30;
    if (viewMode === "next90days") targetDays = 90;
    else if (viewMode === "next30days") targetDays = 30;
    else if (viewMode === "next14days") targetDays = 14;
    else if (viewMode === "next7days") targetDays = 7;
    else if (viewMode === "custom") {
      const diffDays = Math.ceil((new Date(customForecastEnd).getTime() - new Date(customForecastStart).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      targetDays = Math.max(1, Math.min(diffDays, 90));
    }

    const params: Record<string, string> = { days: String(targetDays) };
    if (weatherScenario === "sunny") {
      params.temp = "32";
      params.rain = "0";
      params.humidity = "40";
    } else if (weatherScenario === "rainy") {
      params.temp = "24";
      params.rain = "1";
      params.humidity = "90";
    } else if (weatherScenario === "custom") {
      params.temp = String(tempOverride);
      params.rain = String(rainChanceOverride);
      params.humidity = String(humidityOverride);
    }

    if (holidayScenario === "force") {
      params.holiday = "1";
    } else if (holidayScenario === "ignore") {
      params.holiday = "0";
    }

    if (forecastMode !== "production") {
      params.forecastMode = forecastMode;
      if (forecastMode === "latest-holdout") params.holdoutDays = "61";
    }

    getForecast("services", params).then(setForecastRun).catch((err) => {
      console.error("Forecast fetch failed:", err);
      toast.error(err.message || "Failed to fetch Services forecast. Please try again.");
    });
  }, [viewMode, customForecastStart, customForecastEnd, forecastMode]);

  useEffect(() => {
    const customRange = parseCustomRange(globalDateRange);
    if (customRange) {
      setViewMode("custom");
      setCustomForecastStart(customRange.start);
      setCustomForecastEnd(customRange.end);
      return;
    }

    if (globalDateRange === "last-30-days" || globalDateRange === "last-90-days" || globalDateRange === "last-12-months") {
      setViewMode("next30days");
    } else if (globalDateRange === "last-7-days" || globalDateRange === "today" || globalDateRange === "yesterday") {
      setViewMode("next7days");
    }
  }, [globalDateRange]);

  useEffect(() => {
    if (viewMode === "custom") return;
    const latestHistoryDate =
      forecastRun?.historical?.[forecastRun.historical.length - 1]?.date ||
      INGESTED_HISTORY_END_DATE;
    const defaultStart = addDays(latestHistoryDate, 1);
    setCustomForecastStart(defaultStart);
    setCustomForecastEnd(addDays(defaultStart, 29));
  }, [forecastRun?.generatedAt, viewMode]);

  const handleApplySimulation = async () => {
    setIsSimulating(true);
    toast.info("Running forecast simulation...");
    const params: Record<string, string> = {};
    if (weatherScenario === "sunny") {
      params.temp = "32";
      params.rain = "0";
      params.humidity = "40";
    } else if (weatherScenario === "rainy") {
      params.temp = "24";
      params.rain = "1";
      params.humidity = "90";
    } else if (weatherScenario === "custom") {
      params.temp = String(tempOverride);
      params.rain = String(rainChanceOverride);
      params.humidity = String(humidityOverride);
    }
    
    if (holidayScenario === "force") {
      params.holiday = "1";
    } else if (holidayScenario === "ignore") {
      params.holiday = "0";
    }

    if (forecastMode !== "production") {
      params.forecastMode = forecastMode;
      if (forecastMode === "latest-holdout") params.holdoutDays = "61";
    }

    let targetDays = 30;
    if (viewMode === "next90days") targetDays = 90;
    else if (viewMode === "next30days") targetDays = 30;
    else if (viewMode === "next14days") targetDays = 14;
    else if (viewMode === "next7days") targetDays = 7;
    else if (viewMode === "custom") {
      const diffDays = Math.ceil((new Date(customForecastEnd).getTime() - new Date(customForecastStart).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      targetDays = Math.max(1, Math.min(diffDays, 90));
    }
    params.days = String(targetDays);

    try {
      const res = await getForecast("services", params);
      setForecastRun(res);
      toast.success("Simulation complete!", {
        description: "Forecast chart and alerts updated based on your scenario.",
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
    setTempOverride(28);
    setRainChanceOverride(0);
    setHumidityOverride(60);

    let targetDays = 30;
    if (viewMode === "next90days") targetDays = 90;
    else if (viewMode === "next30days") targetDays = 30;
    else if (viewMode === "next14days") targetDays = 14;
    else if (viewMode === "next7days") targetDays = 7;
    else if (viewMode === "custom") {
      const diffDays = Math.ceil((new Date(customForecastEnd).getTime() - new Date(customForecastStart).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      targetDays = Math.max(1, Math.min(diffDays, 90));
    }

    const params: Record<string, string> = { days: String(targetDays) };
    if (forecastMode !== "production") {
      params.forecastMode = forecastMode;
      if (forecastMode === "latest-holdout") params.holdoutDays = "61";
    }

    try {
      const res = await getForecast("services", params);
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

  const bookingForecastData = useMemo(() => {
    if (!forecastRun?.historical?.length) {
      return [];
    }
    const latestHistoryDate =
      forecastRun.historical[forecastRun.historical.length - 1]?.date ||
      INGESTED_HISTORY_END_DATE;
    const bounds = getItemHistoryBounds(forecastRun);
    const horizon =
      viewMode === "next7days"
        ? 7
        : viewMode === "next14days"
          ? 14
          : viewMode === "next90days"
            ? 90
            : 30;

    const firstForecastDate = forecastRun.forecast?.[0]?.date;
    const isBacktest =
      forecastRun.modelMetadata?.forecastMode === "latest-holdout" ||
      forecastRun.modelMetadata?.forecastMode === "fixed-window" ||
      forecastRun.modelMetadata?.splitRatio === "80-10-10";

    const selectedRange =
      viewMode === "custom"
        ? {
            start: customForecastStart,
            end:
              customForecastEnd >= customForecastStart
                ? customForecastEnd
                : customForecastStart,
            isCustom: true,
          }
        : {
            start: isBacktest && firstForecastDate && firstForecastDate < latestHistoryDate
              ? firstForecastDate
              : addDays(latestHistoryDate, 1),
            end: addDays(latestHistoryDate, horizon),
            isCustom: false,
          };

    const historyRange =
      viewMode === "custom"
        ? selectedRange
        : isBacktest
          ? {
              start: firstForecastDate || "2026-04-01",
              end: latestHistoryDate,
              isCustom: false,
            }
        : parseGlobalRange(globalDateRange, latestHistoryDate, bounds);
    const historicalRows = filterByDateRange(forecastRun.historical, historyRange);
    const forecastRows = filterByDateRange(forecastRun.forecast || [], selectedRange);
    const shouldAnchorForecast =
      !isBacktest &&
      forecastRows.length > 0 &&
      (historicalRows.length === 0 ||
        historicalRows[historicalRows.length - 1]?.date !== latestHistoryDate);
    const anchorRow = shouldAnchorForecast
      ? forecastRun.historical[forecastRun.historical.length - 1]
      : null;
    const hist = [
      ...historicalRows,
      ...(anchorRow ? [anchorRow] : []),
    ].map((d, index, rows) => {
      const rev = getHistoricalRevenue(d);
      const gp = d.grossProfit !== undefined ? d.grossProfit : Math.round(rev * 0.65);
      return {
        day: d.date,
        actual: rev,
        grossProfit: gp,
        forecast:
          !isBacktest &&
          (viewMode !== "custom" || d.date === latestHistoryDate) &&
          index === rows.length - 1
            ? rev
            : null,
        projectedGrossProfit:
          !isBacktest &&
          (viewMode !== "custom" || d.date === latestHistoryDate) &&
          index === rows.length - 1
            ? gp
            : null,
      };
    });
    const fore = forecastRows.map((d) => {
      const projRev = getProjectedRevenue(d);
      return {
        day: d.date,
        actual: null,
        grossProfit: null,
        forecast: projRev,
        projectedGrossProfit: d.projectedGrossProfit !== undefined ? d.projectedGrossProfit : Math.round(projRev * 0.65),
      };
    });

    const mergedMap = new Map<string, any>();
    for (const point of hist) {
      mergedMap.set(point.day, { ...point });
    }
    for (const point of fore) {
      const existing = mergedMap.get(point.day);
      if (existing) {
        existing.forecast = point.forecast;
        existing.projectedGrossProfit = point.projectedGrossProfit;
      } else {
        mergedMap.set(point.day, { ...point });
      }
    }
    return [...mergedMap.values()].sort((a, b) => a.day.localeCompare(b.day));
  }, [forecastRun, viewMode, customForecastStart, customForecastEnd, globalDateRange]);

  // Aggregated KPI values dynamically calculated from API history based on globalDateRange
  const aggregatedKpis = useMemo(() => {
    const defaultKpis = {
      totalRevenue: forecastRun?.kpis?.totalRevenue || 0,
      totalOrders: forecastRun?.kpis?.totalOrders || 0,
      avgOrderValue: forecastRun?.kpis?.avgOrderValue || 0,
      revenueGrowth: { text: "0.0%", className: "text-xs text-gray-500 font-medium hidden md:block" },
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
    const totalRevenue = sliced.reduce((sum, d) => sum + getHistoricalRevenue(d), 0);
    const totalOrders = sliced.reduce((sum, d) => sum + (d.orders || 0), 0);
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : (forecastRun?.kpis?.avgOrderValue || 0);

    const dayCount = countDays(range.start, range.end);
    const previousEnd = addDays(range.start, -1);
    const previousStart = addDays(previousEnd, -(dayCount - 1));
    const prevRange = { start: previousStart, end: previousEnd, isCustom: range.isCustom };
    const prevSliced = filterByDateRange(forecastRun.historical, prevRange);
    const prevRevenue = prevSliced.reduce((sum, d) => sum + getHistoricalRevenue(d), 0);

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      revenueGrowth: formatGrowth(totalRevenue, prevRevenue),
    };
  }, [forecastRun, globalDateRange]);

  const servicesRevenue = aggregatedKpis.totalRevenue ? `₱${aggregatedKpis.totalRevenue.toLocaleString()}` : "₱0";
  const activeBookings = aggregatedKpis.totalOrders || 0;
  const serviceUtilization = useMemo(() => {
    if (!forecastRun?.topItems?.length && !forecastRun?.itemHistory?.length) return [];
    const bounds = getItemHistoryBounds(forecastRun);
    const latestHistoryDate = bounds.max || INGESTED_HISTORY_END_DATE;
    const scopedRows =
      serviceUtilizationMode === "header"
        ? filterByDateRange(
            forecastRun.itemHistory || [],
            parseGlobalRange(globalDateRange, latestHistoryDate, bounds),
          )
        : forecastRun.itemHistory || [];
    const sourceItems = scopedRows.length
      ? aggregateServiceHistory(scopedRows)
      : (forecastRun.topItems || []).map((item) => ({
          service: item.name,
          bookings: item.orderCount,
          avgPrice: item.avgPrice,
          revenue: item.revenue,
          category: item.category || "Services",
          trend: [] as number[],
        }));
    const totalBookings = sourceItems.reduce((sum, item) => sum + item.bookings, 0) || 1;
    const last7Days = forecastRun.historical.slice(-7);
    return sourceItems.slice(0, 8).map((item) => {
      const share = item.bookings / totalBookings;
      return {
        service: item.service,
        current: Math.round(share * 100),
        bookings: item.bookings,
        avgPrice: item.avgPrice,
        revenue: item.revenue,
        trend: item.trend.length
          ? item.trend
          : last7Days.map((day) => Math.round(day.orders * share)),
      };
    });
  }, [forecastRun, globalDateRange, serviceUtilizationMode]);
  const sortedServiceUtilization = useMemo(() => {
    if (!sortColumn) return serviceUtilization;
    return [...serviceUtilization].sort((a: any, b: any) => {
      const left =
        sortColumn === "utilization" ? a.current :
        sortColumn === "bookings" ? a.bookings :
        sortColumn === "avgPrice" ? a.avgPrice :
        sortColumn === "revenue" ? a.revenue :
        String(a.service || "");
      const right =
        sortColumn === "utilization" ? b.current :
        sortColumn === "bookings" ? b.bookings :
        sortColumn === "avgPrice" ? b.avgPrice :
        sortColumn === "revenue" ? b.revenue :
        String(b.service || "");
      const result =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right));
      return sortDirection === "asc" ? result : -result;
    });
  }, [serviceUtilization, sortColumn, sortDirection]);
  const recentBookings = useMemo(
    () =>
      (forecastRun?.historical || []).slice(-10).map((point) => ({
        hour: point.date,
        bookings: point.orders,
      })),
    [forecastRun],
  );
  const weeklyTrends = useMemo(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const displayDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const totals = new Map(displayDays.map((day) => [day, 0]));
    const historical = forecastRun?.historical || [];
    const latestDate = historical[historical.length - 1]?.date;
    if (!latestDate) {
      return displayDays.map((day) => ({ day, bookings: 0 }));
    }
    const latest = new Date(`${latestDate}T00:00:00`);
    const monday = new Date(latest);
    const dayOffset = (latest.getDay() + 6) % 7;
    monday.setDate(latest.getDate() - dayOffset);
    const weekStart = monday.toISOString().slice(0, 10);
    for (const point of historical) {
      if (point.date < weekStart || point.date > latestDate) continue;
      const day = dayNames[new Date(`${point.date}T00:00:00`).getDay()];
      totals.set(day, (totals.get(day) || 0) + point.orders);
    }
    return displayDays.map((day) => ({
      day,
      bookings: totals.get(day) || 0,
    }));
  }, [forecastRun]);
  const occupancyAlerts = useMemo(() => {
    const forecast = forecastRun?.forecast || [];
    if (!forecast.length) return [];
    const average =
      forecast.reduce((sum, point) => sum + point.forecast, 0) /
      forecast.length;
    const max = Math.max(...forecast.map((point) => point.forecast), 1);
    return [...forecast]
      .sort((a, b) => b.forecast - a.forecast)
      .slice(0, 3)
      .map((point) => ({
        time: point.date,
        service: "Projected Services demand",
        capacity: Math.round((point.forecast / max) * 100),
        risk: point.forecast >= average * 1.2 ? "High" : "Medium",
        projectedRevenue: point.forecast,
        action: forecastRun?.isFallback
          ? "Review fallback forecast"
          : "Plan staffing",
      }));
  }, [forecastRun]);
  const peakForecast = occupancyAlerts[0];
  const latestServicesHistoryDate = getMetadataDate(
    forecastRun,
    "historyEndDate",
    forecastRun?.historical?.[forecastRun.historical.length - 1]?.date || INGESTED_HISTORY_END_DATE,
  );
  const servicesForecastStartMin = addDays(latestServicesHistoryDate, 1);
  const servicesForecastMaxDate = minDateString(
    getMetadataDate(forecastRun, "forecastEndDate", addDays(latestServicesHistoryDate, 90)),
    addDays(latestServicesHistoryDate, 90),
  );
  const servicesForecastEndMax = minDateString(
    servicesForecastMaxDate,
    addDays(customForecastStart || servicesForecastStartMin, 89),
  );

  useEffect(() => {
    if (viewMode !== "custom") return;
    if (customForecastStart < servicesForecastStartMin || customForecastStart > servicesForecastMaxDate) {
      setCustomForecastStart(servicesForecastStartMin);
      setCustomForecastEnd(minDateString(servicesForecastMaxDate, addDays(servicesForecastStartMin, 89)));
      return;
    }
    if (customForecastEnd < customForecastStart || customForecastEnd > servicesForecastEndMax) {
      setCustomForecastEnd(servicesForecastEndMax);
    }
  }, [
    customForecastEnd,
    customForecastStart,
    servicesForecastEndMax,
    servicesForecastMaxDate,
    servicesForecastStartMin,
    viewMode,
  ]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleResolveAlert = (time: string) => {
    // Simulate API timeout for the first alert
    if (time === "3:00 PM Today") {
      toast.info("Processing...");
      setTimeout(() => {
        setErrorModal({ isOpen: true, type: "api_timeout" });
      }, 1500);
      return;
    }

    toast.success("Alert resolved", {
      description: `Occupancy alert for ${time} has been addressed.`,
    });
  };

  const handleRetrainModel = () => {
    const toastId = toast.loading("Retraining model with latest data... This may take a few seconds.");
    const params: Record<string, string> = { forceRefresh: "true" };
    if (forecastMode !== "production") {
      params.forecastMode = forecastMode;
      if (forecastMode === "latest-holdout") params.holdoutDays = "61";
    }
    getForecast("services", params)
      .then((res) => {
        setForecastRun(res);
        toast.dismiss(toastId);
        setSuccessModal({ isOpen: true, type: "model_retrain_success" });
      })
      .catch((err) => {
        toast.dismiss(toastId);
        toast.error("Model retraining failed: " + (err instanceof Error ? err.message : String(err)));
        setErrorModal({ isOpen: true, type: "data_sync_failed" });
      });
  };

  const handleRetryDataSync = () => {
    setErrorModal({ isOpen: false, type: null });
    toast.info("Retrying data synchronization...");
    setTimeout(() => {
      const params: Record<string, string> = {};
      if (forecastMode !== "production") {
        params.forecastMode = forecastMode;
        if (forecastMode === "latest-holdout") params.holdoutDays = "61";
      }
      void getForecast("services", params).then(setForecastRun);
      setSuccessModal({ isOpen: true, type: "data_sync_success" });
    }, 2000);
  };

  const handleRetryApiTimeout = () => {
    setErrorModal({ isOpen: false, type: null });
    toast.info("Retrying with extended timeout...");
    setTimeout(() => {
      setSuccessModal({ isOpen: true, type: "connection_restored" });
    }, 1500);
  };

  const getRiskColor = (risk: string) => {
    if (risk === "High") return "text-red-600 bg-red-50";
    if (risk === "Medium") return "text-orange-600 bg-orange-50";
    return "text-yellow-600 bg-yellow-50";
  };

  return (
    <div className="space-y-6 md:space-y-8 lg:space-y-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl lg:text-[36px] font-extrabold text-[#223047]">
            Pet Services Command Center
          </h1>
          <p className="text-sm md:text-base text-[#223047] opacity-60 mt-1 md:mt-2" style={{ lineHeight: "1.6" }}>
            Real-time capacity management and booking demand forecasting
          </p>
        </div>
        <Badge className="bg-[#3AE4FA] text-white hover:bg-[#3AE4FA] px-4 py-1 self-start">
          Services Sector
        </Badge>
      </div>

      {/* KPI ROW */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Services Revenue Today */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#F53799] to-[#D42A7D] flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Historical Services Revenue</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{servicesRevenue}</div>
              <div className={aggregatedKpis.revenueGrowth.className}>{aggregatedKpis.revenueGrowth.text}</div>
            </div>
          </div>

          {/* Active Bookings */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#3AE4FA] to-[#5CE1E6] flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Active Bookings</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{activeBookings}</div>
            </div>
          </div>

          {/* Avg Utilization Rate */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#3AE4FA] to-[#5CE1E6] flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Avg Booking Value</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">₱{aggregatedKpis.avgOrderValue.toLocaleString()}</div>
            </div>
          </div>

          {/* Peak Capacity Alert */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#3AE4FA] to-[#5CE1E6] flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Peak Forecast Date</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{peakForecast?.time || "—"}</div>
              <Button size="sm" className="bg-[#3AE4FA] hover:bg-[#5CE1E6] text-white h-6 md:h-7 text-xs mt-1 px-2 md:px-3 hidden md:inline-flex">
                View Alerts
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* SERVICES REVENUE FORECAST - Best Model Only */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              Services Revenue & Demand Forecast
            </h2>
            <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
              Active model: <span className="font-semibold text-[#3AE4FA]">{forecastRun?.modelName || "Waiting for uploaded Services history"}</span>
              {forecastRun && ` (MASE: ${forecastRun.mase.toFixed(2)}, Accuracy: ${forecastRun.accuracy.toFixed(1)}%)`}
            </p>
            {forecastRun?.isFallback && (
              <Badge className="mt-2 bg-amber-500 text-white hover:bg-amber-500">
                SMA fallback active: selected model did not meet the MASE threshold
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {["Next 90 Days", "Next 30 Days", "Next 14 Days", "Next 7 Days", "Custom"].map((view) => (
              <Button
                key={view}
                size="sm"
                variant={viewMode === view.toLowerCase().replace(/\s+/g, "") ? "default" : "outline"}
                onClick={() => setViewMode(view.toLowerCase().replace(/\s+/g, ""))}
                className={
                  viewMode === view.toLowerCase().replace(/\s+/g, "")
                    ? "bg-[#3AE4FA] hover:bg-[#5CE1E6] text-xs"
                    : "border-[#FFD9EC] hover:bg-[#FFF2FA] text-xs"
                }
              >
                {view}
              </Button>
            ))}
          </div>
        </div>

        {viewMode === "custom" && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#FFD9EC] bg-[#FFF7FB] p-3">
            <input
              type="date"
              min={servicesForecastStartMin}
              max={servicesForecastMaxDate}
              value={customForecastStart}
              onChange={(event) => {
                const nextStart = event.target.value;
                setCustomForecastStart(nextStart);
                setCustomForecastEnd((current) =>
                  current < nextStart || current > minDateString(servicesForecastMaxDate, addDays(nextStart, 89))
                    ? minDateString(servicesForecastMaxDate, addDays(nextStart, 89))
                    : current,
                );
              }}
              className="h-9 rounded-md border border-[#FFD9EC] px-2 text-xs text-[#223047] focus:outline-none focus:ring-2 focus:ring-[#3AE4FA]"
            />
            <input
              type="date"
              min={customForecastStart}
              max={servicesForecastEndMax}
              value={customForecastEnd}
              onChange={(event) => setCustomForecastEnd(event.target.value > servicesForecastEndMax ? servicesForecastEndMax : event.target.value)}
              className="h-9 rounded-md border border-[#FFD9EC] px-2 text-xs text-[#223047] focus:outline-none focus:ring-2 focus:ring-[#3AE4FA]"
            />
          </div>
        )}

        <ResponsiveContainer width="100%" height={300} className="md:!h-[400px]">
          <LineChart data={bookingForecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#FFD9EC" vertical={false} />
            <XAxis
              dataKey="day"
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
              key="line-actual"
              type="monotone"
              dataKey="actual"
              stroke="#223047"
              strokeWidth={2.5}
              dot={false}
              animationDuration={800}
              name="Revenue"
            />
            <Line
              key="line-forecast"
              type="monotone"
              dataKey="forecast"
              stroke="#3AE4FA"
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
                  "repeating-linear-gradient(to right, #3AE4FA 0 6px, transparent 6px 10px)",
              }}
            />
            <span>Predicted revenue</span>
          </div>
        </div>

        {/* Model Info & Insights & Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 pt-4 md:pt-6 border-t border-[#FFD9EC]">
          <div className="bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl md:rounded-2xl p-4 md:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm md:text-base font-bold text-[#223047]">Active Model Performance</h3>
              <button
                onClick={() => setShowInfoModal(true)}
                className="p-1 hover:bg-[#FFF2FA] rounded-full transition-colors text-[#3AE4FA]"
                title="Explain metrics"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div>
                <div className="text-xs text-[#223047] opacity-60 mb-1">MASE</div>
                <div className="text-xl md:text-2xl font-bold text-[#3AE4FA]">{forecastRun?.mase.toFixed(2) ?? "—"}</div>
                <div className="text-xs text-[#223047] opacity-60 hidden md:block">Fallback threshold: 1.20</div>
              </div>
              <div>
                <div className="text-xs text-[#223047] opacity-60 mb-1">Accuracy</div>
                <div className="text-xl md:text-2xl font-bold text-[#223047]">{forecastRun ? `${forecastRun.accuracy.toFixed(1)}%` : "—"}</div>
              </div>
              <div>
                <div className="text-xs text-[#223047] opacity-60 mb-1">sMAPE</div>
                <div className="text-xl md:text-2xl font-bold text-[#223047]">{forecastRun ? `${forecastRun.smape.toFixed(2)}%` : "—"}</div>
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
                {forecastRun.modelMetadata.tempOverride !== undefined && (
                  <div className="text-[#3AE4FA] font-medium">Temp Override: {String(forecastRun.modelMetadata.tempOverride)}°C</div>
                )}
                {forecastRun.modelMetadata.rainOverride !== undefined && (
                  <div className="text-[#3AE4FA] font-medium">Rain Override: {forecastRun.modelMetadata.rainOverride === 1 ? "Yes" : "No"}</div>
                )}
                {forecastRun.modelMetadata.holidayOverride !== undefined && (
                  <div className="text-[#3AE4FA] font-medium">Holiday Override: {forecastRun.modelMetadata.holidayOverride === 1 ? "Yes" : "No"}</div>
                )}
              </div>
            )}
          </div>

          <div className="bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl md:rounded-2xl p-4 md:p-6 space-y-3 md:space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-sm md:text-base font-bold text-[#223047]">WOOF Analysis</h3>
              
              <div>
                <label className="text-[11px] text-[#223047] opacity-70 block mb-1 font-semibold">Forecast Mode</label>
                <select
                  value={forecastMode}
                  onChange={(e) => setForecastMode(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-[#FFD9EC] rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#3AE4FA]"
                >
                  <option value="production">Production forecast</option>
                  <option value="latest-holdout">Latest holdout backtest</option>
                  <option value="fixed-window">Thesis fixed-window backtest</option>
                </select>
              </div>

              <p className="text-xs text-[#223047] opacity-70" style={{ lineHeight: "1.6" }}>
                {forecastMode === "fixed-window"
                  ? "Thesis backtest mode uses the April-May 2026 overlap for reproducible defense metrics."
                  : forecastMode === "latest-holdout"
                    ? "Latest holdout mode evaluates against the most recent complete 61-day window, ready for continuous POS/API ingestion."
                  : (forecastRun
                      ? `${forecastRun.modelName} was selected using held-out uploaded Services history and generated ${new Date(forecastRun.generatedAt).toLocaleString()}.`
                      : "Upload Services history from POS or PetHub to generate a validated forecast.")}
              </p>
            </div>
            
            <Button onClick={handleRetrainModel} className="w-full bg-[#3AE4FA] hover:bg-[#5CE1E6] text-xs md:text-sm mt-2" size="sm">
              Retrain Model
            </Button>
          </div>

          {/* EXOGENOUS FACTORS OVERRIDE & SIMULATOR */}
          <div className="bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl md:rounded-2xl p-4 md:p-6 space-y-3 flex flex-col justify-between">
            <div>
              <h3 className="text-sm md:text-base font-bold text-[#223047] flex items-center gap-1.5">
                <span>Sales Simulator (What-If?)</span>
              </h3>
              <p className="text-xs text-[#223047] opacity-60 mb-2">
                See how different weather patterns and calendar holidays affect your upcoming sales.
              </p>

              <div className="space-y-3">
                {/* Weather Select */}
                <div>
                  <label className="text-[11px] text-[#223047] opacity-70 block mb-1 font-semibold">Weather Conditions</label>
                  <select
                    value={weatherScenario}
                    onChange={(e) => setWeatherScenario(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-[#FFD9EC] rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#3AE4FA]"
                  >
                    <option value="default">Current Live Weather</option>
                    <option value="sunny">Hot & Sunny Day (32°C, No Rain)</option>
                    <option value="rainy">Cool & Rainy Day (24°C, Rainy)</option>
                    <option value="custom">Custom Climate (Sliders)...</option>
                  </select>
                </div>

                {weatherScenario === "custom" && (
                  <div className="space-y-2 border border-[#FFD9EC] bg-[#FFF2FA]/50 p-2.5 rounded-lg mt-2">
                    <div>
                      <div className="flex justify-between text-[10px] text-[#223047] mb-1 font-semibold">
                        <span>Temperature</span>
                        <span>{tempOverride}°C</span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="40"
                        value={tempOverride}
                        onChange={(e) => setTempOverride(Number(e.target.value))}
                        className="w-full h-1 bg-[#FFD9EC] rounded-lg appearance-none cursor-pointer accent-[#3AE4FA]"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-[#223047] mb-1 font-semibold">
                        <span>Relative Humidity</span>
                        <span>{humidityOverride}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={humidityOverride}
                        onChange={(e) => setHumidityOverride(Number(e.target.value))}
                        className="w-full h-1 bg-[#FFD9EC] rounded-lg appearance-none cursor-pointer accent-[#3AE4FA]"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-[#223047] mb-1 font-semibold">
                        <span>Rain Chance / Intensity</span>
                        <span>{rainChanceOverride === 1 ? "Rainy" : "No Rain"}</span>
                      </div>
                      <select
                        value={rainChanceOverride}
                        onChange={(e) => setRainChanceOverride(Number(e.target.value))}
                        className="w-full px-2 py-1 bg-white border border-[#FFD9EC] rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-[#3AE4FA]"
                      >
                        <option value="0">No Rain</option>
                        <option value="1">Rainy</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Holiday Select */}
                <div>
                  <label className="text-[11px] text-[#223047] opacity-70 block mb-1 font-semibold">Holiday Schedule</label>
                  <select
                    value={holidayScenario}
                    onChange={(e) => setHolidayScenario(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-[#FFD9EC] rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#3AE4FA]"
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
                className="flex-1 bg-[#3AE4FA] hover:bg-[#5CE1E6] text-white text-xs py-1"
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
              ? `${forecastRun.topItems[0].name} leads Services revenue at ₱${forecastRun.topItems[0].revenue.toLocaleString()} from ${forecastRun.topItems[0].orderCount} bookings.`
              : "Upload Services history from POS or PetHub to populate service-level insights."}
          </p>
        </div>
        <img
          src={servicesMascot.src}
          alt="Services Mascot"
          className="w-24 h-24 md:w-32 md:h-32 object-contain flex-shrink-0 ml-6"
        />
      </div>

      {/* SERVICE UTILIZATION */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
                Service Utilization Monitor
              </h2>
              <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
                Real-time capacity and booking status
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
                  variant={serviceUtilizationMode === value ? "default" : "ghost"}
                  onClick={() => setServiceUtilizationMode(value as "overall" | "header")}
                  className={
                    serviceUtilizationMode === value
                      ? "h-8 bg-[#3AE4FA] hover:bg-[#5CE1E6] text-xs"
                      : "h-8 text-xs hover:bg-[#FFF2FA]"
                  }
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-[#FFF2FA]"
                  onClick={() => handleSort("service")}
                >
                  Service {sortColumn === "service" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-[#FFF2FA] text-center"
                  onClick={() => handleSort("utilization")}
                >
                  Demand Share {sortColumn === "utilization" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-[#FFF2FA] text-center"
                  onClick={() => handleSort("bookings")}
                >
                  Bookings {sortColumn === "bookings" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-[#FFF2FA] text-center"
                  onClick={() => handleSort("avgPrice")}
                >
                  Avg Ticket {sortColumn === "avgPrice" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
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
              {sortedServiceUtilization.map((service, serviceIndex) => (
                <React.Fragment key={`service-${service.service}-${serviceIndex}`}>
                  <TableRow
                    className="cursor-pointer hover:bg-[#FFF2FA]"
                    onClick={() => setExpandedService(expandedService === service.service ? null : service.service)}
                  >
                    <TableCell className="font-semibold text-xs md:text-sm">{service.service}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#3AE4FA] transition-all"
                              style={{ width: `${service.current}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold w-10">{service.current}%</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs md:text-sm">{service.bookings}</TableCell>
                    <TableCell className="text-center text-xs">₱{service.avgPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-center font-semibold text-xs md:text-sm">₱{service.revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center justify-center p-1 rounded hover:bg-[#FFF2FA] text-[#3AE4FA] transition-colors">
                        {expandedService === service.service ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedService === service.service && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-[#FFF7FB]">
                        <div className="p-3 md:p-4 space-y-3">
                          <ResponsiveContainer width="100%" height={120} className="md:!h-[150px]">
                            <BarChart data={service.trend.map((bookings, index) => ({
                              day: `Day ${index + 1}`,
                              bookings,
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#FFD9EC" />
                              <XAxis dataKey="day" style={{ fontSize: "10px" }} />
                              <YAxis style={{ fontSize: "10px" }} />
                              <Tooltip />
                              <Bar key="bar-bookings" dataKey="bookings" fill="#3AE4FA" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Hourly Bookings + Weekly Trends (40% - 2 columns) */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Hourly Bookings */}
          <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 space-y-3 md:space-y-4">
            <div>
              <h3 className="text-base md:text-lg font-bold text-[#223047]">Recent Daily Bookings</h3>
              <p className="text-xs text-[#223047] opacity-60 mt-1">Calculated from uploaded Services transactions</p>
            </div>

            <ResponsiveContainer width="100%" height={180} className="md:!h-[200px]">
              <BarChart data={recentBookings}>
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
                <Bar key="bar-bookings-hourly" dataKey="bookings" fill="#3AE4FA" radius={[6, 6, 0, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Trends */}
          <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 space-y-3 md:space-y-4">
            <h3 className="text-base md:text-lg font-bold text-[#223047]">Booking Weekly Volume</h3>

            <ResponsiveContainer width="100%" height={180} className="md:!h-[200px]">
              <AreaChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFD9EC" vertical={false} />
                <XAxis dataKey="day" stroke="#223047" style={{ fontSize: "10px" }} />
                <YAxis stroke="#223047" style={{ fontSize: "10px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #FFD9EC",
                    borderRadius: "12px",
                  }}
                />
                <Area
                  key="area-bookings"
                  type="monotone"
                  dataKey="bookings"
                  stroke="#3AE4FA"
                  fill="#3AE4FA"
                  fillOpacity={0.6}
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">Forecast Demand Alerts</h2>
            <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
              Highest projected Services revenue days from the active forecast
            </p>
          </div>
          <Badge className="bg-red-500 text-white hover:bg-red-500 self-start">{occupancyAlerts.length} Active Alerts</Badge>
        </div>

        <div className="grid gap-3 md:gap-4">
          {occupancyAlerts.map((alert, idx) => (
            <div key={idx} className="p-4 bg-[#FFF7FB] border-l-4 border-[#F53799] rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`${getRiskColor(alert.risk)} font-semibold text-xs px-2 py-1`}>{alert.risk.toUpperCase()} RISK</Badge>
                    <span className="text-xs md:text-sm font-bold text-[#223047]">{alert.time}</span>
                  </div>
                  <div className="text-sm md:text-base font-bold text-[#223047]">{alert.service}</div>
                  <div className="text-xs text-[#223047] opacity-70 mt-1">Relative demand: {alert.capacity}% • Projected revenue: ₱{alert.projectedRevenue.toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleResolveAlert(alert.time)} className="bg-[#3AE4FA] hover:bg-[#5CE1E6] text-xs md:text-sm" size="sm">Resolve</Button>
                  <Button variant="outline" className="border-[#FFD9EC] text-xs md:text-sm" size="sm">Snooze</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Modal */}
      {errorModal.type && (
        <ErrorModal
          isOpen={errorModal.isOpen}
          onClose={() => setErrorModal({ isOpen: false, type: null })}
          errorType={errorModal.type}
          onRetry={() => {
            if (errorModal.type === "api_timeout") {
              handleRetryApiTimeout();
            } else if (errorModal.type === "data_sync_failed") {
              handleRetryDataSync();
            }
          }}
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

      {/* Model Performance Metrics Guide modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#FFD9EC] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#FFD9EC]">
              <h3 className="text-base font-bold text-[#223047]">Model Performance Metrics Guide</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-xs text-gray-500 hover:text-[#3AE4FA] font-bold"
              >
                Close
              </button>
            </div>
            <div className="space-y-4 text-xs md:text-sm text-[#223047] opacity-80 animate-in fade-in zoom-in-95 duration-150" style={{ lineHeight: "1.6" }}>
              <div>
                <strong className="text-sm text-[#3AE4FA]">MASE (Mean Absolute Scaled Error)</strong>
                <p className="mt-1">
                  Measures how smart the AI's prediction is compared to a simple baseline guess (such as assuming today's sales are identical to yesterday's). A score **below 1.0** indicates that our AI model is performing significantly better and is highly reliable.
                </p>
              </div>
              <div>
                <strong className="text-sm text-[#3AE4FA]">Accuracy</strong>
                <p className="mt-1">
                  The overall correctness rate of the AI's forecasts. For example, a **90% accuracy** means the system's daily sales projections are 90% close to the actual final sales numbers.
                </p>
              </div>
              <div>
                <strong className="text-sm text-[#3AE4FA]">sMAPE (Symmetric Mean Absolute Percentage Error)</strong>
                <p className="mt-1">
                  The symmetric percentage error between forecasted and actual demand. It is more stable for low-volume Services days.
                </p>
              </div>
              <div>
                <strong className="text-sm text-[#3AE4FA]">Missing Days Filled</strong>
                <p className="mt-1">
                  The count of days with missing sales data (due to closures or system downtime) that the AI automatically calculated and filled using smart estimations to keep the forecasting model accurate and complete.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowInfoModal(false)}
              className="w-full bg-[#3AE4FA] hover:bg-[#5CE1E6] text-white rounded-lg mt-4"
            >
              Understood
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
