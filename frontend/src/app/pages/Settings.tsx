import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Database, Bell, Palette, Shield, Download, CloudSun, CheckCircle2, ShieldAlert } from "lucide-react";
import { getExogenousStatus } from "../lib/api";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Slider } from "../components/ui/slider";
import { toast } from "sonner";

export function Settings() {
  const [notifications, setNotifications] = useState({
    alerts: true,
    suggestions: true,
    reports: false,
    system: true,
  });

  const [exogenousStatus, setExogenousStatus] = useState<any>(null);

  useEffect(() => {
    getExogenousStatus()
      .then(setExogenousStatus)
      .catch((err) => console.error("Failed to load exogenous status:", err));
  }, []);

  const [autoRetrain, setAutoRetrain] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState([80]);
  const [dataRetention, setDataRetention] = useState([90]);

  const handleSaveSettings = () => {
    toast.success("Settings saved!", {
      description: "Your preferences have been updated.",
    });
  };

  const handleExportData = () => {
    toast.info("Exporting data...");
    setTimeout(() => {
      toast.success("Data exported!", {
        description: "WOOF_Data_Export_2026-04-15.zip",
      });
    }, 1500);
  };

  const handleRetrainModels = () => {
    toast.info("Retraining all models...");
    setTimeout(() => {
      toast.success("Models retrained successfully!", {
        description: "All prediction models updated with latest data.",
      });
    }, 3000);
  };

  return (
    <div className="space-y-6 md:space-y-8 lg:space-y-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl lg:text-[36px] font-extrabold text-[#223047]">
            System Settings
          </h1>
          <p className="text-sm md:text-base text-[#223047] opacity-60 mt-1 md:mt-2" style={{ lineHeight: "1.6" }}>
            Configure WOOF system preferences and data management
          </p>
        </div>
        <Button onClick={handleSaveSettings} className="bg-[#F53799] hover:bg-[#D42A7D] w-full md:w-auto">
          Save All Settings
        </Button>
      </div>

      {/* NOTIFICATION PREFERENCES */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div className="flex items-center gap-2 md:gap-3">
          <Bell className="w-5 h-5 md:w-6 md:h-6 text-[#F53799]" />
          <div>
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              Notification Preferences
            </h2>
            <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
              Manage how and when you receive WOOF alerts
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:gap-4 pt-2 md:pt-4">
          {[
            { key: "alerts", label: "Capacity & Spoilage Alerts", description: "Critical business alerts requiring immediate action" },
            { key: "suggestions", label: "AI Suggestions", description: "Bundle recommendations and optimization opportunities" },
            { key: "reports", label: "Daily Reports", description: "Automated daily performance summaries" },
            { key: "system", label: "System Updates", description: "Model retraining and system status notifications" },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-3 p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm md:text-base text-[#223047]">{item.label}</div>
                <div className="text-xs md:text-sm text-[#223047] opacity-60 mt-1">{item.description}</div>
              </div>
              <Switch
                checked={notifications[item.key as keyof typeof notifications]}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, [item.key]: checked })
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* AI & MODEL SETTINGS */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div className="flex items-center gap-2 md:gap-3">
          <Database className="w-5 h-5 md:w-6 md:h-6 text-[#3AE4FA]" />
          <div>
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              AI & Model Configuration
            </h2>
            <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
              Control model behavior and prediction thresholds
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:gap-6 pt-2 md:pt-4">
          <div className="p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm md:text-base text-[#223047]">Automatic Model Retraining</div>
                <div className="text-xs md:text-sm text-[#223047] opacity-60 mt-1">
                  Automatically retrain models when new data is available
                </div>
              </div>
              <Switch checked={autoRetrain} onCheckedChange={setAutoRetrain} />
            </div>
          </div>

          <div className="p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl space-y-4">
            <div>
              <div className="font-semibold text-sm md:text-base text-[#223047] mb-1">Confidence Threshold</div>
              <div className="text-xs md:text-sm text-[#223047] opacity-60 mb-3 md:mb-4">
                Minimum confidence level for AI suggestions: {confidenceThreshold[0]}%
              </div>
              <div className="flex items-center gap-3 md:gap-4">
                <Slider
                  value={confidenceThreshold}
                  onValueChange={setConfidenceThreshold}
                  max={95}
                  min={60}
                  step={5}
                  className="flex-1"
                />
                <span className="text-base md:text-lg font-bold text-[#F53799] w-10 md:w-12">
                  {confidenceThreshold[0]}%
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl">
            <Button onClick={handleRetrainModels} className="w-full bg-[#3AE4FA] hover:bg-[#5CE1E6] text-sm md:text-base">
              Retrain All Models Now
            </Button>
          </div>
        </div>
      </div>

      {/* EXTERNAL API CONNECTIONS & DIAGNOSTICS */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div className="flex items-center gap-2 md:gap-3">
          <CloudSun className="w-5 h-5 md:w-6 md:h-6 text-[#F53799]" />
          <div>
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              External API Connections & Diagnostics
            </h2>
            <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
              Configure forecasting data providers and check API cache health
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 pt-2 md:pt-4">
          {/* OpenWeather Config */}
          <div className="p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl space-y-4 border border-[#FFD9EC]/50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm md:text-base text-[#223047]">OpenWeatherMap Integration</h3>
                <p className="text-xs text-[#223047] opacity-60 mt-1">Exogenous weather feed for Cafe & Services</p>
              </div>
              {exogenousStatus?.weatherCache?.lastSource && exogenousStatus.weatherCache.lastSource !== "synthetic" ? (
                <Badge className="bg-green-500 text-white gap-1 hover:bg-green-500">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-500 text-amber-600 gap-1 bg-amber-50">
                  <ShieldAlert className="w-3 h-3" /> Synthetic Fallback
                </Badge>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[11px] text-[#223047] opacity-70 block mb-1 font-semibold">API Key Status</label>
                <input
                  type="text"
                  readOnly
                  value="••••••••••••••••••••••••••••••••"
                  className="w-full px-3 py-2 bg-white/70 border border-[#FFD9EC] rounded-lg text-xs focus:outline-none text-[#223047] opacity-70"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-[#223047]">
                <div>
                  <span className="opacity-60 block">Target Location</span>
                  <span className="font-semibold">Lucena City, PH</span>
                </div>
                <div>
                  <span className="opacity-60 block">Coordinates</span>
                  <span className="font-semibold">13.9397, 121.6145</span>
                </div>
                <div>
                  <span className="opacity-60 block">Cached Records</span>
                  <span className="font-semibold">{exogenousStatus?.weatherCache?.count ?? "—"} daily rows</span>
                </div>
                <div>
                  <span className="opacity-60 block">Last Active Source</span>
                  <span className="font-semibold uppercase text-xs">{exogenousStatus?.weatherCache?.lastSource ?? "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Abstract Holidays Config */}
          <div className="p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl space-y-4 border border-[#FFD9EC]/50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm md:text-base text-[#223047]">Abstract Holidays Calendar</h3>
                <p className="text-xs text-[#223047] opacity-60 mt-1">Philippine national holiday catalog provider</p>
              </div>
              {exogenousStatus?.holidayCache?.lastSource && exogenousStatus.holidayCache.lastSource !== "hardcoded" ? (
                <Badge className="bg-green-500 text-white gap-1 hover:bg-green-500">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-500 text-amber-600 gap-1 bg-amber-50">
                  <ShieldAlert className="w-3 h-3" /> Hardcoded Fallback
                </Badge>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[11px] text-[#223047] opacity-70 block mb-1 font-semibold">API Key Status</label>
                <input
                  type="text"
                  readOnly
                  value="••••••••••••••••••••••••••••••••"
                  className="w-full px-3 py-2 bg-white/70 border border-[#FFD9EC] rounded-lg text-xs focus:outline-none text-[#223047] opacity-70"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-[#223047]">
                <div>
                  <span className="opacity-60 block">Target Country</span>
                  <span className="font-semibold">Philippines (PH)</span>
                </div>
                <div>
                  <span className="opacity-60 block">Cached Years</span>
                  <span className="font-semibold">{exogenousStatus?.holidayCache?.count ?? "—"} years</span>
                </div>
                <div>
                  <span className="opacity-60 block">Last Active Source</span>
                  <span className="font-semibold uppercase text-xs">{exogenousStatus?.holidayCache?.lastSource ?? "—"}</span>
                </div>
                <div>
                  <span className="opacity-60 block">Cache Status</span>
                  <span className="font-semibold text-green-600">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DATA MANAGEMENT */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div className="flex items-center gap-2 md:gap-3">
          <Shield className="w-5 h-5 md:w-6 md:h-6 text-[#D42A7D]" />
          <div>
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              Data Management
            </h2>
            <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
              Control data retention and export options
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:gap-6 pt-2 md:pt-4">
          <div className="p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl space-y-4">
            <div>
              <div className="font-semibold text-sm md:text-base text-[#223047] mb-1">Data Retention Period</div>
              <div className="text-xs md:text-sm text-[#223047] opacity-60 mb-3 md:mb-4">
                Keep historical data for {dataRetention[0]} days
              </div>
              <div className="flex items-center gap-3 md:gap-4">
                <Slider
                  value={dataRetention}
                  onValueChange={setDataRetention}
                  max={365}
                  min={30}
                  step={30}
                  className="flex-1"
                />
                <span className="text-base md:text-lg font-bold text-[#D42A7D] w-12 md:w-16">
                  {dataRetention[0]}d
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl">
            <Button onClick={handleExportData} className="w-full bg-[#D42A7D] hover:bg-[#F53799] gap-2 text-sm md:text-base">
              <Download className="w-4 h-4" />
              Export All Data
            </Button>
          </div>
        </div>
      </div>

      {/* APPEARANCE */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div className="flex items-center gap-2 md:gap-3">
          <Palette className="w-5 h-5 md:w-6 md:h-6 text-[#F53799]" />
          <div>
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              Appearance
            </h2>
            <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
              Customize your dashboard experience
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 pt-2 md:pt-4">
          {[
            { name: "Pink Fusion (Default)", primary: "#F53799", secondary: "#3AE4FA" },
            { name: "Ocean Breeze", primary: "#3AE4FA", secondary: "#5CE1E6" },
            { name: "Sunset Glow", primary: "#F53799", secondary: "#D42A7D" },
            { name: "Minimal Gray", primary: "#223047", secondary: "#FFD9EC" },
          ].map((theme) => (
            <button
              key={theme.name}
              className="p-4 md:p-6 bg-[#FFF7FB] border-2 border-[#FFD9EC] rounded-xl md:rounded-2xl hover:border-[#F53799] transition-all text-left"
            >
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div
                  className="w-6 h-6 md:w-8 md:h-8 rounded-full"
                  style={{ backgroundColor: theme.primary }}
                />
                <div
                  className="w-6 h-6 md:w-8 md:h-8 rounded-full"
                  style={{ backgroundColor: theme.secondary }}
                />
              </div>
              <div className="font-semibold text-sm md:text-base text-[#223047]">{theme.name}</div>
              {theme.name === "Pink Fusion (Default)" && (
                <Badge className="mt-2 bg-[#F53799] text-white hover:bg-[#F53799] text-xs">
                  Active
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* SYSTEM INFO */}
      <div className="bg-gradient-to-br from-[#223047] to-[#223047] text-white rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-3 md:space-y-4">
        <div className="flex items-center gap-2 md:gap-3">
          <SettingsIcon className="w-5 h-5 md:w-6 md:h-6" />
          <h2 className="text-lg md:text-xl lg:text-[22px] font-bold">System Information</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6 pt-2 md:pt-4">
          {[
            { label: "WOOF Version", value: "2.4.1" },
            { label: "Last Model Update", value: "2 hours ago" },
            { label: "Data Level", value: "Level 3: Live-Ready" },
            { label: "Active Models", value: "Prophet, SARIMA, XGBoost" },
            { label: "Total Records", value: "1.2M transactions" },
            { label: "System Status", value: "All systems operational" },
          ].map((item) => (
            <div key={item.label} className="p-3 md:p-4 bg-white/10 rounded-lg md:rounded-xl">
              <div className="text-[10px] md:text-xs opacity-70 mb-1">{item.label}</div>
              <div className="font-semibold text-sm md:text-base">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
