export type NotificationPreferenceKey = "alerts" | "suggestions" | "reports" | "system";

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

export type SettingsPreferences = {
  notifications: NotificationPreferences;
  autoRetrain: boolean;
  confidenceThreshold: number;
  dataRetention: number;
  theme: "light" | "dark";
};

export const DEFAULT_SETTINGS_PREFERENCES: SettingsPreferences = {
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
};

const SETTINGS_KEY = "woofSettingsPreferences";
const LEGACY_THEME_KEY = "woofTheme";
const PREFERENCES_EVENT = "woof:settings-preferences-changed";

function normalizePreferences(value: Partial<SettingsPreferences> | null): SettingsPreferences {
  return {
    ...DEFAULT_SETTINGS_PREFERENCES,
    ...value,
    notifications: {
      ...DEFAULT_SETTINGS_PREFERENCES.notifications,
      ...(value?.notifications ?? {}),
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

export function applyStoredTheme() {
  const preferences = getSettingsPreferences();
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("woof-dark", preferences.theme === "dark");
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
