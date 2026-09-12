export type NotificationPreferenceKey = "alerts" | "suggestions" | "reports" | "system";
export type ColorThemeKey = "pink" | "ocean" | "mint" | "slate" | "custom";

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

export type BusinessProfilePreferences = {
  businessName: string;
  branchName: string;
  location: string;
  timezone: string;
  currency: string;
  openingTime: string;
  closingTime: string;
};

export type CustomThemePreferences = {
  primary: string;
  accent: string;
  surface: string;
};

export type SettingsPreferences = {
  businessProfile: BusinessProfilePreferences;
  notifications: NotificationPreferences;
  autoRetrain: boolean;
  confidenceThreshold: number;
  dataRetention: number;
  theme: "light" | "dark";
  colorTheme: ColorThemeKey;
  customTheme: CustomThemePreferences;
};

export const DEFAULT_SETTINGS_PREFERENCES: SettingsPreferences = {
  businessProfile: {
    businessName: "Happy Tails",
    branchName: "Main Branch",
    location: "Lucena City, Philippines",
    timezone: "Asia/Manila",
    currency: "PHP",
    openingTime: "08:00",
    closingTime: "20:00",
  },
  notifications: {
    alerts: true,
    suggestions: true,
    reports: false,
    system: true,
  },
  autoRetrain: true,
  confidenceThreshold: 80,
  dataRetention: 90,
  theme: "light",
  colorTheme: "pink",
  customTheme: {
    primary: "#F53799",
    accent: "#06B6D4",
    surface: "#FFF7FB",
  },
};

const SETTINGS_KEY = "woofSettingsPreferences";
const LEGACY_THEME_KEY = "woofTheme";
const PREFERENCES_EVENT = "woof:settings-preferences-changed";
const THEME_CLASSES = ["woof-theme-pink", "woof-theme-ocean", "woof-theme-mint", "woof-theme-slate", "woof-theme-custom"];

function normalizeHexColor(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value)
    ? value.toUpperCase()
    : fallback;
}

function normalizePreferences(value: Partial<SettingsPreferences> | null): SettingsPreferences {
  return {
    ...DEFAULT_SETTINGS_PREFERENCES,
    ...value,
    notifications: {
      ...DEFAULT_SETTINGS_PREFERENCES.notifications,
      ...(value?.notifications ?? {}),
    },
    businessProfile: {
      ...DEFAULT_SETTINGS_PREFERENCES.businessProfile,
      ...(value?.businessProfile ?? {}),
    },
    confidenceThreshold:
      typeof value?.confidenceThreshold === "number"
        ? value.confidenceThreshold
        : DEFAULT_SETTINGS_PREFERENCES.confidenceThreshold,
    dataRetention:
      typeof value?.dataRetention === "number"
        ? value.dataRetention
        : DEFAULT_SETTINGS_PREFERENCES.dataRetention,
    theme: value?.theme === "dark" ? "dark" : "light",
    colorTheme:
      value?.colorTheme === "ocean" || value?.colorTheme === "mint" || value?.colorTheme === "slate" || value?.colorTheme === "custom"
        ? value.colorTheme
        : DEFAULT_SETTINGS_PREFERENCES.colorTheme,
    customTheme: {
      primary: normalizeHexColor(value?.customTheme?.primary, DEFAULT_SETTINGS_PREFERENCES.customTheme.primary),
      accent: normalizeHexColor(value?.customTheme?.accent, DEFAULT_SETTINGS_PREFERENCES.customTheme.accent),
      surface: normalizeHexColor(value?.customTheme?.surface, DEFAULT_SETTINGS_PREFERENCES.customTheme.surface),
    },
  };
}

export function getSettingsPreferences(): SettingsPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS_PREFERENCES;
  }

  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    const parsed = saved ? JSON.parse(saved) as Partial<SettingsPreferences> : null;
    const legacyTheme = localStorage.getItem(LEGACY_THEME_KEY);
    return normalizePreferences({
      ...parsed,
      theme: parsed?.theme ?? (legacyTheme === "dark" ? "dark" : "light"),
    });
  } catch {
    return DEFAULT_SETTINGS_PREFERENCES;
  }
}

export function saveSettingsPreferences(
  next:
    | SettingsPreferences
    | ((current: SettingsPreferences) => SettingsPreferences),
): SettingsPreferences {
  const current = getSettingsPreferences();
  const preferences = normalizePreferences(
    typeof next === "function" ? next(current) : next,
  );

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(preferences));
      localStorage.setItem(LEGACY_THEME_KEY, preferences.theme);
      window.dispatchEvent(new CustomEvent(PREFERENCES_EVENT, { detail: preferences }));
    } catch {
      // Keep the UI responsive even when browser storage is unavailable.
    }
  }

  return preferences;
}

export function applyDocumentColorTheme(
  colorTheme: ColorThemeKey,
  customTheme = DEFAULT_SETTINGS_PREFERENCES.customTheme,
) {
  if (typeof document !== "undefined") {
    document.documentElement.classList.remove(...THEME_CLASSES);
    document.documentElement.classList.add(`woof-theme-${colorTheme}`);

    if (colorTheme === "custom") {
      document.documentElement.style.setProperty("--woof-custom-primary", customTheme.primary);
      document.documentElement.style.setProperty("--woof-custom-primary-strong", customTheme.primary);
      document.documentElement.style.setProperty("--woof-custom-accent", customTheme.accent);
      document.documentElement.style.setProperty("--woof-custom-accent-soft", customTheme.accent);
      document.documentElement.style.setProperty("--woof-custom-surface", customTheme.surface);
      document.documentElement.style.setProperty("--woof-custom-background", customTheme.surface);
      document.documentElement.style.setProperty("--woof-custom-border", customTheme.accent);
    } else {
      [
        "--woof-custom-primary",
        "--woof-custom-primary-strong",
        "--woof-custom-accent",
        "--woof-custom-accent-soft",
        "--woof-custom-surface",
        "--woof-custom-background",
        "--woof-custom-border",
      ].forEach((name) => document.documentElement.style.removeProperty(name));
    }
  }
}

export function applyStoredTheme() {
  const preferences = getSettingsPreferences();
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("woof-dark", preferences.theme === "dark");
    applyDocumentColorTheme(preferences.colorTheme, preferences.customTheme);
  }
  return preferences.theme;
}

export function onSettingsPreferencesChanged(callback: (preferences: SettingsPreferences) => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleCustomEvent = (event: Event) => {
    callback((event as CustomEvent<SettingsPreferences>).detail ?? getSettingsPreferences());
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === SETTINGS_KEY || event.key === LEGACY_THEME_KEY) {
      callback(getSettingsPreferences());
    }
  };

  window.addEventListener(PREFERENCES_EVENT, handleCustomEvent);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(PREFERENCES_EVENT, handleCustomEvent);
    window.removeEventListener("storage", handleStorage);
  };
}
