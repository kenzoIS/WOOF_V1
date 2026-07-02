import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Bell, Calendar, Cloud, CloudRain, Sun, X, LogOut, User, Mail, Menu } from "lucide-react";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { getCurrentWeather } from "../lib/api";
import {
  HISTORY_START_DATE,
  INGESTED_HISTORY_END_DATE,
  encodeCustomRange,
} from "../lib/dateRanges";

interface Notification {
  id: string;
  type: "alert" | "suggestion" | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [dateRange, setDateRange] = useState("last-7-days");
  const [customStartDate, setCustomStartDate] = useState(HISTORY_START_DATE);
  const [customEndDate, setCustomEndDate] = useState(INGESTED_HISTORY_END_DATE);

  useEffect(() => {
    const saved = localStorage.getItem("globalDateRange");
    if (saved) {
      setDateRange(saved);
      if (saved.startsWith("custom:")) {
        const [, start, end] = saved.split(":");
        setCustomStartDate(start || HISTORY_START_DATE);
        setCustomEndDate(end || INGESTED_HISTORY_END_DATE);
      }
      // Dispatch immediately so page components mount with the correct value
      window.dispatchEvent(new CustomEvent("globalDateRangeChanged", { detail: saved }));
    }
  }, []);

  const handleDateRangeChange = (value: string) => {
    if (value === "custom") {
      setDateRange("custom");
      return;
    }
    setDateRange(value);
    localStorage.setItem("globalDateRange", value);
    window.dispatchEvent(new CustomEvent("globalDateRangeChanged", { detail: value }));
  };

