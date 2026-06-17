import React, { useState, useMemo, useEffect } from "react";
import { DollarSign, TrendingUp, Package, AlertCircle, Target } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ErrorModal, ErrorType } from "../components/ErrorModal";
import { SuccessModal, SuccessType } from "../components/SuccessModal";
import { getDashboard, getForecast, getRetailForecastByChannel } from "../lib/api";
import retailMascot from "../../imports/no_bg_Retail.png";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
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

const inventoryItems = [
  { sku: "DOG-001", name: "Premium Dog Food 5kg", stock: 12, reorderPoint: 20, daysToExpiry: 45, velocity: "High", predictedStockout: 6, price: 1250, channel: "Both" },
  { sku: "CAT-002", name: "Cat Litter Premium 10L", stock: 28, reorderPoint: 15, daysToExpiry: 120, velocity: "Medium", predictedStockout: 14, price: 850, channel: "Physical" },
  { sku: "TOY-003", name: "Interactive Pet Toy", stock: 5, reorderPoint: 10, daysToExpiry: null, velocity: "Low", predictedStockout: 3, price: 450, channel: "Online" },
  { sku: "ACC-004", name: "Pet Collar Deluxe", stock: 34, reorderPoint: 12, daysToExpiry: null, velocity: "High", predictedStockout: 18, price: 320, channel: "Both" },
  { sku: "DOG-005", name: "Dental Chew Treats", stock: 8, reorderPoint: 25, daysToExpiry: 18, velocity: "High", predictedStockout: 4, price: 180, channel: "Physical" },
];

const spoilageRiskItems = [
  { name: "Premium Dog Food 5kg", daysLeft: 6, currentStock: 12, dailyVelocity: 2, spoilageRisk: 95, recommendedDiscount: 25 },
  { name: "Dental Chew Treats", daysLeft: 18, currentStock: 8, dailyVelocity: 1.2, spoilageRisk: 68, recommendedDiscount: 15 },
  { name: "Cat Treats Salmon", daysLeft: 22, currentStock: 15, dailyVelocity: 2.1, spoilageRisk: 45, recommendedDiscount: 10 },
];

const channelPerformance = [
  { category: "Pet Food", physical: 45200, shopee: 28400, tiktok: 18900 },
  { category: "Accessories", physical: 32100, shopee: 41200, tiktok: 29800 },
  { category: "Toys", physical: 18400, shopee: 32600, tiktok: 24100 },
  { category: "Grooming", physical: 28900, shopee: 15300, tiktok: 11800 },
];

// Fallback data for velocity / forecast

const retailSentimentData = [
  { name: "Positive", value: 72, color: "#3AE4FA" },
  { name: "Neutral", value: 18, color: "#CCCCCC" },
  { name: "Negative", value: 10, color: "#F53799" },
];

const flaggedRetailReviews = [
  {
    platform: "Shopee",
    text: "Product arrived with missing accessories and the listing description was misleading.",
    date: "Apr 14, 2026",
    product: "Premium Dog Food 5kg",
    keywords: ["missing", "misleading"],
  },
  {
    platform: "Physical Store",
    text: "Shelf label was incorrect and the cashier gave conflicting pricing information.",
    date: "Apr 13, 2026",
    product: "Cat Litter Premium 10L",
    keywords: ["incorrect", "conflicting"],
  },
  {
    platform: "Tiktok",
    text: "Packaging felt cheap and the purchase experience was slower than expected.",
    date: "Apr 12, 2026",
    product: "Pet Collar Deluxe",
    keywords: ["cheap", "slower"],
  },
];

const formatChartDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });
};

