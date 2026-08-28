import { useState, useEffect, useMemo } from "react";
import { TrendingUp, Users, DollarSign } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getDashboard, getForecast, getRetailForecastByChannel } from "../lib/api";

export function ExecutiveOverview() {
  const [cafeData, setCafeData] = useState<any>(null);
  const [servicesData, setServicesData] = useState<any>(null);
  const [retailData, setRetailData] = useState<any>(null);
  const [cafeForecast, setCafeForecast] = useState<any>(null);
  const [servicesForecast, setServicesForecast] = useState<any>(null);
  const [retailForecast, setRetailForecast] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
    Promise.allSettled([
      getDashboard("cafe").then(setCafeData).catch(() => {}),
      getDashboard("services").then(setServicesData).catch(() => {}),
      getDashboard("retail").then(setRetailData).catch(() => {}),
      getForecast("cafe", { compact: "true" })
        .then(setCafeForecast)
        .catch(() => {}),
      getForecast("services", { compact: "true" })
        .then(setServicesForecast)
        .catch(() => {}),
      getRetailForecastByChannel().then(setRetailForecast).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [realtimeRefresh]);

  // Sum KPIs across all sectors
  const totalRevenue = useMemo(
    () =>
      (cafeData?.kpis?.totalRevenue || 0) +
      (servicesData?.kpis?.totalRevenue || 0) +
      (retailData?.kpis?.totalRevenue || 0),
    [cafeData, servicesData, retailData],
  );

  const totalOrders = useMemo(
    () =>
      (cafeData?.kpis?.totalOrders || 0) +
      (servicesData?.kpis?.totalOrders || 0) +
      (retailData?.kpis?.totalOrders || 0),
    [cafeData, servicesData, retailData],
  );

  // Build yearly revenue chart from historical data
  const revenueData = useMemo(() => {
    const yearMap: Record<
      string,
      { cafe: number; services: number; retail: number }
    > = {};

    const addRevenue = (
      historicals: any[],
      sector: "cafe" | "services" | "retail",
    ) => {
      (historicals || []).forEach((point: any) => {
        const year = String(point.date || "").slice(0, 4);
        if (!year || year.length !== 4 || isNaN(Number(year))) return;
        if (!yearMap[year])
          yearMap[year] = { cafe: 0, services: 0, retail: 0 };
        yearMap[year][sector] += Number(point.revenue || point.actual || 0);
      });
    };

    addRevenue(cafeForecast?.historical || [], "cafe");
    addRevenue(servicesForecast?.historical || [], "services");

    // Retail: merge physical + online historical
    const physHistory = retailForecast?.physical?.historical || [];
    const onlineHistory = retailForecast?.online?.historical || [];
    [...physHistory, ...onlineHistory].forEach((point: any) => {
      const year = String(point.date || "").slice(0, 4);
      if (!year || year.length !== 4 || isNaN(Number(year))) return;
      if (!yearMap[year])
        yearMap[year] = { cafe: 0, services: 0, retail: 0 };
      yearMap[year].retail += Number(point.revenue || 0);
    });

    return Object.entries(yearMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, vals]) => ({
        year,
        Cafe: Math.round(vals.cafe),
        Services: Math.round(vals.services),
        Retail: Math.round(vals.retail),
      }));
  }, [cafeForecast, servicesForecast, retailForecast]);

  // Top services from live dashboard data
  const topServices = useMemo(() => {
    const items: any[] = servicesData?.topItems || [];
    return items.slice(0, 5).map((item: any) => ({
      service: item.name,
      revenue: `₱${Number(item.revenue || 0).toLocaleString()}`,
      orders: Number(item.orderCount || item.quantity || 0).toLocaleString(),
    }));
  }, [servicesData]);

  const metrics = [
    {
      title: "Total Revenue (All Sectors)",
      value: `₱${totalRevenue.toLocaleString()}`,
      subtitle: "Cafe + Services + Retail combined",
      icon: DollarSign,
      colorBg: "bg-blue-100",
      colorIcon: "text-blue-600",
    },
    {
      title: "Total Transactions",
      value: totalOrders.toLocaleString(),
      subtitle: "Across all channels",
      icon: Users,
      colorBg: "bg-teal-100",
      colorIcon: "text-teal-600",
    },
    {
      title: "Active SKUs (Retail)",
      value: String(retailData?.topItems?.length || 0),
      subtitle: "Retail product catalog",
      icon: TrendingUp,
      colorBg: "bg-purple-100",
      colorIcon: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Enterprise Health Monitor
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Comprehensive performance overview across all business sectors
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-6">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-lg ${metric.colorBg} flex items-center justify-center`}
              >
                <metric.icon className={`w-6 h-6 ${metric.colorIcon}`} />
              </div>
            </div>
            <h3 className="text-sm text-slate-600 mb-1">{metric.title}</h3>
            {loading ? (
              <div className="h-9 bg-slate-200 rounded animate-pulse w-2/3 mb-2" />
            ) : (
              <p className="text-3xl font-bold text-slate-900 mb-1">
                {metric.value}
              </p>
            )}
            <p className="text-xs text-slate-500">{metric.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Revenue Contributions Area Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Revenue Contributions by Sector
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Historical performance by year from ingested transaction data
          </p>
        </div>

        <div className="h-80">
          {loading ? (
            <div className="h-full bg-slate-100 rounded-xl animate-pulse" />
          ) : revenueData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              No historical data available. Upload transaction CSV files to
              populate this chart.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient
                    id="colorCafe"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop
                      offset="95%"
                      stopColor="#3b82f6"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="colorRetail"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop
                      offset="95%"
                      stopColor="#14b8a6"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="colorServices"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop
                      offset="95%"
                      stopColor="#a855f7"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" stroke="#64748b" />
                <YAxis
                  stroke="#64748b"
                  tickFormatter={(v) =>
                    `₱${Number(v).toLocaleString()}`
                  }
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `₱${Number(value).toLocaleString()}`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="Cafe"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="url(#colorCafe)"
                />
                <Area
                  type="monotone"
                  dataKey="Retail"
                  stackId="1"
                  stroke="#14b8a6"
                  fill="url(#colorRetail)"
                />
                <Area
                  type="monotone"
                  dataKey="Services"
                  stackId="1"
                  stroke="#a855f7"
                  fill="url(#colorServices)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Services Table — live from dashboard/services */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Top Services by Revenue
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Highest-performing service offerings from transaction history
          </p>
        </div>

        <div className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Service
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Orders
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-200 rounded animate-pulse w-1/4" />
                    </td>
                  </tr>
                ))
              ) : topServices.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="py-8 text-center text-sm text-slate-400"
                  >
                    No services data available. Upload services transaction
                    data to populate this table.
                  </td>
                </tr>
              ) : (
                topServices.map((service: any, idx: number) => (
                  <tr
                    key={idx}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-4 px-4 text-sm text-slate-900">
                      {service.service}
                    </td>
                    <td className="py-4 px-4 text-sm font-medium text-slate-900">
                      {service.revenue}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600">
                      {service.orders}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
