import { useState, useMemo, useEffect } from "react";
import * as React from "react";
import { Scissors, DollarSign, Calendar, TrendingUp, AlertTriangle, Users, Clock } from "lucide-react";
import { KPICard } from "../components/KPICard";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ErrorModal, ErrorType } from "../components/ErrorModal";
import { SuccessModal, SuccessType } from "../components/SuccessModal";
import servicesMascot from "../../imports/no_bg_Services-1.png";
import { getDashboard, getForecast } from "../lib/api";
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

// Fallback booking data will be used if API fails

const serviceUtilization = [
  { service: "Full Grooming", current: 87, capacity: 100, bookings: 14, avgDuration: 90, revenue: 12600 },
  { service: "Boarding", current: 72, capacity: 100, bookings: 18, avgDuration: 1440, revenue: 25200 },
  { service: "Birthday Party", current: 45, capacity: 100, bookings: 3, avgDuration: 180, revenue: 8100 },
  { service: "Paw-dicure", current: 65, capacity: 100, bookings: 11, avgDuration: 45, revenue: 4950 },
  { service: "Bath Only", current: 58, capacity: 100, bookings: 9, avgDuration: 30, revenue: 2700 },
];

const occupancyAlerts = [
  { time: "3:00 PM Today", service: "Full Grooming", capacity: 92, risk: "High", queued: 8, action: "Suggest reschedule" },
  { time: "4:00 PM Today", service: "Full Grooming", capacity: 87, risk: "High", queued: 6, action: "Add temp slot" },
  { time: "11:00 AM Tomorrow", service: "Boarding", capacity: 78, risk: "Medium", queued: 4, action: "Monitor" },
];

const hourlyBookings = Array.from({ length: 10 }, (_, i) => ({
  hour: `${i + 9}:00`,
  bookings: Math.floor(Math.random() * 8 + 2),
  capacity: 10,
}));

const weeklyTrends = Array.from({ length: 7 }, (_, i) => ({
  day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
  grooming: Math.random() * 15 + 10,
  boarding: Math.random() * 20 + 15,
  other: Math.random() * 8 + 3,
}));

