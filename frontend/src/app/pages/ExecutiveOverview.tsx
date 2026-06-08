import { TrendingUp, Users, DollarSign, ArrowUp, ArrowDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function ExecutiveOverview() {
  // Mock data for revenue trends
  const revenueData = [
    { year: "2021", cafe: 45000, retail: 32000, services: 28000 },
    { year: "2022", cafe: 52000, retail: 38000, services: 35000 },
    { year: "2023", cafe: 61000, retail: 45000, services: 42000 },
    { year: "2024", cafe: 70000, retail: 52000, services: 51000 },
    { year: "2025", cafe: 82000, retail: 61000, services: 63000 },
  ];

  const topServices = [
    { service: "Full Grooming Package", margin: "68%", revenue: "₱45,230", trend: "+12%" },
    { service: "Paw-dicure + Nail Trim", margin: "62%", revenue: "₱32,150", trend: "+8%" },
    { service: "Premium Bath & Blowout", margin: "58%", revenue: "₱28,940", trend: "+15%" },
    { service: "Teeth Cleaning Service", margin: "71%", revenue: "₱18,560", trend: "+5%" },
    { service: "De-shedding Treatment", margin: "54%", revenue: "₱15,780", trend: "-3%" },
  ];

  const metrics = [
    {
      title: "Total Revenue",
      value: "₱206,000",
      change: "+18.5%",
      trend: "up",
      subtitle: "5-Year Trend",
      icon: DollarSign,
      color: "blue"
    },
    {
      title: "Multi-Sector Foot Traffic",
      value: "3,842",
      change: "+12.3%",
      trend: "up",
      subtitle: "Monthly Visitors",
      icon: Users,
      color: "teal"
    },
    {
      title: "Active Unique Customers",
      value: "1,256",
      change: "+8.7%",
      trend: "up",
      subtitle: "Repeat Rate: 64%",
      icon: TrendingUp,
      color: "purple"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Enterprise Health Monitor</h1>
        <p className="text-sm text-slate-600 mt-1">Comprehensive performance overview across all business sectors</p>
      </div>

      {/* Large Metric Cards */}
      <div className="grid grid-cols-3 gap-6">
        {metrics.map((metric, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg bg-${metric.color}-100 flex items-center justify-center`}>
                <metric.icon className={`w-6 h-6 text-${metric.color}-600`} />
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                metric.trend === "up" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {metric.trend === "up" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                <span className="text-xs font-medium">{metric.change}</span>
              </div>
            </div>
            <h3 className="text-sm text-slate-600 mb-1">{metric.title}</h3>
            <p className="text-3xl font-bold text-slate-900 mb-1">{metric.value}</p>
            <p className="text-xs text-slate-500">{metric.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Main Chart - Revenue Contributions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Revenue Contributions by Sector</h2>
          <p className="text-sm text-slate-600 mt-1">5-year historical performance analysis</p>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient key="colorCafe-gradient" id="colorCafe" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient key="colorRetail-gradient" id="colorRetail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient key="colorServices-gradient" id="colorServices" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="cafe" 
                stackId="1" 
                stroke="#3b82f6" 
                fill="url(#colorCafe)" 
                name="Cafe"
              />
              <Area 
                type="monotone" 
                dataKey="retail" 
                stackId="1" 
                stroke="#14b8a6" 
                fill="url(#colorRetail)" 
                name="Retail"
              />
              <Area 
                type="monotone" 
                dataKey="services" 
                stackId="1" 
                stroke="#a855f7" 
                fill="url(#colorServices)" 
                name="Services"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 5 Services Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Top 5 Services by Margin</h2>
          <p className="text-sm text-slate-600 mt-1">Highest performing service offerings</p>
        </div>

        <div className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-600 uppercase tracking-wider">Service</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-600 uppercase tracking-wider">Margin</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-600 uppercase tracking-wider">Revenue</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-600 uppercase tracking-wider">Trend</th>
              </tr>
            </thead>
            <tbody>
              {topServices.map((service, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 text-sm text-slate-900">{service.service}</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {service.margin}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm font-medium text-slate-900">{service.revenue}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                      service.trend.startsWith("+") ? "text-green-600" : "text-red-600"
                    }`}>
                      {service.trend.startsWith("+") ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      {service.trend}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