  const applyCustomDateRange = () => {
    const encoded = encodeCustomRange(customStartDate, customEndDate);
    setDateRange(encoded);
    localStorage.setItem("globalDateRange", encoded);
    window.dispatchEvent(new CustomEvent("globalDateRangeChanged", { detail: encoded }));
  };

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentWeather, setCurrentWeather] = useState<{
    tempCelsius: number;
    rainfallMm: number;
    isSynthetic: boolean;
  } | null>(null);

  useEffect(() => {
    getCurrentWeather()
      .then(setCurrentWeather)
      .catch(() => {});
  }, []);

  const userEmail = localStorage.getItem("userEmail") || "user@happytails.com";
  const userInitials = userEmail
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "WU";
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "suggestion",
      title: "New AI Suggestion",
      message: "Cappuccino + Grooming bundle ready for deployment",
      time: "5 min ago",
      read: false,
    },
    {
      id: "2",
      type: "alert",
      title: "Spoilage Alert",
      message: "Premium Dog Food expires in 6 days",
      time: "1 hour ago",
      read: false,
    },
    {
      id: "3",
      type: "system",
      title: "Model Retrained",
      message: "Prophet model updated with latest data",
      time: "2 hours ago",
      read: false,
    },
  ]);
  
  const weatherIcons = {
    sunny: Sun,
    rainy: CloudRain,
    cloudy: Cloud,
  };
  
  const WeatherIcon = currentWeather && currentWeather.rainfallMm > 0.5 
    ? weatherIcons.rainy 
    : (currentWeather && currentWeather.tempCelsius < 26 ? weatherIcons.cloudy : weatherIcons.sunny);
  
  const weatherTempString = currentWeather ? `${Math.round(currentWeather.tempCelsius)}°C` : "28°C";
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleSignOut = () => {
    localStorage.removeItem("woofAuth");
    localStorage.removeItem("userType");
    localStorage.removeItem("userEmail");
    toast.success("Signed out successfully");
    router.push("/login");
  };


  const getNotificationColor = (type: string) => {
    switch (type) {
      case "alert":
        return "border-l-[#F53799]";
      case "suggestion":
        return "border-l-[#3AE4FA]";
      case "system":
        return "border-l-[#5CE1E6]";
      default:
        return "border-l-[#FFD9EC]";
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setNotificationOpen(false);
      setProfileOpen(false);
    };

    if (notificationOpen || profileOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [notificationOpen, profileOpen]);
  
  return (
    <>
      <header className="h-16 bg-white border-b border-[#FFD9EC] flex items-center justify-between px-3 md:px-6 shrink-0">
        {/* Left: Menu button (mobile) + Branding */}
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-[#FFF2FA] rounded-lg transition-colors flex-shrink-0"
          >
            <Menu className="w-5 h-5 text-[#223047]" />
          </button>

          <div className="min-w-0">
            <div className="text-sm md:text-base font-bold text-[#223047] truncate">Happy Tails</div>
            <div className="text-xs text-[#223047] opacity-50 hidden sm:block truncate">Autonomous Revenue Intelligence</div>
          </div>
        </div>

        {/* Center: Global Date Range (hidden on small mobile) */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0 absolute left-1/2 -translate-x-1/2">
          <Calendar className="w-4 h-4 text-[#223047] opacity-50" />
          <Select
            value={dateRange.startsWith("custom:") ? "custom" : dateRange}
            onValueChange={handleDateRangeChange}
          >
            <SelectTrigger className="w-[160px] lg:w-[200px] border-[#FFD9EC] focus:ring-[#F53799]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="center">
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last-7-days">Last 7 Days</SelectItem>
              <SelectItem value="last-30-days">Last 30 Days</SelectItem>
              <SelectItem value="last-90-days">Last 90 Days</SelectItem>
              <SelectItem value="last-12-months">Last 12 Months</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(dateRange === "custom" || dateRange.startsWith("custom:")) && (
          <div className="hidden lg:flex items-center gap-2 absolute left-1/2 translate-x-[110px]">
            <input
              type="date"
              min={HISTORY_START_DATE}
              max={INGESTED_HISTORY_END_DATE}
              value={customStartDate}
              onChange={(event) => setCustomStartDate(event.target.value)}
              className="h-9 w-[130px] rounded-md border border-[#FFD9EC] px-2 text-xs text-[#223047] focus:outline-none focus:ring-2 focus:ring-[#F53799]"
              title="Historical data starts on March 1, 2021"
            />
            <input
              type="date"
              min={customStartDate || HISTORY_START_DATE}
              value={customEndDate}
              onChange={(event) => setCustomEndDate(event.target.value)}
              className="h-9 w-[130px] rounded-md border border-[#FFD9EC] px-2 text-xs text-[#223047] focus:outline-none focus:ring-2 focus:ring-[#F53799]"
              title="Descriptive panels stop at May 31, 2026; forecast panels may show later dates when available"
            />
            <Button
              size="sm"
              onClick={applyCustomDateRange}
              className="h-9 bg-[#F53799] hover:bg-[#D42A7D] text-xs"
            >
              Apply
            </Button>
          </div>
        )}

        {/* Right: Status Pills, Weather, Notifications, Avatar */}
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          {/* Channel Status Pills (hidden on mobile) */}
          <div className="hidden xl:flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 border-[#FFD9EC]">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="text-xs">POS</span>
            </Badge>
            <Badge variant="outline" className="gap-1.5 border-[#FFD9EC]">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="text-xs">Shopee</span>
            </Badge>
            <Badge variant="outline" className="gap-1.5 border-[#FFD9EC]">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="text-xs">Tiktok</span>
            </Badge>
          </div>

          {/* Weather Badge (hidden on small mobile) */}
          <Badge variant="outline" className="hidden sm:flex gap-1.5 border-[#FFD9EC]" title={currentWeather?.isSynthetic ? "Synthetic weather fallback" : "Live weather from OpenWeather"}>
            <WeatherIcon className="w-3.5 h-3.5" />
            <span className="text-xs">{weatherTempString}</span>
          </Badge>

          {/* Notification Bell */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setProfileOpen(false);
              setNotificationOpen(!notificationOpen);
            }}
            className="relative p-2 hover:bg-[#FFF2FA] rounded-lg transition-colors flex-shrink-0"
          >
            <Bell className="w-5 h-5 text-[#223047]" />
            {unreadCount > 0 && (
              <div className="absolute top-1 right-1 w-4 h-4 bg-[#F53799] text-white text-xs rounded-full flex items-center justify-center font-semibold">
                {unreadCount}
              </div>
            )}
          </button>

          {/* User Avatar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setNotificationOpen(false);
              setProfileOpen(!profileOpen);
            }}
            className="relative flex-shrink-0"
          >
            <Avatar className="w-8 h-8 md:w-9 md:h-9 border-2 border-[#FFD9EC] hover:border-[#F53799] transition-colors cursor-pointer">
              <AvatarFallback className="bg-[#F53799] text-white font-semibold text-xs md:text-sm">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </header>

      {/* Profile Dropdown */}
      {profileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-transparent z-40"
            onClick={() => setProfileOpen(false)}
          />

          {/* Dropdown */}
          <div
            className="fixed top-16 right-3 md:right-6 w-[280px] bg-white border border-[#FFD9EC] rounded-2xl shadow-2xl z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* User Info */}
            <div className="p-4 border-b border-[#FFD9EC]">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-12 h-12 border-2 border-[#F53799]">
                  <AvatarFallback className="bg-[#F53799] text-white font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#223047]">
                    WOOF User
                  </div>
                  <div className="text-xs text-[#223047] opacity-60">
                    Happy Tails
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#223047] opacity-70">
                <Mail className="w-3.5 h-3.5" />
                <span className="truncate">{userEmail}</span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <button
                onClick={() => {
                  setProfileOpen(false);
                  router.push("/settings");
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#FFF2FA] transition-colors text-left"
              >
                <User className="w-4 h-4 text-[#223047] opacity-60" />
                <span className="text-sm text-[#223047]">Profile Settings</span>
              </button>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600 font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Notification Panel */}
      {notificationOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setNotificationOpen(false)}
          />

          {/* Panel */}
          <div
            className="fixed top-16 right-3 md:right-6 w-[calc(100vw-1.5rem)] md:w-[380px] max-w-[380px] bg-white border border-[#FFD9EC] rounded-2xl shadow-2xl z-50 max-h-[600px] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-[#FFD9EC] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#223047]">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-[#F53799] hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setNotificationOpen(false)}
                  className="p-1 hover:bg-[#FFF2FA] rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-[#223047]" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#FFD9EC]">
              {["All", "Alerts", "AI Suggestions", "System"].map((tab) => (
                <button
                  key={tab}
                  className="flex-1 px-4 py-2 text-xs font-medium text-[#223047] opacity-60 hover:opacity-100 border-b-2 border-transparent hover:border-[#F53799] transition-all"
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-2">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`w-full p-4 rounded-xl mb-2 text-left transition-all hover:bg-[#FFF7FB] border-l-4 ${
                    notification.read ? "bg-white" : "bg-[#FFF2FA]"
                  } ${getNotificationColor(notification.type)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-[#223047]">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-[#F53799] rounded-full" />
                        )}
                      </div>
                      <p className="text-xs text-[#223047] opacity-70 mb-2" style={{ lineHeight: "1.6" }}>
                        {notification.message}
                      </p>
                      <span className="text-xs text-[#223047] opacity-50">
                        {notification.time}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
