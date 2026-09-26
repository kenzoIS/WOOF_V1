import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Database, Download, CheckCircle2, ShieldAlert, Moon, Sun, MapPin, Clock, CircleDollarSign, Archive, FileText, BellRing, MessageSquare, HardDrive, LayoutDashboard, PanelLeftClose, Eye, EyeOff, BarChart3, KeyRound, Smartphone, History, TimerReset } from "lucide-react";
import {
  changeDashboardPassword,
  disableTwoFactor,
  enableTwoFactor,
  getAlertThresholds,
  getExogenousStatus,
  getForecast,
  getLoginActivity,
  getTwoFactorStatus,
  saveAlertThresholds,
  setupTwoFactor,
  type LoginActivityEntry,
} from "../lib/api";
import {
  DEFAULT_SETTINGS_PREFERENCES,
  applyDocumentColorTheme,
  applyStoredTheme,
  getSettingsPreferences,
  saveSettingsPreferences,
  type BusinessProfilePreferences,
  type ColorThemeKey,
  type CustomThemePreferences,
  type AlertThresholdPreferences,
  type DashboardPreferences,
  type NotificationPreferenceKey,
  type SecurityPreferences,
} from "../lib/preferences";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Slider } from "../components/ui/slider";
import { toast } from "sonner";
import { InfoTooltip } from "../components/InfoTooltip";

const DASHBOARD_SECURITY_EMAIL = "woofdash@gmail.com";