export function Services() {
  const [viewMode, setViewMode] = useState("today");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState("3 hours ago");
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; type: ErrorType | null }>({
    isOpen: false,
    type: null,
  });
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; type: SuccessType | null }>({
    isOpen: false,
    type: null,
  });

  // API data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [forecastApiData, setForecastApiData] = useState<any>(null);

  useEffect(() => {
    getDashboard("services").then(setDashboardData).catch(() => {});
    getForecast("services").then(setForecastApiData).catch(() => {});
  }, []);

  const bookingForecastData = useMemo(() => {
    if (!forecastApiData?.historical?.length) {
      return [];
    }
    const hist = forecastApiData.historical.map((d: any, index: number, arr: any[]) => ({
      day: d.date,
      actual: d.actual,
      forecast: index === arr.length - 1 ? d.actual : null,
    }));
    const fore = (forecastApiData.forecast || []).map((d: any) => ({
      day: d.date,
      actual: null,
      forecast: d.forecast,
    }));
    return [...hist.slice(-30), ...fore];
  }, [forecastApiData]);

  const kpis = dashboardData?.kpis || {};
  const servicesRevenue = kpis.totalRevenue ? `₱${kpis.totalRevenue.toLocaleString()}` : "₱0";
  const activeBookings = kpis.totalOrders || 0;

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
    toast.info("Starting model retraining...");
    setTimeout(() => {
      setErrorModal({ isOpen: true, type: "data_sync_failed" });
    }, 2000);
  };

  const handleRetryDataSync = () => {
    setErrorModal({ isOpen: false, type: null });
    toast.info("Retrying data synchronization...");
    setTimeout(() => {
      // Update the last sync time to show data was refreshed
      setLastSyncTime("just now");
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
              <div className="text-xs text-green-600 font-medium hidden md:block">+8.5% ↑</div>
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
              <div className="text-xs text-[#223047] opacity-60 truncate">Avg Utilization Rate</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">65%</div>
            </div>
          </div>

          {/* Peak Capacity Alert */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#3AE4FA] to-[#5CE1E6] flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Peak Capacity Alert</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">3:00 PM</div>
              <Button size="sm" className="bg-[#3AE4FA] hover:bg-[#5CE1E6] text-white h-6 md:h-7 text-xs mt-1 px-2 md:px-3 hidden md:inline-flex">
                View Alerts
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* SERVICES DEMAND FORECAST - Best Model Only */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              Services Demand Forecast
            </h2>
            <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
              AI-selected best model: <span className="font-semibold text-[#3AE4FA]">{forecastApiData?.modelInfo?.model || "SARIMA"}</span> (MASE: {forecastApiData?.modelInfo?.mase || "0.72"}, Accuracy: {forecastApiData?.modelInfo?.accuracy || "89"}%)
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {["Next 30 Days", "Next 7 Days", "Next 14 Days"].map((view) => (
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

        <ResponsiveContainer width="100%" height={300} className="md:!h-[400px]">
          <LineChart data={bookingForecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#FFD9EC" vertical={false} />
            <XAxis dataKey="day" stroke="#223047" style={{ fontSize: "12px" }} />
            <YAxis stroke="#223047" style={{ fontSize: "12px" }} />
            <Tooltip
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
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Model Info & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 pt-4 md:pt-6 border-t border-[#FFD9EC]">
          <div className="bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl md:rounded-2xl p-4 md:p-6 space-y-3">
            <h3 className="text-sm md:text-base font-bold text-[#223047]">Active Model Performance</h3>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div>
                <div className="text-xs text-[#223047] opacity-60 mb-1">MASE</div>
                <div className="text-xl md:text-2xl font-bold text-[#3AE4FA]">{forecastApiData?.modelInfo?.mase || "0.72"}</div>
                <div className="text-xs text-green-600 hidden md:block">Beats baseline by 28%</div>
              </div>
              <div>
                <div className="text-xs text-[#223047] opacity-60 mb-1">RMSE</div>
                <div className="text-xl md:text-2xl font-bold text-[#223047]">{forecastApiData?.modelInfo?.rmse || "2.14"}</div>
              </div>
              <div>
                <div className="text-xs text-[#223047] opacity-60 mb-1">MAPE</div>
                <div className="text-xl md:text-2xl font-bold text-[#223047]">{forecastApiData?.modelInfo?.mape !== undefined ? `${forecastApiData.modelInfo.mape}%` : "6.8%"}</div>
              </div>
              <div>
                <div className="text-xs text-[#223047] opacity-60 mb-1">R²</div>
                <div className="text-xl md:text-2xl font-bold text-[#223047]">{forecastApiData?.modelInfo?.r2 !== undefined ? forecastApiData.modelInfo.r2 : "0.89"}</div>
              </div>
            </div>
          </div>

          <div className="bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl md:rounded-2xl p-4 md:p-6 space-y-3 md:space-y-4">
            <h3 className="text-sm md:text-base font-bold text-[#223047]">WOOF Analysis</h3>
            <p className="text-xs md:text-sm text-[#223047] opacity-70" style={{ lineHeight: "1.6" }}>
              SARIMA model excels at weekly seasonality detection. Slight over-forecast bias of +0.12% on weekdays. Strong weekend pattern recognition. Model retrained {lastSyncTime} with latest booking data.
            </p>
            <Button onClick={handleRetrainModel} className="w-full bg-[#3AE4FA] hover:bg-[#5CE1E6] text-xs md:text-sm" size="sm">
              Retrain Model
            </Button>
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
            "Full Grooming approaching capacity at 3 PM. Consider dynamic pricing (+10%) or suggest alternative time slots to customers."
          </p>
        </div>
        <img
          src={servicesMascot.src}
          alt="Services Mascot"
          className="w-24 h-24 md:w-32 md:h-32 object-contain flex-shrink-0 ml-6"
        />
      </div>

      {/* SERVICE UTILIZATION + HOURLY BOOKINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
        {/* Service Utilization Table (60% - 3 columns) */}
        <div className="lg:col-span-3 bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
          <div>
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              Service Utilization Monitor
            </h2>
            <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
              Real-time capacity and booking status
            </p>
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
                  Utilization {sortColumn === "utilization" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="text-center">Bookings</TableHead>
                <TableHead className="text-center">Avg Time</TableHead>
                <TableHead className="text-center">Revenue</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceUtilization.map((service, serviceIndex) => (
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
                    <TableCell className="text-center text-xs">{service.avgDuration} min</TableCell>
                    <TableCell className="text-center font-semibold text-xs md:text-sm">₱{service.revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Button size="sm" variant="outline" className="border-[#3AE4FA] text-[#3AE4FA] text-xs">
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedService === service.service && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-[#FFF7FB]">
                        <div className="p-3 md:p-4 space-y-3">
                          <ResponsiveContainer width="100%" height={120} className="md:!h-[150px]">
                            <BarChart
                              data={Array.from({ length: 7 }, (_, i) => ({
                                day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
                                bookings: Math.floor(Math.random() * 10 + 5),
                              }))}
                            >
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
              <h3 className="text-base md:text-lg font-bold text-[#223047]">Today's Hourly Bookings</h3>
              <p className="text-xs text-[#223047] opacity-60 mt-1">Operating hours: 9 AM - 6 PM</p>
            </div>

            <ResponsiveContainer width="100%" height={180} className="md:!h-[200px]">
              <BarChart data={hourlyBookings}>
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
                <Bar key="bar-capacity" dataKey="capacity" fill="#FFD9EC" radius={[6, 6, 0, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Trends */}
          <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 space-y-3 md:space-y-4">
            <h3 className="text-base md:text-lg font-bold text-[#223047]">Weekly Service Mix</h3>

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
                  key="area-grooming"
                  type="monotone"
                  dataKey="grooming"
                  stackId="1"
                  stroke="#3AE4FA"
                  fill="#3AE4FA"
                  fillOpacity={0.6}
                  animationDuration={800}
                />
                <Area
                  key="area-boarding"
                  type="monotone"
                  dataKey="boarding"
                  stackId="1"
                  stroke="#5CE1E6"
                  fill="#5CE1E6"
                  fillOpacity={0.6}
                  animationDuration={800}
                />
                <Area
                  key="area-other"
                  type="monotone"
                  dataKey="other"
                  stackId="1"
                  stroke="#FFD9EC"
                  fill="#FFD9EC"
                  fillOpacity={0.6}
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CAPACITY ALERTS */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
          <div className="flex-1">
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              Capacity Alerts & Occupancy Risks
            </h2>
            <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
              Predicted bottlenecks requiring intervention
            </p>
          </div>
          <Badge className="bg-red-500 text-white hover:bg-red-500 self-start">
            {occupancyAlerts.length} Active Alerts
          </Badge>
        </div>

        <div className="grid gap-3 md:gap-4">
          {occupancyAlerts.map((alert, idx) => (
            <div
              key={idx}
              className="flex flex-col md:flex-row md:items-center md:justify-between p-4 md:p-6 bg-[#FFF7FB] border-l-4 border-[#F53799] rounded-xl gap-3 md:gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <Badge className={`${getRiskColor(alert.risk)} font-semibold text-xs px-2 py-1`}>
                    {alert.risk.toUpperCase()} RISK
                  </Badge>
                  <span className="text-xs md:text-sm font-bold text-[#223047]">{alert.time}</span>
                </div>
                <h3 className="text-sm md:text-base font-bold text-[#223047] mb-1">{alert.service}</h3>
                <div className="flex flex-wrap items-center gap-3 md:gap-6 text-xs md:text-sm text-[#223047] opacity-70">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Capacity: {alert.capacity}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{alert.queued} queued</span>
                  </div>
                  <div className="flex items-center gap-2 hidden md:flex">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{alert.action}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 self-start md:self-auto">
                <Button
                  onClick={() => handleResolveAlert(alert.time)}
                  className="bg-[#3AE4FA] hover:bg-[#5CE1E6] text-xs md:text-sm"
                  size="sm"
                >
                  Resolve
                </Button>
                <Button variant="outline" className="border-[#FFD9EC] text-xs md:text-sm" size="sm">
                  Snooze
                </Button>
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
    </div>
  );
}