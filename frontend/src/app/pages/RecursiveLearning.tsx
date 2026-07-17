import { RefreshCcw, Activity, CheckCircle, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { SynergyLiftTracker } from "../components/SynergyLiftTracker";

export function RecursiveLearning() {
  // Synergy Lift data
  const synergyData = [
    { trigger: "Happy Hour", cafeRevenue: 8420, serviceRevenue: 12340, lift: "+147%" },
    { trigger: "Morning Rush", cafeRevenue: 6850, serviceRevenue: 9280, lift: "+135%" },
    { trigger: "Weekend Pkg", cafeRevenue: 12560, serviceRevenue: 18920, lift: "+151%" },
    { trigger: "Treat Upsell", cafeRevenue: 4230, serviceRevenue: 5680, lift: "+134%" },
  ];

  // Model reliability over time
  const reliabilityData = [
    { week: "Week 1", prophet: 8.2, xgboost: 6.5 },
    { week: "Week 2", prophet: 7.8, xgboost: 6.1 },
    { week: "Week 3", prophet: 7.2, xgboost: 5.8 },
    { week: "Week 4", prophet: 6.8, xgboost: 5.2 },
    { week: "Week 5", prophet: 6.3, xgboost: 4.9 },
    { week: "Week 6", prophet: 5.9, xgboost: 4.5 },
  ];

  const retrainingEvents = [
    {
      timestamp: "2 hours ago",
      model: "XGBoost Revenue Predictor",
      dataPoints: "2,847 new transactions",
      improvement: "sMAPE reduced by 0.4%",
      status: "success"
    },
    {
      timestamp: "6 hours ago",
      model: "FP-Growth Association Rules",
      dataPoints: "1,523 new purchase patterns",
      improvement: "15 new high-confidence rules discovered",
      status: "success"
    },
    {
      timestamp: "12 hours ago",
      model: "Prophet Demand Forecaster",
      dataPoints: "168 hourly observations",
      improvement: "Seasonal component refined",
      status: "success"
    },
    {
      timestamp: "1 day ago",
      model: "Capacity Optimizer",
      dataPoints: "892 grooming appointments",
      improvement: "Peak hour detection improved",
      status: "success"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Self-Refinement Loop</h1>
        <p className="text-sm text-slate-600 mt-1">Continuous learning and autonomous model improvement</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">4</div>
          </div>
          <div className="text-sm text-slate-600">Models Active</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">5.1%</div>
          </div>
          <div className="text-sm text-slate-600">Avg sMAPE</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <RefreshCcw className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">6h</div>
          </div>
          <div className="text-sm text-slate-600">Retrain Interval</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">4.2h</div>
          </div>
          <div className="text-sm text-slate-600">Next Cycle</div>
        </div>
      </div>

      {/* Synergy Lift Tracker */}
      <SynergyLiftTracker />

      <div className="grid grid-cols-2 gap-6">
        {/* Model Reliability */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Model Reliability (sMAPE %)</h2>
            <p className="text-sm text-slate-600 mt-1">Lower is better • 6-week improvement trend</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reliabilityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" stroke="#64748b" />
                <YAxis stroke="#64748b" label={{ value: 'sMAPE %', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="prophet" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  name="Prophet"
                />
                <Line 
                  type="monotone" 
                  dataKey="xgboost" 
                  stroke="#14b8a6" 
                  strokeWidth={2}
                  dot={{ fill: '#14b8a6', r: 4 }}
                  name="XGBoost"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs text-slate-600 mb-1">Prophet sMAPE</div>
              <div className="text-2xl font-bold text-blue-600">5.9%</div>
              <div className="text-xs text-green-600 mt-1">↓ 2.3% from Week 1</div>
            </div>
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
              <div className="text-xs text-slate-600 mb-1">XGBoost sMAPE</div>
              <div className="text-2xl font-bold text-teal-600">4.5%</div>
              <div className="text-xs text-green-600 mt-1">↓ 2.0% from Week 1</div>
            </div>
          </div>
        </div>

        {/* System Log */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Autonomous Retraining Events</h2>
            <p className="text-sm text-slate-600 mt-1">Recent model updates and improvements</p>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {retrainingEvents.map((event, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-slate-900">{event.model}</span>
                  </div>
                  <span className="text-xs text-slate-500">{event.timestamp}</span>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="text-xs">📊</span>
                    <span>{event.dataPoints}</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-700">
                    <span className="text-xs">✓</span>
                    <span>{event.improvement}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCcw className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-slate-900">Next Scheduled Retrain</span>
            </div>
            <div className="text-2xl font-bold text-purple-600 mb-1">4 hours 12 minutes</div>
            <div className="text-xs text-slate-600">
              All models will be updated with latest transaction data
            </div>
          </div>
        </div>
      </div>

      {/* System Performance Summary */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-slate-400 mb-2">System Uptime</div>
            <div className="text-3xl font-bold text-white mb-1">99.8%</div>
            <div className="text-xs text-green-400">All systems operational</div>
          </div>
          <div>
            <div className="text-sm text-slate-400 mb-2">Total Training Cycles</div>
            <div className="text-3xl font-bold text-white mb-1">1,247</div>
            <div className="text-xs text-blue-400">Since system launch</div>
          </div>
          <div>
            <div className="text-sm text-slate-400 mb-2">Data Points Processed</div>
            <div className="text-3xl font-bold text-white mb-1">2.8M</div>
            <div className="text-xs text-purple-400">Last 30 days</div>
          </div>
        </div>
      </div>
    </div>
  );
}
