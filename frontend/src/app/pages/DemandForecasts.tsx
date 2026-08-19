import { AlertTriangle, TrendingUp, Sparkles } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { ThreeZoneForecastChart, ThreeZonePoint, BacktestMetrics } from "../components/ThreeZoneForecastChart";
import { getForecast, ForecastRun } from "../lib/api";
import { SpatialMerchandisingPanel } from "../components/SpatialMerchandisingPanel";

export function DemandForecasts() {
  const [timeValue, setTimeValue] = useState(15); // 3:00 PM
  const [forecastSector, setForecastSector] = useState<'cafe' | 'services'>('cafe');
  const [forecastRun, setForecastRun] = useState<ForecastRun | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  useEffect(() => {
    setForecastLoading(true);
    setForecastRun(null);
    getForecast(forecastSector, { days: "90", splitRatio: "90-5-5" })
      .then(setForecastRun)
      .catch(console.error)
      .finally(() => setForecastLoading(false));
  }, [forecastSector]);

  const rawThreeZoneData = useMemo<ThreeZonePoint[]>(() => {
    if (!forecastRun?.historical?.length) return [];
    const rows: ThreeZonePoint[] = forecastRun.historical.map((d) => {
      const rev = Number(d.revenue) > 0 ? Number(d.revenue) : Number(d.actual) || 0;
      return {
        date: d.date,
        actual: rev,
        predicted: d.fitted != null ? d.fitted : null,
        forecast: null,
      };
    });
    if (forecastRun.forecast?.length) {
      for (const fp of forecastRun.forecast) {
        const rev = Number(fp.projectedNetSales) > 0 ? Number(fp.projectedNetSales) : Number(fp.forecast) || 0;
        rows.push({ date: fp.date, actual: null, predicted: null, forecast: rev });
      }
    }
    return rows;
  }, [forecastRun]);

  const academicSplitDate = useMemo(() => {
    if (!forecastRun?.historical?.length) return "2025-11-15";
    return forecastRun.historical[Math.floor(forecastRun.historical.length * 0.90) - 1]?.date ?? "2025-11-15";
  }, [forecastRun]);

  const academicForecastHorizon = useMemo(() => {
    if (!forecastRun?.historical?.length) return "2026-02-20";
    return forecastRun.historical[Math.floor(forecastRun.historical.length * 0.95) - 1]?.date ?? "2026-02-20";
  }, [forecastRun]);

  const academicMetrics = useMemo<BacktestMetrics | null>(() => {
    if (!forecastRun) return null;
    return {
      mae: forecastRun.mae ?? 0,
      rmse: forecastRun.rmse ?? 0,
      mape: forecastRun.mape ?? 0,
      mase: forecastRun.mase ?? 0,
      wape: (forecastRun as any).wape ?? 0,
      mpe: (forecastRun as any).mpe ?? 0,
    };
  }, [forecastRun]);

  const occupancyAlerts = [
    { time: "Tomorrow, 2:00 PM", capacity: "94%", risk: "high", services: "3 groomings queued" },
    { time: "Tomorrow, 3:00 PM", capacity: "92%", risk: "high", services: "2 groomings queued" },
    { time: "Tomorrow, 4:00 PM", capacity: "88%", risk: "medium", services: "2 groomings queued" },
    { time: "Wed, 11:00 AM", capacity: "91%", risk: "high", services: "4 groomings queued" },
  ];

  // Spatial merchandising recommendations
  const merchandisingRecs = [
    { pair: "Shampoo + Treats", strength: 0.89, color: "cyan" },
    { pair: "Coffee + Grooming", strength: 0.82, color: "purple" },
    { pair: "Latte + Nail Trim", strength: 0.76, color: "cyan" },
    { pair: "Treats + Bath Service", strength: 0.71, color: "purple" },
    { pair: "Premium Blend + Paw-dicure", strength: 0.68, color: "cyan" },
  ];

  // Format time based on slider value
  const formatTime = (hour: number) => {
    if (hour === 0) return "Tomorrow, 12:00 AM";
    if (hour < 12) return `Tomorrow, ${hour}:00 AM`;
    if (hour === 12) return "Tomorrow, 12:00 PM";
    return `Tomorrow, ${hour - 12}:00 PM`;
  };

  // Generate moderate balanced cluster of yellow dots for Grooming Area (left)
  const groomingDots = Array.from({ length: 18 }, (_, i) => ({
    x: 40 + (Math.random() * 300),
    y: 80 + (Math.random() * 240),
    delay: Math.random() * 2,
  }));

  // Generate moderate balanced cluster of yellow dots for Cafe Area (right)
  const cafeDots = Array.from({ length: 18 }, (_, i) => ({
    x: 440 + (Math.random() * 300),
    y: 80 + (Math.random() * 240),
    delay: Math.random() * 2,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Demand Forecasts</h1>
        <p className="text-sm text-slate-600 mt-1">Predictive analytics for operational planning</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main: Predictive Floorplan Simulator */}
        <div className="col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-purple-500/30 rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-purple-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-white tracking-tight">
                    Predictive Floorplan Simulator
                  </h2>
                </div>
              </div>
            </div>

            {/* Floorplan Content */}
            <div className="p-8">
              <div className="relative bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl border border-purple-500/30 overflow-hidden">
                {/* Ambient glow effects */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>

                <svg
                  viewBox="0 0 800 400"
                  className="w-full h-auto relative z-10"
                  style={{ maxHeight: "400px" }}
                >
                  {/* Grid Background */}
                  <defs>
                    <pattern
                      id="grid"
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke="rgba(139, 92, 246, 0.1)"
                        strokeWidth="0.5"
                      />
                    </pattern>

                    {/* Glow filters */}
                    <filter id="glow-yellow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>

                    <filter id="glow-purple">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>

                    {/* Gradients */}
                    <radialGradient id="yellowHeatmap" cx="50%" cy="50%">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.2" />
                      <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#d97706" stopOpacity="0.05" />
                    </radialGradient>

                    <linearGradient key="areaGradient-gradient" id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#1e293b" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>

                  {/* Grid overlay */}
                  <rect width="800" height="400" fill="url(#grid)" />

                  {/* GROOMING AREA (Left) */}
                  <g>
                    <rect
                      x="20" y="20" width="360" height="360"
                      fill="url(#areaGradient)"
                      stroke="#8b5cf6" strokeWidth="2" rx="8" opacity="0.6"
                    />
                    <rect
                      x="20" y="20" width="360" height="360"
                      fill="none" stroke="url(#glow-purple)" strokeWidth="1"
                      rx="8" filter="url(#glow-purple)" opacity="0.5"
                    />
                    <text
                      x="200" y="50" textAnchor="middle"
                      className="fill-cyan-400"
                      style={{ fontSize: "16px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase" }}
                      filter="url(#glow-purple)"
                    >
                      GROOMING AREA
                    </text>
                    <circle cx="200" cy="200" r="120" fill="url(#yellowHeatmap)" opacity="0.6" />
                    {groomingDots.map((dot, idx) => (
                      <g key={`grooming-${idx}`}>
                        <circle
                          cx={dot.x} cy={dot.y} r="4"
                          fill="#fbbf24" filter="url(#glow-yellow)" opacity="0.5"
                          className="animate-pulse"
                          style={{ animationDelay: `${dot.delay}s`, animationDuration: "2s" }}
                        />
                        <circle cx={dot.x} cy={dot.y} r="7" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.2" />
                      </g>
                    ))}
                    <rect x="60" y="100" width="70" height="55" fill="none" stroke="#475569" strokeWidth="1.5" rx="4" opacity="0.4" />
                    <rect x="150" y="100" width="70" height="55" fill="none" stroke="#475569" strokeWidth="1.5" rx="4" opacity="0.4" />
                    <rect x="240" y="100" width="70" height="55" fill="none" stroke="#475569" strokeWidth="1.5" rx="4" opacity="0.4" />
                    <rect x="60" y="180" width="70" height="55" fill="none" stroke="#475569" strokeWidth="1.5" rx="4" opacity="0.4" />
                    <rect x="150" y="180" width="70" height="55" fill="none" stroke="#475569" strokeWidth="1.5" rx="4" opacity="0.4" />
                    <rect x="240" y="180" width="70" height="55" fill="none" stroke="#475569" strokeWidth="1.5" rx="4" opacity="0.4" />
                  </g>

                  {/* Divider Line */}
                  <line x1="400" y1="20" x2="400" y2="380" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="8,4" opacity="0.5" />

                  {/* CAFE AREA (Right) */}
                  <g>
                    <rect
                      x="420" y="20" width="360" height="360"
                      fill="url(#areaGradient)"
                      stroke="#8b5cf6" strokeWidth="2" rx="8" opacity="0.6"
                    />
                    <rect
                      x="420" y="20" width="360" height="360"
                      fill="none" stroke="url(#glow-purple)" strokeWidth="1"
                      rx="8" filter="url(#glow-purple)" opacity="0.5"
                    />
                    <text
                      x="600" y="50" textAnchor="middle"
                      className="fill-cyan-400"
                      style={{ fontSize: "16px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase" }}
                      filter="url(#glow-purple)"
                    >
                      CAFE AREA
                    </text>
                    <circle cx="600" cy="200" r="120" fill="url(#yellowHeatmap)" opacity="0.6" />
                    {cafeDots.map((dot, idx) => (
                      <g key={`cafe-${idx}`}>
                        <circle
                          cx={dot.x} cy={dot.y} r="4"
                          fill="#fbbf24" filter="url(#glow-yellow)" opacity="0.5"
                          className="animate-pulse"
                          style={{ animationDelay: `${dot.delay}s`, animationDuration: "2s" }}
                        />
                        <circle cx={dot.x} cy={dot.y} r="7" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.2" />
                      </g>
                    ))}
                    <rect x="460" y="100" width="50" height="50" fill="none" stroke="#475569" strokeWidth="1.5" rx="4" opacity="0.4" />
                    <rect x="540" y="100" width="50" height="50" fill="none" stroke="#475569" strokeWidth="1.5" rx="4" opacity="0.4" />
                    <rect x="620" y="100" width="50" height="50" fill="none" stroke="#475569" strokeWidth="1.5" rx="4" opacity="0.4" />
                    <rect x="460" y="180" width="50" height="50" fill="none" stroke="#475569" strokeWidth="1.5" rx="4" opacity="0.4" />
                    <rect x="540" y="180" width="50" height="50" fill="none" stroke="#475569" strokeWidth="1.5" rx="4" opacity="0.4" />
                    <rect x="620" y="180" width="50" height="50" fill="none" stroke="#475569" strokeWidth="1.5" rx="4" opacity="0.4" />
                    <rect x="460" y="260" width="50" height="50" fill="none" stroke="#475569" strokeWidth="1.5" rx="4" opacity="0.4" />
                    <rect x="540" y="260" width="50" height="50" fill="none" stroke="#475569" strokeWidth="1.5" rx="4" opacity="0.4" />
                    <rect x="620" y="260" width="50" height="50" fill="none" stroke="#475569" strokeWidth="1.5" rx="4" opacity="0.4" />
                  </g>
                </svg>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 flex items-center gap-6 text-xs bg-slate-950/80 backdrop-blur-sm border border-purple-500/30 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></div>
                    <span className="text-slate-300">Predicted Activity</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Slider Controls */}
            <div className="p-8 pt-0">
              <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-purple-500/30 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-cyan-400 uppercase tracking-wider font-semibold">
                    Time Selection
                  </span>
                  <span className="text-base text-white font-medium px-4 py-1 bg-purple-500/20 border border-purple-500/40 rounded-lg">
                    {formatTime(timeValue)}
                  </span>
                </div>

                <div className="relative">
                  <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="absolute h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                      style={{ width: `${((timeValue - 7) / 12) * 100}%` }}
                    ></div>
                  </div>
                  <input
                    type="range"
                    min="7"
                    max="19"
                    value={timeValue}
                    onChange={(e) => setTimeValue(parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer z-10"
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full border-2 border-white shadow-[0_0_16px_rgba(139,92,246,0.8)] pointer-events-none transition-all duration-200"
                    style={{ left: `calc(${((timeValue - 7) / 12) * 100}% - 12px)` }}
                  >
                    <div className="absolute inset-0 rounded-full bg-white/20 animate-ping"></div>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-slate-500 mt-3 px-1">
                  <span>07:00</span>
                  <span>10:00</span>
                  <span>13:00</span>
                  <span>16:00</span>
                  <span>19:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Strategic Proximity Recommendations - Below Floorplan */}
          <SpatialMerchandisingPanel />
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          {/* Occupancy Risk Alerts */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-slate-900">Occupancy Risk Alerts</h3>
            </div>

            <div className="space-y-3">
              {occupancyAlerts.map((alert, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-lg border ${
                    alert.risk === "high" 
                      ? "bg-red-50 border-red-200" 
                      : "bg-orange-50 border-orange-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs font-medium text-slate-700">{alert.time}</p>
                    <span className={`text-xs font-bold ${
                      alert.risk === "high" ? "text-red-700" : "text-orange-700"
                    }`}>
                      {alert.capacity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{alert.services}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 90-5-5 Multi-Zone Evaluation Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900 text-sm">90-5-5 Multi-Zone Time Series Evaluation</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setForecastSector('cafe')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    forecastSector === 'cafe'
                      ? 'bg-[#F53799] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Cafe
                </button>
                <button
                  onClick={() => setForecastSector('services')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    forecastSector === 'services'
                      ? 'bg-[#06B6D4] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Services
                </button>
              </div>
            </div>

            {forecastLoading ? (
              <div className="flex items-center justify-center h-48 text-sm text-slate-500">
                <span className="animate-pulse">Loading live multi-zone data…</span>
              </div>
            ) : rawThreeZoneData.length > 0 ? (
              <ThreeZoneForecastChart
                rawData={rawThreeZoneData}
                initialSplitDate={academicSplitDate}
                initialForecastHorizon={academicForecastHorizon}
                metrics={academicMetrics}
                modelName={forecastRun?.modelName ?? (forecastSector === 'cafe' ? 'Prophet' : 'SARIMAX')}
                sector={forecastSector === 'cafe' ? 'Cafe' : 'Services'}
                currencyPrefix="₱"
                themeColor={forecastSector === 'cafe' ? '#F53799' : '#06B6D4'}
              />
            ) : (
              <div className="flex items-center justify-center h-48 text-sm text-slate-500">
                No data available. Upload {forecastSector === 'cafe' ? 'Cafe' : 'Services'} history to view forecast.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}