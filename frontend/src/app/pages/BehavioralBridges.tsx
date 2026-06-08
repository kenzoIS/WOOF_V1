import { Network, Sliders } from "lucide-react";
import { useState } from "react";

export function BehavioralBridges() {
  const [supportThreshold, setSupportThreshold] = useState(0.6);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);
  const [timeValue, setTimeValue] = useState(15);

  // Format time based on slider value
  const formatTime = (hour: number) => {
    if (hour === 0) return "Tomorrow, 12:00 AM";
    if (hour < 12) return `Tomorrow, ${hour}:00 AM`;
    if (hour === 12) return "Tomorrow, 12:00 PM";
    return `Tomorrow, ${hour - 12}:00 PM`;
  };

  // Calculate time-based behavioral patterns
  const getTimeBasedData = (hour: number) => {
    const isEarlyMorning = hour >= 0 && hour < 8;
    const isMorning = hour >= 8 && hour < 12;
    const isAfternoon = hour >= 12 && hour < 17;
    const isEvening = hour >= 17 && hour < 24;

    let connections;
    if (isEarlyMorning) {
      connections = [
        { from: { x: 200, y: 110 }, to: { x: 400, y: 110 }, strength: 0.3 },
        { from: { x: 200, y: 110 }, to: { x: 600, y: 110 }, strength: 0.2 },
        { from: { x: 400, y: 110 }, to: { x: 600, y: 110 }, strength: 0.4 },
        { from: { x: 200, y: 110 }, to: { x: 300, y: 210 }, strength: 0.3 },
        { from: { x: 400, y: 110 }, to: { x: 300, y: 210 }, strength: 0.2 },
        { from: { x: 600, y: 110 }, to: { x: 500, y: 210 }, strength: 0.3 },
        { from: { x: 300, y: 210 }, to: { x: 500, y: 210 }, strength: 0.2 },
      ];
    } else if (isMorning) {
      connections = [
        { from: { x: 200, y: 110 }, to: { x: 400, y: 110 }, strength: 0.6 },
        { from: { x: 200, y: 110 }, to: { x: 600, y: 110 }, strength: 0.4 },
        { from: { x: 400, y: 110 }, to: { x: 600, y: 110 }, strength: 0.5 },
        { from: { x: 200, y: 110 }, to: { x: 300, y: 210 }, strength: 0.7 },
        { from: { x: 400, y: 110 }, to: { x: 300, y: 210 }, strength: 0.5 },
        { from: { x: 600, y: 110 }, to: { x: 500, y: 210 }, strength: 0.4 },
        { from: { x: 300, y: 210 }, to: { x: 500, y: 210 }, strength: 0.6 },
      ];
    } else if (isAfternoon) {
      connections = [
        { from: { x: 200, y: 110 }, to: { x: 400, y: 110 }, strength: 0.9 },
        { from: { x: 200, y: 110 }, to: { x: 600, y: 110 }, strength: 0.7 },
        { from: { x: 400, y: 110 }, to: { x: 600, y: 110 }, strength: 0.95 },
        { from: { x: 200, y: 110 }, to: { x: 300, y: 210 }, strength: 0.8 },
        { from: { x: 400, y: 110 }, to: { x: 300, y: 210 }, strength: 0.85 },
        { from: { x: 600, y: 110 }, to: { x: 500, y: 210 }, strength: 0.75 },
        { from: { x: 300, y: 210 }, to: { x: 500, y: 210 }, strength: 0.7 },
      ];
    } else {
      connections = [
        { from: { x: 200, y: 110 }, to: { x: 400, y: 110 }, strength: 0.5 },
        { from: { x: 200, y: 110 }, to: { x: 600, y: 110 }, strength: 0.8 },
        { from: { x: 400, y: 110 }, to: { x: 600, y: 110 }, strength: 0.6 },
        { from: { x: 200, y: 110 }, to: { x: 300, y: 210 }, strength: 0.4 },
        { from: { x: 400, y: 110 }, to: { x: 300, y: 210 }, strength: 0.5 },
        { from: { x: 600, y: 110 }, to: { x: 500, y: 210 }, strength: 0.7 },
        { from: { x: 300, y: 210 }, to: { x: 500, y: 210 }, strength: 0.8 },
      ];
    }

    let nodes;
    if (isEarlyMorning) {
      nodes = [
        { x: 200, y: 110, label: "Iced Latte", color: "#06b6d4", size: "small" },
        { x: 400, y: 110, label: "Full Grooming", color: "#a855f7", size: "small" },
        { x: 600, y: 110, label: "Pet Treats", color: "#ec4899", size: "small" },
        { x: 300, y: 210, label: "Premium Shampoo", color: "#3b82f6", size: "small" },
        { x: 500, y: 210, label: "Cappuccino", color: "#8b5cf6", size: "small" },
      ];
    } else if (isMorning) {
      nodes = [
        { x: 200, y: 110, label: "Iced Latte", color: "#06b6d4", size: "large" },
        { x: 400, y: 110, label: "Full Grooming", color: "#a855f7", size: "medium" },
        { x: 600, y: 110, label: "Pet Treats", color: "#ec4899", size: "medium" },
        { x: 300, y: 210, label: "Premium Shampoo", color: "#3b82f6", size: "medium" },
        { x: 500, y: 210, label: "Cappuccino", color: "#8b5cf6", size: "large" },
      ];
    } else if (isAfternoon) {
      nodes = [
        { x: 200, y: 110, label: "Iced Latte", color: "#06b6d4", size: "large" },
        { x: 400, y: 110, label: "Full Grooming", color: "#a855f7", size: "large" },
        { x: 600, y: 110, label: "Pet Treats", color: "#ec4899", size: "large" },
        { x: 300, y: 210, label: "Premium Shampoo", color: "#3b82f6", size: "large" },
        { x: 500, y: 210, label: "Cappuccino", color: "#8b5cf6", size: "large" },
      ];
    } else {
      nodes = [
        { x: 200, y: 110, label: "Iced Latte", color: "#06b6d4", size: "large" },
        { x: 400, y: 110, label: "Full Grooming", color: "#a855f7", size: "small" },
        { x: 600, y: 110, label: "Pet Treats", color: "#ec4899", size: "large" },
        { x: 300, y: 210, label: "Premium Shampoo", color: "#3b82f6", size: "small" },
        { x: 500, y: 210, label: "Cappuccino", color: "#8b5cf6", size: "large" },
      ];
    }

    let insights;
    if (isEarlyMorning) {
      insights = {
        topBundle: { product: "Early Bird Coffee", metric: "34% co-purchase" },
        emerging: { product: "Quick Treats", metric: "+12% this week" },
        crossSell: { product: "Minimal Activity", metric: "23% conversion" },
      };
    } else if (isMorning) {
      insights = {
        topBundle: { product: "Latte + Treat", metric: "67% co-purchase" },
        emerging: { product: "Grooming Rush", metric: "+32% this week" },
        crossSell: { product: "Café → Grooming", metric: "58% conversion" },
      };
    } else if (isAfternoon) {
      insights = {
        topBundle: { product: "Latte + Grooming", metric: "89% co-purchase" },
        emerging: { product: "Treats + Shampoo", metric: "+47% this week" },
        crossSell: { product: "Café → Grooming", metric: "72% conversion" },
      };
    } else {
      insights = {
        topBundle: { product: "Coffee + Treats", metric: "81% co-purchase" },
        emerging: { product: "Evening Beverages", metric: "+54% this week" },
        crossSell: { product: "Treats → Coffee", metric: "68% conversion" },
      };
    }

    return { connections, nodes, insights };
  };

  const { connections, nodes, insights } = getTimeBasedData(timeValue);

  const frequentItemsets = [
    { pair: "Coffee + Paw-dicure", support: "0.82", confidence: "0.91", lift: "2.4x" },
    { pair: "Latte + Full Grooming", support: "0.78", confidence: "0.89", lift: "2.2x" },
    { pair: "Pet Treats + Bath Service", support: "0.71", confidence: "0.84", lift: "1.9x" },
    { pair: "Cappuccino + Nail Trim", support: "0.68", confidence: "0.79", lift: "1.7x" },
    { pair: "Premium Shampoo + Coffee", support: "0.65", confidence: "0.76", lift: "1.6x" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Behavioral Bridges</h1>
        <p className="text-sm text-slate-600 mt-1">Customer behavior patterns and product affinity analysis</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main: Live Behavioral Web */}
        <div className="col-span-2">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-purple-500/30 rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-purple-500/20">
              <div className="flex items-center gap-3">
                <Network className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  Live Behavioral Web (FP-GROWTH AI)
                </h2>
                <div className="ml-auto flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                  <span className="text-xs text-cyan-400 uppercase tracking-wider">
                    Learning Active
                  </span>
                </div>
              </div>
            </div>

            {/* Neural Network Graph */}
            <div className="p-8">
              <div className="relative bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl border border-purple-500/30 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

                <svg
                  viewBox="0 0 800 300"
                  className="w-full h-auto relative z-10"
                  style={{ maxHeight: "300px" }}
                >
                  <defs>
                    <filter id="glow-node">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>

                    <pattern id="grid-small" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(139, 92, 246, 0.08)" strokeWidth="0.5" />
                    </pattern>

                    <linearGradient key="lineGradient-gradient" id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>

                  <rect width="800" height="300" fill="url(#grid-small)" />

                  {/* Connection lines */}
                  {connections.map((conn, idx) => (
                    <g key={`connection-${idx}`}>
                      <line
                        x1={conn.from.x} y1={conn.from.y}
                        x2={conn.to.x} y2={conn.to.y}
                        stroke="url(#lineGradient)"
                        strokeWidth={conn.strength * 3}
                        opacity={conn.strength * 0.4}
                        className="animate-pulse"
                        style={{ animationDelay: `${idx * 0.3}s`, animationDuration: "3s" }}
                      />
                      <line
                        x1={conn.from.x} y1={conn.from.y}
                        x2={conn.to.x} y2={conn.to.y}
                        stroke="#8b5cf6"
                        strokeWidth="1"
                        opacity={conn.strength * 0.2}
                      />
                    </g>
                  ))}

                  {/* Product nodes */}
                  {nodes.map((node, idx) => (
                    <g key={`node-${idx}`}>
                      <circle
                        cx={node.x} cy={node.y}
                        r={node.size === "large" ? 35 : node.size === "medium" ? 28 : 22}
                        fill="none" stroke={node.color} strokeWidth="1" opacity="0.3"
                        className="animate-pulse"
                        style={{ animationDelay: `${idx * 0.2}s`, animationDuration: "2s" }}
                      />
                      <circle
                        cx={node.x} cy={node.y}
                        r={node.size === "large" ? 25 : node.size === "medium" ? 18 : 12}
                        fill={node.color} filter="url(#glow-node)" opacity="0.8"
                      />
                      <circle
                        cx={node.x} cy={node.y}
                        r={node.size === "large" ? 15 : node.size === "medium" ? 10 : 6}
                        fill="white" opacity="0.2"
                      />
                      <rect
                        x={node.x - 55}
                        y={node.y + (node.size === "large" ? 35 : node.size === "medium" ? 28 : 22)}
                        width="110" height="24"
                        fill="#0f172a" stroke={node.color} strokeWidth="1" rx="12" opacity="0.9"
                      />
                      <text
                        x={node.x}
                        y={node.y + (node.size === "large" ? 51 : node.size === "medium" ? 44 : 38)}
                        textAnchor="middle" fill={node.color}
                        style={{ fontSize: "12px", fontWeight: "600" }}
                        filter="url(#glow-node)"
                      >
                        {node.label}
                      </text>
                    </g>
                  ))}
                </svg>

                <div className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur-sm border border-purple-500/30 rounded-lg px-4 py-2">
                  <div className="text-xs text-slate-400 mb-2">Connection Strength</div>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-12 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full"></div>
                    <span className="text-xs text-slate-300">Weak → Strong</span>
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              <div className="mt-4 bg-slate-900/50 border border-purple-500/30 rounded-lg p-4">
                <div className="text-xs text-cyan-400 uppercase tracking-wider mb-2">
                  AI-Detected Patterns
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-950/50 border border-cyan-500/30 rounded-lg p-3">
                    <div className="text-slate-400 mb-1">Top Bundle</div>
                    <div className="text-white font-medium">{insights.topBundle.product}</div>
                    <div className="text-cyan-400 mt-1">{insights.topBundle.metric}</div>
                  </div>
                  <div className="bg-slate-950/50 border border-purple-500/30 rounded-lg p-3">
                    <div className="text-slate-400 mb-1">Emerging Trend</div>
                    <div className="text-white font-medium">{insights.emerging.product}</div>
                    <div className="text-purple-400 mt-1">{insights.emerging.metric}</div>
                  </div>
                  <div className="bg-slate-950/50 border border-pink-500/30 rounded-lg p-3">
                    <div className="text-slate-400 mb-1">Cross-Sell Opp.</div>
                    <div className="text-white font-medium">{insights.crossSell.product}</div>
                    <div className="text-pink-400 mt-1">{insights.crossSell.metric}</div>
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
                    type="range" min="7" max="19"
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Threshold Controls */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900">Threshold Controls</h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-slate-700">Support</label>
                  <span className="text-sm font-medium text-blue-600">{supportThreshold.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={supportThreshold}
                  onChange={(e) => setSupportThreshold(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-slate-700">Confidence</label>
                  <span className="text-sm font-medium text-blue-600">{confidenceThreshold.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-4">
              Adjust thresholds to filter association rules
            </p>
          </div>

          {/* Frequent Itemsets */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="font-semibold text-slate-900">Frequent Itemsets</h3>
              <p className="text-xs text-slate-600 mt-1">FP-Growth high-affinity pairs</p>
            </div>

            <div className="space-y-3">
              {frequentItemsets.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-medium text-sm text-slate-900 mb-2">{item.pair}</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-slate-500">Support</div>
                      <div className="font-medium text-slate-700">{item.support}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Conf.</div>
                      <div className="font-medium text-slate-700">{item.confidence}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Lift</div>
                      <div className="font-medium text-blue-600">{item.lift}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