export function Retail() {
  const [filterVelocity, setFilterVelocity] = useState("all");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [expandedSKU, setExpandedSKU] = useState<string | null>(null);
  const [discountSlider, setDiscountSlider] = useState([25]);
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [keywords, setKeywords] = useState(["missing", "misleading", "incorrect", "slow", "damaged"]);
  const [newKeyword, setNewKeyword] = useState("");
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; type: ErrorType | null }>({
    isOpen: false,
    type: null,
  });
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; type: SuccessType | null }>({
    isOpen: false,
    type: null,
  });
  const [reorderAttempts, setReorderAttempts] = useState(0);

  // API data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [channelForecast, setChannelForecast] = useState<any>(null);
  const [forecastApiData, setForecastApiData] = useState<any>(null);

  useEffect(() => {
    getDashboard("retail").then(setDashboardData).catch(() => {});
    getRetailForecastByChannel().then(setChannelForecast).catch(() => {});
    getForecast("retail").then(setForecastApiData).catch(() => {});
  }, []);

  const forecastData = useMemo(() => {
    const phys = channelForecast?.physical?.historical || [];
    const online = channelForecast?.online?.historical || [];
    if (phys.length === 0 && online.length === 0) return [];

    // Merge both series by date into a single array
    const dateMap: Record<string, { physical: number | null; online: number | null; forecast: number | null }> = {};
    phys.forEach((d: any) => {
      if (!dateMap[d.date]) dateMap[d.date] = { physical: null, online: null, forecast: null };
      dateMap[d.date].physical = d.revenue;
    });
    online.forEach((d: any) => {
      if (!dateMap[d.date]) dateMap[d.date] = { physical: null, online: null, forecast: null };
      dateMap[d.date].online = d.revenue;
    });

    // Add forecast data (combined retail forecast, dashed line)
    const forecastItems = forecastApiData?.forecast || [];
    forecastItems.forEach((d: any) => {
      if (!dateMap[d.date]) dateMap[d.date] = { physical: null, online: null, forecast: null };
      dateMap[d.date].forecast = d.forecast;
    });

    // Bridge: set forecast start value to the last day's total revenue
    const historicalDates = Object.keys(dateMap).filter(date => {
      const v = dateMap[date];
      return v.physical !== null || v.online !== null;
    }).sort();
    if (historicalDates.length > 0 && forecastItems.length > 0) {
      const lastHistDate = historicalDates[historicalDates.length - 1];
      const lastPhys = dateMap[lastHistDate].physical || 0;
      const lastOnline = dateMap[lastHistDate].online || 0;
      dateMap[lastHistDate].forecast = lastPhys + lastOnline;
    }

    const sorted = Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({ day: date, ...vals }));

    return sorted.slice(-45);
  }, [channelForecast, forecastApiData]);

  const kpis = dashboardData?.kpis || {};
  const retailRevenue = kpis.totalRevenue ? `₱${kpis.totalRevenue.toLocaleString()}` : "₱0";
  const activeSKUs = dashboardData?.topItems?.length || 0;

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleReorderNow = (sku: string, name: string) => {
    // Simulate rate limiting after 3 attempts
    if (reorderAttempts >= 3) {
      setErrorModal({ isOpen: true, type: "rate_limit" });
      return;
    }

    // Simulate payment failure for DOG-005
    if (sku === "DOG-005") {
      setErrorModal({ isOpen: true, type: "payment_failed" });
      setReorderAttempts(prev => prev + 1);
      return;
    }

    setReorderAttempts(prev => prev + 1);
    toast.success("Reorder initiated", {
      description: `Purchase order created for ${name}`,
    });
  };

  const handleActivateDiscount = (name: string, discount: number) => {
    // Simulate data corruption for the first item
    if (name === "Premium Dog Food 5kg") {
      setErrorModal({ isOpen: true, type: "data_corruption" });
      return;
    }

    toast.success("Flash sale activated!", {
      description: `${discount}% discount applied to ${name}`,
    });
  };

  const handleContactSupport = () => {
    toast.success("Support ticket created. Our team will contact you within 24 hours.");
    window.open("mailto:support@woofai.com?subject=Data Corruption Issue - Retail&body=I need assistance with a data integrity issue in my Retail dashboard.", "_blank");
  };

  const handleRetryPayment = () => {
    setErrorModal({ isOpen: false, type: null });
    toast.info("Retrying payment with alternative method...");
    setTimeout(() => {
      setSuccessModal({ isOpen: true, type: "payment_success" });
    }, 1500);
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword("");
      toast.success("Keyword added");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
    toast.info("Keyword removed");
  };

  const getVelocityColor = (velocity: string) => {
    if (velocity === "High") return "bg-green-500";
    if (velocity === "Medium") return "bg-yellow-500";
    return "bg-red-500";
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 80) return "text-red-600";
    if (risk >= 50) return "text-orange-600";
    return "text-yellow-600";
  };

  const filteredInventoryItems = useMemo(() => {
    if (filterVelocity === "all") return inventoryItems;
    if (filterVelocity === "critical") return inventoryItems.filter(item => item.stock < item.reorderPoint);
    return inventoryItems.filter(item => item.velocity.toLowerCase() === filterVelocity);
  }, [filterVelocity]);

  return (
    <div className="space-y-6 md:space-y-8 lg:space-y-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-3 md:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl lg:text-[36px] font-extrabold text-[#223047]">
            Retail Intelligence Center
          </h1>
          <p className="text-sm md:text-base text-[#223047] opacity-60 mt-1 md:mt-2" style={{ lineHeight: "1.6" }}>
            Inventory management, spoilage prevention, and omnichannel performance tracking
          </p>
        </div>
        <Badge className="bg-[#D42A7D] text-white hover:bg-[#D42A7D] px-3 md:px-4 py-1 text-xs md:text-sm flex-shrink-0">
          Retail Sector
        </Badge>
      </div>

      {/* KPI ROW */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Retail Revenue Today */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#F53799] to-[#D42A7D] flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Historical Retail Revenue</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{retailRevenue}</div>
              <div className="text-xs text-green-600 font-medium hidden md:block">+5.2% ↑</div>
            </div>
          </div>

          {/* Active SKUs */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#3AE4FA] to-[#5CE1E6] flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Active SKUs</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{activeSKUs}</div>
            </div>
          </div>

          {/* Stockout Alerts */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#3AE4FA] to-[#5CE1E6] flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Stockout Alerts</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">5</div>
              <Button size="sm" className="bg-[#D42A7D] hover:bg-[#F53799] text-white h-6 md:h-7 text-xs mt-1 px-2 md:px-3 hidden md:inline-flex">
                Review
              </Button>
            </div>
          </div>

          {/* Spoilage Risk Items */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#3AE4FA] to-[#5CE1E6] flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Spoilage Risk</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">3</div>
              <Button size="sm" className="bg-[#D42A7D] hover:bg-[#F53799] text-white h-6 md:h-7 text-xs mt-1 px-2 md:px-3 hidden md:inline-flex">
                Take Action
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* RETAIL REVENUE BY CHANNEL */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div>
          <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
            Retail Revenue by Channel
          </h2>
          <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
            Physical POS and online channel history with the active Retail forecast overlay
          </p>
        </div>

        <ResponsiveContainer width="100%" height={280} className="md:!h-[360px]">
          <LineChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#FFD9EC" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#223047"
              tickFormatter={formatChartDate}
              minTickGap={28}
              interval="preserveStartEnd"
              style={{ fontSize: "10px" }}
            />
            <YAxis stroke="#223047" style={{ fontSize: "10px" }} />
            <Tooltip
              labelFormatter={(label) => formatChartDate(String(label))}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #FFD9EC",
                borderRadius: "12px",
              }}
            />
            <Line
              key="line-physical-wide"
              type="monotone"
              dataKey="physical"
              stroke="#D42A7D"
              strokeWidth={2.5}
              dot={false}
              animationDuration={800}
              name="Physical (POS)"
            />
            <Line
              key="line-online-wide"
              type="monotone"
              dataKey="online"
              stroke="#3AE4FA"
              strokeWidth={2.5}
              dot={false}
              animationDuration={800}
              name="Online (Shopee/TikTok)"
            />
            <Line
              key="line-forecast-wide"
              type="monotone"
              dataKey="forecast"
              stroke="#223047"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              animationDuration={800}
              name="Forecast"
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="flex flex-wrap justify-center gap-4 md:gap-6 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#D42A7D] rounded-full" />
            <span className="text-xs">Physical (POS)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#3AE4FA] rounded-full" />
            <span className="text-xs">Online (Shopee/TikTok)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 border-t-2 border-dashed border-[#223047]" style={{ width: "12px" }} />
            <span className="text-xs">Forecast</span>
          </div>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4">
        <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">Quick Stats</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: "Avg Daily Sales", value: "â‚±8,450", color: "#D42A7D" },
            { label: "Top Category", value: "Pet Food", color: "#F53799" },
            { label: "Online Share", value: "42%", color: "#5CE1E6" },
            { label: "Inventory Value", value: "â‚±2.1M", color: "#3AE4FA" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center justify-between p-3 md:p-4 bg-[#FFF2FA] rounded-lg">
              <span className="text-xs md:text-sm text-[#223047] opacity-70">{stat.label}</span>
              <span className="text-sm md:text-base font-bold text-[#223047]" style={{ color: stat.color }}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* VISUAL RELIEF DIVIDER - AI INSIGHT WITH MASCOT */}
      <div
        className="rounded-2xl flex items-center justify-between px-4 md:px-8 py-4 relative overflow-hidden"
        style={{ background: "linear-gradient(to right, #FFF7FB, #FFF2FA)" }}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              WOOF AI Insight
            </Badge>
          </div>
          <p className="text-sm md:text-base italic text-[#223047] opacity-70" style={{ lineHeight: "1.6" }}>
            "Premium Dog Food at critical spoilage risk (6 days left). Activate 25% flash sale to move 12 units and prevent ₱15,000 loss."
          </p>
        </div>
        <img
          src={retailMascot.src}
          alt="Retail Mascot"
          className="w-24 h-24 md:w-32 md:h-32 object-contain flex-shrink-0 ml-6"
        />
      </div>

      {/* INVENTORY HEALTH MONITOR */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
                Inventory Health Monitor
              </h2>
              <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
                Stock levels and predicted stockout dates
              </p>
            </div>
            <select
              value={filterVelocity}
              onChange={(e) => setFilterVelocity(e.target.value)}
              className="px-3 py-1.5 border border-[#FFD9EC] rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#D42A7D] w-full sm:w-auto"
            >
              <option value="all">All Items</option>
              <option value="high">High Velocity</option>
              <option value="medium">Medium Velocity</option>
              <option value="low">Low Velocity</option>
              <option value="critical">Critical Stock</option>
            </select>
          </div>

          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-[#FFF2FA] text-xs md:text-sm"
                  onClick={() => handleSort("name")}
                >
                  Product {sortColumn === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-[#FFF2FA] text-center text-xs md:text-sm"
                  onClick={() => handleSort("stock")}
                >
                  Stock {sortColumn === "stock" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="text-center text-xs md:text-sm hidden md:table-cell">Velocity</TableHead>
                <TableHead className="text-center text-xs md:text-sm">Stockout</TableHead>
                <TableHead className="text-center text-xs md:text-sm hidden lg:table-cell">Expiry</TableHead>
                <TableHead className="text-center text-xs md:text-sm">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventoryItems.map((item) => (
                <React.Fragment key={item.sku}>
                  <TableRow
                    className="cursor-pointer hover:bg-[#FFF2FA]"
                    onClick={() => setExpandedSKU(expandedSKU === item.sku ? null : item.sku)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-semibold text-[#223047] text-sm md:text-base">{item.name}</div>
                        <div className="text-xs text-[#223047] opacity-50">{item.sku}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className={`font-bold text-sm md:text-base ${item.stock < item.reorderPoint ? "text-red-600" : ""}`}>
                          {item.stock}
                        </span>
                        <span className="text-xs opacity-50">/ {item.reorderPoint}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center hidden md:table-cell">
                      <div className={`w-2 h-2 rounded-full mx-auto ${getVelocityColor(item.velocity)}`} />
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`text-sm md:text-base ${item.predictedStockout < 7 ? "text-red-600 font-bold" : ""}`}>
                        {item.predictedStockout}d
                      </span>
                    </TableCell>
                    <TableCell className="text-center hidden lg:table-cell">
                      {item.daysToExpiry ? (
                        <span className={`text-sm md:text-base ${item.daysToExpiry < 30 ? "text-orange-600 font-bold" : ""}`}>
                          {item.daysToExpiry}d
                        </span>
                      ) : (
                        <span className="text-[#223047] opacity-30 text-sm md:text-base">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.stock < item.reorderPoint ? (
                        <Button
                          onClick={() => handleReorderNow(item.sku, item.name)}
                          size="sm"
                          className="bg-[#D42A7D] hover:bg-[#F53799] text-xs"
                        >
                          Reorder
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="border-[#FFD9EC] text-xs">
                          View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedSKU === item.sku && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-[#FFF7FB]">
                        <div className="p-3 md:p-4 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          <div>
                            <div className="text-xs text-[#223047] opacity-60 mb-2">14-Day Sales Trend</div>
                            <ResponsiveContainer width="100%" height={100} className="md:!h-[120px]">
                              <LineChart
                                data={Array.from({ length: 14 }, (_, i) => ({
                                  day: i + 1,
                                  units: Math.floor(Math.random() * 10 + 2),
                                }))}
                              >
                                <Line type="monotone" dataKey="units" stroke="#D42A7D" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs md:text-sm">
                              <span className="opacity-60">Price:</span>
                              <span className="font-semibold">₱{item.price}</span>
                            </div>
                            <div className="flex justify-between text-xs md:text-sm">
                              <span className="opacity-60">Channel:</span>
                              <span className="font-semibold">{item.channel}</span>
                            </div>
                            <div className="flex justify-between text-xs md:text-sm">
                              <span className="opacity-60">Reorder Point:</span>
                              <span className="font-semibold">{item.reorderPoint} units</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
          </div>
        </div>

            <div className="hidden">
              {[
                { label: "Avg Daily Sales", value: "₱8,450", color: "#D42A7D" },
                { label: "Top Category", value: "Pet Food", color: "#F53799" },
                { label: "Online Share", value: "42%", color: "#5CE1E6" },
                { label: "Inventory Value", value: "₱2.1M", color: "#3AE4FA" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between p-2 md:p-3 bg-[#FFF2FA] rounded-lg">
                  <span className="text-xs md:text-sm text-[#223047] opacity-70">{stat.label}</span>
                  <span className="text-sm md:text-base font-bold text-[#223047]" style={{ color: stat.color }}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
      {/* SPOILAGE RISK ENGINE */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              AI Spoilage Prevention Engine
            </h2>
            <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
              Predictive alerts and automated discount recommendations
            </p>
          </div>
          <Badge className="bg-red-500 text-white hover:bg-red-500 text-xs md:text-sm flex-shrink-0">
            {spoilageRiskItems.length} Items at Risk
          </Badge>
        </div>

        <div className="grid gap-4 md:gap-6">
          {spoilageRiskItems.map((item) => (
            <div
              key={item.name}
              className="p-4 md:p-6 bg-[#FFF7FB] border-l-4 border-[#F53799] rounded-xl"
            >
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6 items-start lg:items-center">
                <div className="lg:col-span-2">
                  <h3 className="text-sm md:text-base font-bold text-[#223047] mb-2">{item.name}</h3>
                  <div className="space-y-1 text-xs md:text-sm">
                    <div className="flex items-center gap-2 text-[#223047] opacity-70">
                      <AlertCircle className="w-3 h-3 md:w-4 md:h-4" />
                      <span>Expires in <strong className="text-red-600">{item.daysLeft} days</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-[#223047] opacity-70">
                      <Package className="w-3 h-3 md:w-4 md:h-4" />
                      <span>{item.currentStock} units in stock</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#223047] opacity-70">
                      <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                      <span>{item.dailyVelocity} units/day velocity</span>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-[#223047] opacity-60 mb-1 md:mb-2">Spoilage Risk</div>
                  <div className={`text-2xl md:text-3xl font-extrabold ${getRiskColor(item.spoilageRisk)}`}>
                    {item.spoilageRisk}%
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-[#223047] opacity-60">WOOF Suggested Discount</div>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[item.recommendedDiscount]}
                      max={50}
                      min={5}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-base md:text-lg font-bold w-10 md:w-12 text-[#F53799]">{item.recommendedDiscount}%</span>
                  </div>
                  <p className="text-xs text-[#223047] opacity-60 hidden md:block">
                    Expected to clear stock in {Math.ceil(item.currentStock / (item.dailyVelocity * (1 + item.recommendedDiscount / 100)))} days
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => handleActivateDiscount(item.name, item.recommendedDiscount)}
                    className="bg-[#F53799] hover:bg-[#D42A7D] w-full text-xs md:text-sm"
                  >
                    Activate Sale
                  </Button>
                  <Button variant="outline" className="border-[#FFD9EC] w-full text-xs md:text-sm" size="sm">
                    Adjust
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* OMNICHANNEL PERFORMANCE */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              Omnichannel Performance by Category
            </h2>
            <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
              Revenue distribution across physical and online channels
            </p>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {["All", "Physical", "Shopee", "Tiktok"].map((channel) => (
              <Button
                key={channel}
                size="sm"
                variant={selectedChannel === channel.toLowerCase() ? "default" : "outline"}
                onClick={() => setSelectedChannel(channel.toLowerCase())}
                className={`text-xs ${
                  selectedChannel === channel.toLowerCase()
                    ? "bg-[#D42A7D] hover:bg-[#F53799]"
                    : "border-[#FFD9EC] hover:bg-[#FFF2FA]"
                }`}
              >
                {channel}
              </Button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300} className="md:!h-[400px]">
          <BarChart key={`chart-${selectedChannel}`} data={channelPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="#FFD9EC" vertical={false} />
            <XAxis dataKey="category" stroke="#223047" style={{ fontSize: "10px" }} />
            <YAxis stroke="#223047" style={{ fontSize: "10px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #FFD9EC",
                borderRadius: "12px",
                padding: "12px",
              }}
            />
            {(selectedChannel === "all" || selectedChannel === "physical") && (
              <Bar key="physical-bar" dataKey="physical" fill="#F53799" radius={[6, 6, 0, 0]} animationDuration={800} />
            )}
            {(selectedChannel === "all" || selectedChannel === "shopee") && (
              <Bar key="shopee-bar" dataKey="shopee" fill="#FBBF24" radius={[6, 6, 0, 0]} animationDuration={800} />
            )}
            {(selectedChannel === "all" || selectedChannel === "tiktok") && (
              <Bar key="tiktok-bar" dataKey="tiktok" fill="#8B5CF6" radius={[6, 6, 0, 0]} animationDuration={800} />
            )}
          </BarChart>
        </ResponsiveContainer>

        <div className="flex flex-wrap justify-center gap-4 md:gap-8 pt-2 md:pt-4">
          {[
            { label: "Physical Store", color: "#F53799" },
            { label: "Shopee", color: "#FBBF24" },
            { label: "Tiktok", color: "#8B5CF6" },
          ].map((channel) => (
            <div key={channel.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channel.color }} />
              <span className="text-xs md:text-sm text-[#223047]">{channel.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RETAIL REVIEW SENTIMENT MONITOR */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div>
          <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
            Retail Review Sentiment Monitor
          </h2>
          <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
            NLP analysis of Shopee and in-store retail feedback
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Sentiment Donut */}
          <div className="flex flex-col items-center justify-center py-4 md:py-0">
            <div className="relative w-full max-w-[240px] md:max-w-[280px] mx-auto">
              <ResponsiveContainer width="100%" height={200}>
                <RePieChart>
                  <Pie
                    data={retailSentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    animationDuration={800}
                  >
                    {retailSentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-2xl md:text-3xl font-extrabold text-[#223047]">72%</div>
                <div className="text-xs text-[#223047] opacity-60">Positive</div>
              </div>
            </div>
          </div>

          {/* Flagged Review Feed */}
          <div className="md:col-span-2 space-y-3 max-h-[300px] overflow-y-auto overflow-x-hidden">
            {flaggedRetailReviews.map((review, idx) => (
              <div key={idx} className="p-3 md:p-4 bg-[#FFF7FB] border border-[#FFD9EC] rounded-lg md:rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">{review.platform}</Badge>
                  <span className="text-xs text-[#223047] opacity-50">{review.date}</span>
                </div>
                <p className="text-xs md:text-sm text-[#223047]" style={{ lineHeight: "1.6" }}>
                  {review.text.split(" ").map((word, i) =>
                    review.keywords.some((kw) => word.toLowerCase().includes(kw)) ? (
                      <span key={`word-${idx}-${i}`} className="font-bold text-[#F53799]">
                        {word}{" "}
                      </span>
                    ) : (
                      <span key={`word-${idx}-${i}`}>{word} </span>
                    )
                  )}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#223047] opacity-60">{review.product}</span>
                  <Button size="sm" variant="outline" className="border-[#F53799] text-[#F53799] text-xs">
                    <span className="hidden sm:inline">Flag for Inspection</span>
                    <span className="sm:hidden">Flag</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Keyword Management */}
        <div className="pt-4 md:pt-6 border-t border-[#FFD9EC] space-y-3">
          <h3 className="text-xs md:text-sm font-semibold text-[#223047]">Negative Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <Badge
                key={keyword}
                variant="outline"
                className="gap-2 border-[#FFD9EC] bg-[#FFF2FA] text-xs"
              >
                {keyword}
                <button
                  onClick={() => handleRemoveKeyword(keyword)}
                  className="hover:text-[#F53799]"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddKeyword();
                }
              }}
              placeholder="Add new keyword..."
              className="flex-1 px-3 md:px-4 py-2 border border-[#FFD9EC] rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#F53799]"
            />
            <Button onClick={handleAddKeyword} className="bg-[#F53799] hover:bg-[#D42A7D] text-xs md:text-sm px-3 md:px-4">
              <span className="hidden sm:inline">Add Keyword</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {errorModal.type && (
        <ErrorModal
          isOpen={errorModal.isOpen}
          onClose={() => {
            setErrorModal({ isOpen: false, type: null });
            if (errorModal.type === "rate_limit") {
              setReorderAttempts(0);
            }
          }}
          errorType={errorModal.type}
          onRetry={errorModal.type === "payment_failed" ? handleRetryPayment : undefined}
          onContactSupport={errorModal.type === "data_corruption" ? handleContactSupport : undefined}
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