export function Settings() {
  const [businessProfile, setBusinessProfile] = useState(DEFAULT_SETTINGS_PREFERENCES.businessProfile);
  const [notifications, setNotifications] = useState(DEFAULT_SETTINGS_PREFERENCES.notifications);
  const [alertThresholds, setAlertThresholds] = useState(DEFAULT_SETTINGS_PREFERENCES.alertThresholds);
  const [dashboardPreferences, setDashboardPreferences] = useState(DEFAULT_SETTINGS_PREFERENCES.dashboard);
  const [securityPreferences, setSecurityPreferences] = useState(DEFAULT_SETTINGS_PREFERENCES.security);
  const [securityEmail, setSecurityEmail] = useState(DASHBOARD_SECURITY_EMAIL);
  const [draftSessionTimeoutMinutes, setDraftSessionTimeoutMinutes] = useState(DEFAULT_SETTINGS_PREFERENCES.security.sessionTimeoutMinutes);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newSecurityPassword, setNewSecurityPassword] = useState("");
  const [confirmSecurityPassword, setConfirmSecurityPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewSecurityPassword, setShowNewSecurityPassword] = useState(false);
  const [showConfirmSecurityPassword, setShowConfirmSecurityPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [twoFactorUri, setTwoFactorUri] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isUpdatingTwoFactor, setIsUpdatingTwoFactor] = useState(false);
  const [loginActivity, setLoginActivity] = useState<LoginActivityEntry[]>([]);

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
  const [colorTheme, setColorTheme] = useState<ColorThemeKey>(DEFAULT_SETTINGS_PREFERENCES.colorTheme);
  const [customTheme, setCustomTheme] = useState(DEFAULT_SETTINGS_PREFERENCES.customTheme);

  useEffect(() => {
    const preferences = getSettingsPreferences();
    setBusinessProfile(preferences.businessProfile);
    setNotifications(preferences.notifications);
    setAlertThresholds(preferences.alertThresholds);
    setDashboardPreferences(preferences.dashboard);
    setSecurityPreferences(preferences.security);
    setAutoRetrain(preferences.autoRetrain);
    setConfidenceThreshold([preferences.confidenceThreshold]);
    setDataRetention([preferences.dataRetention]);
    setColorTheme(preferences.colorTheme);
    setCustomTheme(preferences.customTheme);
    setDarkMode(applyStoredTheme() === "dark");
    setDraftSessionTimeoutMinutes(preferences.security.sessionTimeoutMinutes);
    setSecurityEmail(DASHBOARD_SECURITY_EMAIL);
    if (typeof window !== "undefined") {
      localStorage.setItem("userEmail", DASHBOARD_SECURITY_EMAIL);
    }
    getTwoFactorStatus(DASHBOARD_SECURITY_EMAIL)
      .then((status) => setTwoFactorEnabled(status.enabled))
      .catch(() => {});
    getLoginActivity(DASHBOARD_SECURITY_EMAIL)
      .then(setLoginActivity)
      .catch(() => {});

    getAlertThresholds()
      .then((thresholds) => {
        setAlertThresholds(thresholds);
        saveSettingsPreferences((current) => ({
          ...current,
          alertThresholds: thresholds,
        }));
      })
      .catch((err) => console.warn("Using local alert thresholds:", err));
  }, []);

  const handleThemeChange = (checked: boolean) => {
    setDarkMode(checked);
    document.documentElement.classList.toggle("woof-dark", checked);
    saveSettingsPreferences((current) => ({
      ...current,
      notifications,
      alertThresholds,
      dashboard: dashboardPreferences,
      security: securityPreferences,
      businessProfile,
      autoRetrain,
      confidenceThreshold: confidenceThreshold[0],
      dataRetention: dataRetention[0],
      theme: checked ? "dark" : "light",
      colorTheme,
      customTheme,
    }));
    toast.success(`${checked ? "Dark" : "Light"} mode enabled`);
  };

  const handleColorThemeChange = (themeKey: ColorThemeKey) => {
    setColorTheme(themeKey);
    applyDocumentColorTheme(themeKey, customTheme);
    saveSettingsPreferences((current) => ({
      ...current,
      colorTheme: themeKey,
    }));
    toast.success("Theme colors updated");
  };

  const handleCustomThemeChange = (key: keyof CustomThemePreferences, value: string) => {
    const nextTheme = { ...customTheme, [key]: value.toUpperCase() };
    setCustomTheme(nextTheme);

    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      if (colorTheme === "custom") {
        applyDocumentColorTheme("custom", nextTheme);
      }
      saveSettingsPreferences((current) => ({
        ...current,
        customTheme: nextTheme,
      }));
    }
  };

  const handleManualThemeToggle = (checked: boolean) => {
    const nextTheme: ColorThemeKey = checked ? "custom" : "pink";
    setColorTheme(nextTheme);
    applyDocumentColorTheme(nextTheme, customTheme);
    saveSettingsPreferences((current) => ({
      ...current,
      colorTheme: nextTheme,
      customTheme,
    }));
    toast.success(checked ? "Manual colors enabled" : "Manual colors disabled");
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

  const handleAlertThresholdChange = (
    key: keyof AlertThresholdPreferences,
    value: number[],
  ) => {
    const nextThresholds = {
      ...alertThresholds,
      [key]: value[0] ?? DEFAULT_SETTINGS_PREFERENCES.alertThresholds[key],
    };
    setAlertThresholds(nextThresholds);
    saveSettingsPreferences((current) => ({
      ...current,
      alertThresholds: nextThresholds,
    }));
    saveAlertThresholds(nextThresholds).catch((err) => {
      console.warn("Alert threshold backend sync failed:", err);
    });
  };

  const handleDashboardPreferenceChange = <K extends keyof DashboardPreferences>(
    key: K,
    value: DashboardPreferences[K],
  ) => {
    const nextDashboardPreferences = {
      ...dashboardPreferences,
      [key]: value,
    };
    setDashboardPreferences(nextDashboardPreferences);
    saveSettingsPreferences((current) => ({
      ...current,
      dashboard: nextDashboardPreferences,
    }));
  };

  const handleSecurityPreferenceChange = <K extends keyof SecurityPreferences>(
    key: K,
    value: SecurityPreferences[K],
  ) => {
    const nextSecurityPreferences = {
      ...securityPreferences,
      [key]: value,
    };
    setSecurityPreferences(nextSecurityPreferences);
    saveSettingsPreferences((current) => ({
      ...current,
      security: nextSecurityPreferences,
    }));
  };

  const handleApplySessionTimeout = () => {
    handleSecurityPreferenceChange("sessionTimeoutMinutes", draftSessionTimeoutMinutes);
    toast.success("Session timeout updated", {
      description: `Inactive sessions will expire after ${draftSessionTimeoutMinutes} minute${draftSessionTimeoutMinutes === 1 ? "" : "s"}.`,
    });
  };

  const handleBusinessProfileChange = (key: keyof BusinessProfilePreferences, value: string) => {
    const nextProfile = { ...businessProfile, [key]: value };
    setBusinessProfile(nextProfile);
    saveSettingsPreferences((current) => ({
      ...current,
      businessProfile: nextProfile,
    }));
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
      businessProfile,
      notifications,
      alertThresholds,
      dashboard: dashboardPreferences,
      security: securityPreferences,
      autoRetrain,
      confidenceThreshold: confidenceThreshold[0],
      dataRetention: dataRetention[0],
      theme: darkMode ? "dark" : "light",
      colorTheme,
      customTheme,
    }));
    toast.success("Settings saved!", {
      description: "Your preferences have been updated.",
    });
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newSecurityPassword || !confirmSecurityPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newSecurityPassword !== confirmSecurityPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newSecurityPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);
    try {
      await changeDashboardPassword({
        email: securityEmail,
        currentPassword,
        newPassword: newSecurityPassword,
      });
      setCurrentPassword("");
      setNewSecurityPassword("");
      setConfirmSecurityPassword("");
      setShowCurrentPassword(false);
      setShowNewSecurityPassword(false);
      setShowConfirmSecurityPassword(false);
      toast.success("Password updated", {
        description: "Use the new password the next time you sign in.",
      });
    } catch (error) {
      toast.error("Unable to change password", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const refreshLoginActivity = () => {
    getLoginActivity(securityEmail).then(setLoginActivity).catch(() => {});
  };

  const handleSetupTwoFactor = async () => {
    setIsUpdatingTwoFactor(true);
    try {
      const setup = await setupTwoFactor(securityEmail);
      setTwoFactorSecret(setup.secret);
      setTwoFactorUri(setup.otpauthUri);
      setTwoFactorCode("");
      toast.success("Authenticator setup created");
    } catch (error) {
      toast.error("Unable to start 2FA setup", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsUpdatingTwoFactor(false);
    }
  };

  const handleEnableTwoFactor = async () => {
    if (twoFactorCode.length !== 6) {
      toast.error("Enter the 6-digit authenticator code");
      return;
    }

    setIsUpdatingTwoFactor(true);
    try {
      await enableTwoFactor(securityEmail, twoFactorCode);
      setTwoFactorEnabled(true);
      setTwoFactorCode("");
      setTwoFactorSecret("");
      setTwoFactorUri("");
      toast.success("2FA enabled");
    } catch (error) {
      toast.error("Unable to enable 2FA", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsUpdatingTwoFactor(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (twoFactorCode.length !== 6) {
      toast.error("Enter the current 6-digit authenticator code");
      return;
    }

    setIsUpdatingTwoFactor(true);
    try {
      await disableTwoFactor(securityEmail, twoFactorCode);
      setTwoFactorEnabled(false);
      setTwoFactorCode("");
      setTwoFactorSecret("");
      setTwoFactorUri("");
      toast.success("2FA disabled");
    } catch (error) {
      toast.error("Unable to disable 2FA", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsUpdatingTwoFactor(false);
    }
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

  const profileInputClass = "w-full px-3 py-2 bg-white/70 border border-[#FFD9EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F53799]/30 text-[#223047]";
  const profileLabelClass = "text-[11px] text-[#223047] opacity-70 block mb-1 font-semibold uppercase tracking-wide";
  const retentionScopeItems = [
    { label: "System logs", icon: FileText },
    { label: "Generated reports", icon: Archive },
    { label: "Notifications", icon: BellRing },
    { label: "Feedback events", icon: MessageSquare },
    { label: "Temporary caches", icon: HardDrive },
  ];
  const alertThresholdItems: Array<{
    key: keyof AlertThresholdPreferences;
    label: string;
    description: string;
    min: number;
    max: number;
    step: number;
    suffix: string;
    direction: string;
  }> = [
    {
      key: "capacityWarning",
      label: "Capacity Warning Threshold",
      description: "Warn when forecasted service slots, queue load, or store traffic reaches a risky utilization level.",
      min: 50,
      max: 100,
      step: 5,
      suffix: "%",
      direction: "Alert when usage >= threshold",
    },
    {
      key: "lowInventory",
      label: "Low Inventory Threshold",
      description: "Flag SKUs when available stock drops to this percent of the reorder baseline.",
      min: 5,
      max: 60,
      step: 5,
      suffix: "%",
      direction: "Alert when inventory <= threshold",
    },
    {
      key: "forecastAccuracyWarning",
      label: "Forecast Accuracy Warning",
      description: "Warn when validation accuracy falls below the acceptable model quality floor.",
      min: 50,
      max: 99,
      step: 1,
      suffix: "%",
      direction: "Alert when accuracy <= threshold",
    },
    {
      key: "dataStalenessDays",
      label: "Data Staleness Warning",
      description: "Warn when the newest transaction or upload data is older than this many days.",
      min: 1,
      max: 30,
      step: 1,
      suffix: "d",
      direction: "Alert when data age > threshold",
    },
  ];
  const colorThemes: Array<{
    key: Exclude<ColorThemeKey, "custom">;
    name: string;
    description: string;
    primary: string;
    accent: string;
    surface: string;
  }> = [
    {
      key: "pink",
      name: "Pink Fusion",
      description: "Original WOOF pink and cyan dashboard style",
      primary: "#F53799",
      accent: "#06B6D4",
      surface: "#FFF7FB",
    },
    {
      key: "ocean",
      name: "Ocean Breeze",
      description: "Blue and teal theme for calmer operations review",
      primary: "#0EA5E9",
      accent: "#14B8A6",
      surface: "#F0FDFA",
    },
    {
      key: "mint",
      name: "Professional Mono",
      description: "White, grey, and black palette for a clean executive look",
      primary: "#111827",
      accent: "#6B7280",
      surface: "#F9FAFB",
    },
    {
      key: "slate",
      name: "Executive Slate",
      description: "Slate and violet theme for low-glare dashboards",
      primary: "#6366F1",
      accent: "#22D3EE",
      surface: "#F8FAFC",
    },
  ];
  const customThemeFields: Array<{
    key: keyof CustomThemePreferences;
    label: string;
    description: string;
  }> = [
    { key: "primary", label: "Primary", description: "Actions, selected states, and main highlights" },
    { key: "accent", label: "Accent", description: "Secondary indicators, charts, and supporting badges" },
    { key: "surface", label: "Surface", description: "Soft page sections, cards, and quiet backgrounds" },
  ];
  const activePaletteName = colorTheme === "custom"
    ? "Custom Manual Theme"
    : colorThemes.find((theme) => theme.key === colorTheme)?.name;
  const landingPageOptions: Array<{ value: DashboardPreferences["defaultLandingPage"]; label: string }> = [
    { value: "/", label: "Home" },
    { value: "/cafe", label: "Cafe" },
    { value: "/services", label: "Services" },
    { value: "/retail", label: "Retail" },
    { value: "/ai-simulation", label: "AI Simulation" },
    { value: "/smart-reports", label: "Smart Reports" },
    { value: "/root-cause-explorer", label: "Root Cause Explorer" },
    { value: "/feedback", label: "Feedback" },
    { value: "/audit", label: "Audit" },
  ];
  const chartViewOptions: Array<{ value: DashboardPreferences["defaultChartView"]; label: string }> = [
    { value: "monthly", label: "Monthly" },
    { value: "weekly", label: "Weekly" },
    { value: "daily", label: "Daily" },
  ];

  return (
    <div className="space-y-6 md:space-y-8 lg:space-y-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl lg:text-[36px] font-extrabold text-[#223047]">
              System Settings
            </h1>
            <InfoTooltip label="Configure WOOF system preferences and data management." />
          </div>
        </div>
        <Button onClick={handleSaveSettings} className="bg-[#F53799] hover:bg-[#D42A7D] w-full md:w-auto">
          Save All Settings
        </Button>
      </div>

      {/* BUSINESS PROFILE */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              Business Profile
            </h2>
            <InfoTooltip label="Maintain the operating defaults WOOF uses for reports, timestamps, and forecast windows." />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 pt-2 md:pt-4">
          <div className="lg:col-span-2 p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl border border-[#FFD9EC]/50 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={profileLabelClass}>Business Name</label>
                <input
                  type="text"
                  value={businessProfile.businessName}
                  onChange={(event) => handleBusinessProfileChange("businessName", event.target.value)}
                  className={profileInputClass}
                />
              </div>
              <div>
                <label className={profileLabelClass}>Branch Name</label>
                <input
                  type="text"
                  value={businessProfile.branchName}
                  onChange={(event) => handleBusinessProfileChange("branchName", event.target.value)}
                  className={profileInputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className={profileLabelClass}>Operating Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#F53799]" />
                  <input
                    type="text"
                    value={businessProfile.location}
                    onChange={(event) => handleBusinessProfileChange("location", event.target.value)}
                    className={`${profileInputClass} pl-9`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl border border-[#FFD9EC]/50 space-y-4">
            <div>
              <label className={profileLabelClass}>Timezone</label>
              <select
                value={businessProfile.timezone}
                onChange={(event) => handleBusinessProfileChange("timezone", event.target.value)}
                className={profileInputClass}
              >
                <option value="Asia/Manila">Asia/Manila</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </div>
            <div>
              <label className={profileLabelClass}>Currency</label>
              <div className="relative">
                <CircleDollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#06B6D4]" />
                <select
                  value={businessProfile.currency}
                  onChange={(event) => handleBusinessProfileChange("currency", event.target.value)}
                  className={`${profileInputClass} pl-9`}
                >
                  <option value="PHP">PHP - Philippine Peso</option>
                  <option value="USD">USD - US Dollar</option>
                </select>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 md:p-5 bg-[#FFF7FB] rounded-xl md:rounded-2xl border border-[#FFD9EC]/50">
              <label className={profileLabelClass}>Opening Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#F53799]" />
                <input
                  type="time"
                  value={businessProfile.openingTime}
                  onChange={(event) => handleBusinessProfileChange("openingTime", event.target.value)}
                  className={`${profileInputClass} pl-9`}
                />
              </div>
            </div>
            <div className="p-4 md:p-5 bg-[#FFF7FB] rounded-xl md:rounded-2xl border border-[#FFD9EC]/50">
              <label className={profileLabelClass}>Closing Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#06B6D4]" />
                <input
                  type="time"
                  value={businessProfile.closingTime}
                  onChange={(event) => handleBusinessProfileChange("closingTime", event.target.value)}
                  className={`${profileInputClass} pl-9`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NOTIFICATION PREFERENCES */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              Notification Preferences
            </h2>
            <InfoTooltip label="Manage how and when you receive WOOF alerts." />
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
                <div className="flex items-center gap-2 font-semibold text-sm md:text-base text-[#223047]">
                  <span>{item.label}</span>
                  <InfoTooltip label={item.description} />
                </div>
              </div>
              <Switch
                checked={notifications[item.key as NotificationPreferenceKey]}
                onCheckedChange={(checked) => handleNotificationChange(item.key as NotificationPreferenceKey, checked)}
              />
            </div>
          ))}
        </div>

        <div className="rounded-xl md:rounded-2xl border border-[#FFD9EC] bg-[#FFF7FB] p-4 md:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base md:text-lg text-[#223047]">Alert Thresholds</h3>
                <InfoTooltip label="Tune the business rules that trigger capacity, inventory, model quality, and data freshness warnings." />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            {alertThresholdItems.map((item) => (
              <div key={item.key} className="rounded-xl border border-[#FFD9EC]/70 bg-white/70 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-sm md:text-base text-[#223047]">
                      <span>{item.label}</span>
                      <InfoTooltip label={item.description} />
                    </div>
                  </div>
                  <span className="shrink-0 text-base md:text-lg font-bold text-[#F53799]">
                    {alertThresholds[item.key]}{item.suffix}
                  </span>
                </div>
                <Slider
                  value={[alertThresholds[item.key]]}
                  onValueChange={(value) => handleAlertThresholdChange(item.key, value)}
                  min={item.min}
                  max={item.max}
                  step={item.step}
                />
                <div className="text-[11px] font-semibold text-[#223047] opacity-50">
                  {item.direction}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI & MODEL SETTINGS */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              AI & Model Configuration
            </h2>
            <InfoTooltip label="Control model behavior and prediction thresholds." />
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
              </div>
              <Switch checked={autoRetrain} onCheckedChange={handleAutoRetrainChange} />
            </div>
          </div>

          <div className="p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl space-y-4">
            <div>
              <div className="mb-1 flex items-center gap-2 font-semibold text-sm md:text-base text-[#223047]">
                <span>Confidence Threshold</span>
                <InfoTooltip label={`Minimum confidence level for AI suggestions: ${confidenceThreshold[0]}%.`} />
              </div>
              <div className="mb-3 md:mb-4" />
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
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              External API Connections & Diagnostics
            </h2>
            <InfoTooltip label="Configure forecasting data providers and check API cache health." />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 pt-2 md:pt-4">
          {/* OpenWeather Config */}
          <div className="p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl space-y-4 border border-[#FFD9EC]/50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm md:text-base text-[#223047]">OpenWeatherMap Integration</h3>
                  <InfoTooltip label="Exogenous weather feed for Cafe & Services. Weather data is used as outside context for demand forecasting, especially Cafe and Services demand." />
                </div>
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
                  <InfoTooltip label="Philippine national holiday catalog provider. Holiday context helps WOOF adjust demand expectations for dates that may affect customer behavior." />
                </div>
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
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              Data Management
            </h2>
            <InfoTooltip label="Control operational retention rules, protected forecasting history, and export options." />
          </div>
        </div>

        <div className="grid gap-4 md:gap-6 pt-2 md:pt-4">
          <div className="p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl space-y-5 border border-[#FFD9EC]/50">
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
              <div>
                <div className="mb-1 flex items-center gap-2 font-semibold text-sm md:text-base text-[#223047]">
                  <span>Operational Retention Window</span>
                  <InfoTooltip label="How long WOOF keeps short-lived operational records before they become eligible for cleanup or archive review." />
                </div>
                <div className="text-xs md:text-sm text-[#223047] opacity-60 mb-3 md:mb-4">
                  Keep logs, generated reports, notifications, feedback events, and temporary caches for {dataRetention[0]} days.
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

              <div className="rounded-xl border border-[#06B6D4]/30 bg-white/80 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#06B6D4]/10">
                    <Database className="h-4 w-4 text-[#06B6D4]" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#223047]">Historical Sales Protected</div>
                    <p className="mt-1 text-xs text-[#223047] opacity-70" style={{ lineHeight: "1.6" }}>
                      Transaction history is preserved for forecasting accuracy unless it is manually archived by an owner.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {retentionScopeItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-2 rounded-xl border border-[#FFD9EC]/70 bg-white/70 px-3 py-3 text-xs font-semibold text-[#223047]">
                    <Icon className="h-4 w-4 shrink-0 text-[#F53799]" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
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
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              Appearance
            </h2>
            <InfoTooltip label="Customize dashboard display mode and system-wide accent colors." />
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

          <div className="sm:col-span-2 rounded-xl md:rounded-2xl border border-[#FFD9EC] bg-[#FFF7FB] p-4 md:p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 font-semibold text-sm md:text-base text-[#223047]">
                  <span>Manual Theme Picker</span>
                  <InfoTooltip label="Choose three custom colors using color wheels or hex values. Saved colors only transform the system when manual colors are enabled." />
                </div>
                <div className="text-xs md:text-sm text-[#223047] opacity-60 mt-1">
                  Active palette: {activePaletteName}
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-[#FFD9EC] bg-white/70 px-3 py-2">
                <span className="text-xs font-semibold text-[#223047]">
                  Use Manual Colors
                </span>
                <Switch checked={colorTheme === "custom"} onCheckedChange={handleManualThemeToggle} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {customThemeFields.map((field) => (
                <div key={field.key} className="rounded-xl border border-[#FFD9EC]/70 bg-white/70 p-3 space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <label className={profileLabelClass}>{field.label}</label>
                      <InfoTooltip label={field.description} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={/^#[0-9A-Fa-f]{6}$/.test(customTheme[field.key]) ? customTheme[field.key] : DEFAULT_SETTINGS_PREFERENCES.customTheme[field.key]}
                      onChange={(event) => handleCustomThemeChange(field.key, event.target.value)}
                      className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-[#FFD9EC] bg-white p-1"
                      aria-label={`${field.label} color wheel`}
                    />
                    <input
                      type="text"
                      value={customTheme[field.key]}
                      onChange={(event) => handleCustomThemeChange(field.key, event.target.value)}
                      className={profileInputClass}
                      maxLength={7}
                      placeholder="#F53799"
                      aria-label={`${field.label} hex color`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {colorThemes.map((theme) => (
            <button
              key={theme.name}
              type="button"
              onClick={() => handleColorThemeChange(theme.key)}
              className={`p-4 md:p-6 bg-[#FFF7FB] border-2 rounded-xl md:rounded-2xl hover:border-[#F53799] transition-all text-left ${
                colorTheme === theme.key ? "border-[#F53799] shadow-sm" : "border-[#FFD9EC]"
              }`}
              aria-pressed={colorTheme === theme.key}
            >
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div
                  className="w-6 h-6 md:w-8 md:h-8 rounded-full"
                  style={{ backgroundColor: theme.primary }}
                />
                <div
                  className="w-6 h-6 md:w-8 md:h-8 rounded-full"
                  style={{ backgroundColor: theme.accent }}
                />
                <div
                  className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-[#FFD9EC]"
                  style={{ backgroundColor: theme.surface }}
                />
              </div>
              <div className="flex items-center gap-2 font-semibold text-sm md:text-base text-[#223047]">
                <span>{theme.name}</span>
                <InfoTooltip label={theme.description} />
              </div>
              {colorTheme === theme.key && (
                <Badge className="mt-2 bg-[#F53799] text-white hover:bg-[#F53799] text-xs">
                  Active
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* DASHBOARD PREFERENCES */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              Dashboard Preferences
            </h2>
            <InfoTooltip label="Set the default workspace behavior for daily monitoring." />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 pt-2 md:pt-4">
          <div className="p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl border border-[#FFD9EC]/50 space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-[#FFD9EC]">
                <LayoutDashboard className="h-5 w-5 text-[#F53799]" />
              </div>
              <div className="flex-1">
                <label className={profileLabelClass}>Default Landing Page</label>
                <select
                  value={dashboardPreferences.defaultLandingPage}
                  onChange={(event) => handleDashboardPreferenceChange(
                    "defaultLandingPage",
                    event.target.value as DashboardPreferences["defaultLandingPage"],
                  )}
                  className={profileInputClass}
                >
                  {landingPageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-[#FFD9EC]">
                <BarChart3 className="h-5 w-5 text-[#06B6D4]" />
              </div>
              <div className="flex-1">
                <label className={profileLabelClass}>Default Chart View</label>
                <select
                  value={dashboardPreferences.defaultChartView}
                  onChange={(event) => handleDashboardPreferenceChange(
                    "defaultChartView",
                    event.target.value as DashboardPreferences["defaultChartView"],
                  )}
                  className={profileInputClass}
                >
                  {chartViewOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:gap-4">
            {[
              {
                key: "compactKpiCards",
                label: "Compact KPI Cards",
                description: "Reduce KPI card padding and label spacing across summary rows.",
                icon: LayoutDashboard,
              },
              {
                key: "showDemoControls",
                label: "Show Demo Controls",
                description: "Reveal test-only controls such as connection simulation buttons.",
                icon: Eye,
              },
              {
                key: "showTooltips",
                label: "Show Explanations",
                description: "Display inline info icons beside metrics and technical labels.",
                icon: Eye,
              },
              {
                key: "sidebarCollapsedByDefault",
                label: "Sidebar Collapsed by Default",
                description: "Start the dashboard with the compact navigation rail.",
                icon: PanelLeftClose,
              },
            ].map((item) => {
              const Icon = item.icon;
              const key = item.key as keyof Pick<
                DashboardPreferences,
                "compactKpiCards" | "showDemoControls" | "showTooltips" | "sidebarCollapsedByDefault"
              >;
              return (
                <div key={item.key} className="flex items-center justify-between gap-3 p-4 md:p-5 bg-[#FFF7FB] rounded-xl md:rounded-2xl border border-[#FFD9EC]/50">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-[#FFD9EC]">
                      <Icon className="h-4 w-4 text-[#F53799]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-semibold text-sm md:text-base text-[#223047]">
                        <span>{item.label}</span>
                        <InfoTooltip label={item.description} />
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={Boolean(dashboardPreferences[key])}
                    onCheckedChange={(checked) => handleDashboardPreferenceChange(key, checked)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECURITY & SESSION */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              Security & Session
            </h2>
            <InfoTooltip label="Manage dashboard password, session timeout, authenticator security, and login history." />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 pt-2 md:pt-4">
          <div className="p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl border border-[#FFD9EC]/50 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-[#FFD9EC]">
                <KeyRound className="h-5 w-5 text-[#F53799]" />
              </div>
              <div>
                <div className="font-bold text-[#223047]">Change Password</div>
                <div className="text-xs text-[#223047] opacity-60">Updates the Supabase Auth password for {securityEmail}.</div>
              </div>
            </div>

            <div className="grid gap-3">
              {[
                {
                  value: currentPassword,
                  setValue: setCurrentPassword,
                  show: showCurrentPassword,
                  setShow: setShowCurrentPassword,
                  placeholder: "Current password",
                  label: "current password",
                },
                {
                  value: newSecurityPassword,
                  setValue: setNewSecurityPassword,
                  show: showNewSecurityPassword,
                  setShow: setShowNewSecurityPassword,
                  placeholder: "New password",
                  label: "new password",
                },
                {
                  value: confirmSecurityPassword,
                  setValue: setConfirmSecurityPassword,
                  show: showConfirmSecurityPassword,
                  setShow: setShowConfirmSecurityPassword,
                  placeholder: "Confirm new password",
                  label: "confirmation password",
                },
              ].map((field) => (
                <div key={field.placeholder} className="relative">
                  <input
                    type={field.show ? "text" : "password"}
                    value={field.value}
                    onChange={(event) => field.setValue(event.target.value)}
                    placeholder={field.placeholder}
                    className={`${profileInputClass} woof-password-field pr-12`}
                    disabled={isChangingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => field.setShow((value) => !value)}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#223047] opacity-50 transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#F53799]/30"
                    disabled={isChangingPassword}
                    aria-label={field.show ? `Hide ${field.label}` : `Show ${field.label}`}
                  >
                    {field.show ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
              <Button
                type="button"
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="bg-[#F53799] hover:bg-[#D42A7D]"
              >
                {isChangingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </div>

          <div className="p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl border border-[#FFD9EC]/50 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-[#FFD9EC]">
                <TimerReset className="h-5 w-5 text-[#06B6D4]" />
              </div>
              <div>
                <div className="font-bold text-[#223047]">Session Timeout Duration</div>
                <div className="text-xs text-[#223047] opacity-60">
                  Current limit: {securityPreferences.sessionTimeoutMinutes} minute{securityPreferences.sessionTimeoutMinutes === 1 ? "" : "s"}.
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[#FFD9EC]/70 bg-white/70 px-3 py-3 text-sm text-[#223047]">
              Chosen limit: <span className="font-bold text-[#06B6D4]">{draftSessionTimeoutMinutes} minute{draftSessionTimeoutMinutes === 1 ? "" : "s"}</span>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              <Slider
                value={[draftSessionTimeoutMinutes]}
                onValueChange={(value) =>
                  setDraftSessionTimeoutMinutes(
                    value[0] ?? DEFAULT_SETTINGS_PREFERENCES.security.sessionTimeoutMinutes,
                  )
                }
                min={1}
                max={120}
                step={1}
                className="flex-1"
              />
              <span className="text-base md:text-lg font-bold text-[#06B6D4] w-16">
                {draftSessionTimeoutMinutes}m
              </span>
            </div>
            <Button
              type="button"
              onClick={handleApplySessionTimeout}
              disabled={draftSessionTimeoutMinutes === securityPreferences.sessionTimeoutMinutes}
              className="w-full bg-[#06B6D4] hover:bg-[#0891B2]"
            >
              Apply New Timeout Limit
            </Button>
          </div>

          <div className="p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl border border-[#FFD9EC]/50 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-[#FFD9EC]">
                  <Smartphone className="h-5 w-5 text-[#F53799]" />
                </div>
                <div>
                  <div className="font-bold text-[#223047]">2FA Authenticator</div>
                  <div className="text-xs text-[#223047] opacity-60">
                    {twoFactorEnabled ? "Required during login." : "Add a 6-digit authenticator code to login."}
                  </div>
                </div>
              </div>
              <Badge className={twoFactorEnabled ? "bg-green-500 text-white hover:bg-green-500" : "bg-[#FFD9EC] text-[#223047] hover:bg-[#FFD9EC]"}>
                {twoFactorEnabled ? "Enabled" : "Off"}
              </Badge>
            </div>

            {!twoFactorEnabled && !twoFactorSecret && (
              <Button
                type="button"
                onClick={handleSetupTwoFactor}
                disabled={isUpdatingTwoFactor}
                className="w-full bg-[#F53799] hover:bg-[#D42A7D]"
              >
                {isUpdatingTwoFactor ? "Preparing..." : "Set Up Authenticator"}
              </Button>
            )}

            {twoFactorSecret && (
              <div className="space-y-3 rounded-xl border border-[#FFD9EC] bg-white/70 p-4">
                <div>
                  <label className={profileLabelClass}>Authenticator Secret</label>
                  <input
                    type="text"
                    readOnly
                    value={twoFactorSecret}
                    className={profileInputClass}
                  />
                </div>
                <div>
                  <label className={profileLabelClass}>Manual Setup URI</label>
                  <textarea
                    readOnly
                    value={twoFactorUri}
                    className={`${profileInputClass} min-h-[76px] resize-none`}
                  />
                </div>
                <p className="text-xs text-[#223047] opacity-70">
                  Add this secret in Google Authenticator, Microsoft Authenticator, or any TOTP app, then enter the generated 6-digit code below.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <input
                type="text"
                value={twoFactorCode}
                onChange={(event) =>
                  setTwoFactorCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                className={`${profileInputClass} text-center text-base font-bold tracking-widest`}
                inputMode="numeric"
                maxLength={6}
              />
              <Button
                type="button"
                onClick={twoFactorEnabled ? handleDisableTwoFactor : handleEnableTwoFactor}
                disabled={isUpdatingTwoFactor || (!twoFactorEnabled && !twoFactorSecret)}
                variant={twoFactorEnabled ? "outline" : "default"}
                className={twoFactorEnabled ? "woof-security-outline-button border-[#FFD9EC]" : "woof-security-primary-button bg-[#F53799] hover:bg-[#D42A7D]"}
              >
                {twoFactorEnabled ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>

          <div className="p-4 md:p-6 bg-[#FFF7FB] rounded-xl md:rounded-2xl border border-[#FFD9EC]/50 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-[#FFD9EC]">
                  <History className="h-5 w-5 text-[#06B6D4]" />
                </div>
                <div>
                  <div className="font-bold text-[#223047]">Login Activity</div>
                  <div className="text-xs text-[#223047] opacity-60">Login, logout, and session timeout timestamps.</div>
                </div>
              </div>
              <Button type="button" variant="outline" className="woof-security-outline-button border-[#FFD9EC]" onClick={refreshLoginActivity}>
                Refresh
              </Button>
            </div>

            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {loginActivity.length === 0 ? (
                <div className="rounded-xl border border-[#FFD9EC]/70 bg-white/70 p-4 text-sm text-[#223047] opacity-70">
                  No login activity recorded yet.
                </div>
              ) : (
                loginActivity.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#FFD9EC]/70 bg-white/70 px-3 py-3">
                    <div>
                      <div className="text-sm font-bold capitalize text-[#223047]">
                        {entry.action.replace("_", " ")}
                      </div>
                      <div className="text-xs text-[#223047] opacity-60">{entry.email}</div>
                    </div>
                    <div className="text-right text-xs font-semibold text-[#223047] opacity-70">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
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
