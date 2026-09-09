import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Database, Bell, Palette, Shield, Download, CloudSun, CheckCircle2, ShieldAlert, Moon, Sun } from "lucide-react";
import { getExogenousStatus, getForecast } from "../lib/api";
import {
  DEFAULT_SETTINGS_PREFERENCES,
  applyStoredTheme,
  getSettingsPreferences,
  saveSettingsPreferences,
  type NotificationPreferenceKey,
} from "../lib/preferences";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Slider } from "../components/ui/slider";
import { toast } from "sonner";
import { InfoTooltip } from "../components/InfoTooltip";

export function Settings() {
  const [notifications, setNotifications] = useState(DEFAULT_SETTINGS_PREFERENCES.notifications);

  const [exogenousStatus, setExogenousStatus] = useState<any>(null);

  useEffect(() => {
    getExogenousStatus()
      .then(setExogenousStatus)
      .catch((err) => console.error("Failed to load exogenous status:", err));
  }, []);

  const [autoRetrain, setAutoRetrain] = useState(DEFAULT_SETTINGS_PREFERENCES.autoRetrain);
  const [confidenceThreshold, setConfidenceThreshold] = useState([DEFAULT_SETTINGS_PREFERENCES.confidenceThreshold]);
  const [dataRetention, setDataRetention] = useState([DEFAULT_SETTINGS_PREFERENCES.dataRetention]);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const preferences = getSettingsPreferences();
    setNotifications(preferences.notifications);
    setAutoRetrain(preferences.autoRetrain);
    setConfidenceThreshold([preferences.confidenceThreshold]);
    setDataRetention([preferences.dataRetention]);
    setDarkMode(applyStoredTheme() === "dark");
  }, []);

  const handleThemeChange = (checked: boolean) => {
    setDarkMode(checked);
    document.documentElement.classList.toggle("woof-dark", checked);
    saveSettingsPreferences((current) => ({
      ...current,
      notifications,
      autoRetrain,
      confidenceThreshold: confidenceThreshold[0],
      dataRetention: dataRetention[0],
      theme: checked ? "dark" : "light",
    }));
    toast.success(`${checked ? "Dark" : "Light"} mode enabled`);
  };

  const handleNotificationChange = (key: NotificationPreferenceKey, checked: boolean) => {
    const nextNotifications = { ...notifications, [key]: checked };
    setNotifications(nextNotifications);
    saveSettingsPreferences((current) => ({
      ...current,
      notifications: nextNotifications,
    }));
    toast.success("Notification preference updated", {
      description: `${checked ? "Enabled" : "Muted"} ${key} notifications.`,
    });
  };

  const handleAutoRetrainChange = (checked: boolean) => {
    setAutoRetrain(checked);
    saveSettingsPreferences((current) => ({
      ...current,
      autoRetrain: checked,
    }));
  };

  const handleConfidenceThresholdChange = (value: number[]) => {
    setConfidenceThreshold(value);
    saveSettingsPreferences((current) => ({
      ...current,
      confidenceThreshold: value[0] ?? DEFAULT_SETTINGS_PREFERENCES.confidenceThreshold,
    }));
  };

  const handleDataRetentionChange = (value: number[]) => {
    setDataRetention(value);
    saveSettingsPreferences((current) => ({
      ...current,
      dataRetention: value[0] ?? DEFAULT_SETTINGS_PREFERENCES.dataRetention,
    }));
  };

  const handleSaveSettings = () => {
    saveSettingsPreferences((current) => ({
      ...current,
      notifications,
      autoRetrain,
      confidenceThreshold: confidenceThreshold[0],
      dataRetention: dataRetention[0],
      theme: darkMode ? "dark" : "light",
    }));
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
    const toastId = toast.loading("Retraining all models with the latest data... This may take up to a minute.");
    Promise.all([
      getForecast("cafe", { forceRefresh: "true" }),
      getForecast("services", { forceRefresh: "true" })
    ])
      .then(() => {
        toast.dismiss(toastId);
        toast.success("Models retrained successfully!", {
          description: "All prediction models updated with latest data.",
        });
      })
      .catch((err) => {
        toast.dismiss(toastId);
        toast.error("Model retraining failed: " + (err instanceof Error ? err.message : String(err)));
      });
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
                checked={notifications[item.key as NotificationPreferenceKey]}
                onCheckedChange={(checked) => handleNotificationChange(item.key as NotificationPreferenceKey, checked)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* AI & MODEL SETTINGS */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div className="flex items-center gap-2 md:gap-3">
          <Database className="w-5 h-5 md:w-6 md:h-6 text-[#06B6D4]" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
                AI & Model Configuration
              </h2>
              <InfoTooltip label="Controls how WOOF retrains forecasting models and when AI recommendations should be shown for owner review." />
            </div>
            <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
              Control model behavior and prediction thresholds
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:gap-6 pt-2 md:pt-4">
          <div className="p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 font-semibold text-sm md:text-base text-[#223047]">
                  <span>Automatic Model Retraining</span>
                  <InfoTooltip label="When enabled, WOOF can refresh forecasting models after new upload or webhook data is processed." />
                </div>
                <div className="text-xs md:text-sm text-[#223047] opacity-60 mt-1">
                  Automatically retrain models when new data is available
                </div>
              </div>
              <Switch checked={autoRetrain} onCheckedChange={handleAutoRetrainChange} />
            </div>
          </div>

          <div className="p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl space-y-4">
            <div>
              <div className="mb-1 flex items-center gap-2 font-semibold text-sm md:text-base text-[#223047]">
                <span>Confidence Threshold</span>
                <InfoTooltip label="The minimum confidence level a recommendation needs before WOOF presents it as worth reviewing." />
              </div>
              <div className="text-xs md:text-sm text-[#223047] opacity-60 mb-3 md:mb-4">
                Minimum confidence level for AI suggestions: {confidenceThreshold[0]}%
              </div>
              <div className="flex items-center gap-3 md:gap-4">
                <Slider
                  value={confidenceThreshold}
                  onValueChange={handleConfidenceThresholdChange}
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
            <Button onClick={handleRetrainModels} className="w-full bg-[#06B6D4] hover:bg-[#06B6D4] text-sm md:text-base">
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
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm md:text-base text-[#223047]">OpenWeatherMap Integration</h3>
                  <InfoTooltip label="Weather data is used as outside context for demand forecasting, especially Cafe and Services demand." />
                </div>
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
                  <span className="opacity-60 flex items-center gap-1">
                    Cached Records
                    <InfoTooltip label="Saved weather rows reused by WOOF so forecasts do not need to call the weather provider every time." />
                  </span>
                  <span className="font-semibold">{exogenousStatus?.weatherCache?.count ?? "—"} daily rows</span>
                </div>
                <div>
                  <span className="opacity-60 flex items-center gap-1">
                    Last Active Source
                    <InfoTooltip label="Shows whether the latest weather data came from the live API or a fallback source." />
                  </span>
                  <span className="font-semibold uppercase text-xs">{exogenousStatus?.weatherCache?.lastSource ?? "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Abstract Holidays Config */}
          <div className="p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl space-y-4 border border-[#FFD9EC]/50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm md:text-base text-[#223047]">Abstract Holidays Calendar</h3>
                  <InfoTooltip label="Holiday context helps WOOF adjust demand expectations for dates that may affect customer behavior." />
                </div>
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
                  <span className="opacity-60 flex items-center gap-1">
                    Cached Years
                    <InfoTooltip label="Saved holiday calendars available to the forecasting engine." />
                  </span>
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
              <div className="mb-1 flex items-center gap-2 font-semibold text-sm md:text-base text-[#223047]">
                <span>Data Retention Period</span>
                <InfoTooltip label="How long WOOF should keep historical records available for analysis, reports, and audit checks." />
              </div>
              <div className="text-xs md:text-sm text-[#223047] opacity-60 mb-3 md:mb-4">
                Keep historical data for {dataRetention[0]} days
              </div>
              <div className="flex items-center gap-3 md:gap-4">
                <Slider
                  value={dataRetention}
                  onValueChange={handleDataRetentionChange}
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
          <div className="p-4 md:p-6 bg-[#FFF7FB] border-2 border-[#FFD9EC] rounded-xl md:rounded-2xl sm:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-[#FFD9EC]">
                  {darkMode ? (
                    <Moon className="h-5 w-5 text-[#F53799]" />
                  ) : (
                    <Sun className="h-5 w-5 text-[#F53799]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 font-semibold text-sm md:text-base text-[#223047]">
                    <span>Light / Dark Mode</span>
                    <InfoTooltip label="Changes the dashboard display mode for easier viewing in bright or low-light environments. Your choice is saved on this browser." />
                  </div>
                  <div className="text-xs md:text-sm text-[#223047] opacity-60 mt-1">
                    Current mode: {darkMode ? "Dark" : "Light"}
                  </div>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={handleThemeChange} />
            </div>
          </div>

          {[
            { name: "Pink Fusion (Default)", primary: "#F53799", secondary: "#06B6D4" },
            { name: "Ocean Breeze", primary: "#06B6D4", secondary: "#06B6D4" },
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
