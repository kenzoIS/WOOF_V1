const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/backend-api';

async function request(
  path: string,
  options?: RequestInit,
  unavailableMessage = 'Backend unavailable. Start the backend server on port 3001 and try again.',
) {
  try {
    return await fetch(`${API_BASE}${path}`, options);
  } catch (error) {
    throw new Error(
      error instanceof TypeError
        ? unavailableMessage
        : error instanceof Error
          ? error.message
          : unavailableMessage,
    );
  }
}

async function apiError(
  response: Response,
  fallback: string,
): Promise<Error> {
  if (response.status >= 500) {
    return new Error(
      'Backend unavailable. Check that MongoDB is configured and the backend is running on port 3001.',
    );
  }
  const body = await response.json().catch(() => null);
  const message = Array.isArray(body?.message)
    ? body.message.join(', ')
    : body?.message;
  return new Error(message || fallback);
}

export interface ForecastRun {
  _id: string;
  module: 'Cafe' | 'Services';
  modelName: string;
  mase: number;
  mape: number;
  accuracy: number;
  isFallback: boolean;
  historical: Array<{
    date: string;
    actual: number;
    normalized: number;
    orders: number;
    fitted?: number;
  }>;
  forecast: Array<{
    date: string;
    forecast: number;
    confidenceLow?: number;
    confidenceHigh?: number;
  }>;
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    totalQuantity: number;
    totalItems: number;
    avgOrderValue: number;
  };
  topItems: Array<{
    name: string;
    revenue: number;
    quantity: number;
    orderCount: number;
    avgPrice: number;
    category: string;
  }>;
  modelMetadata: Record<string, unknown>;
  generatedAt: string;
}

export interface CrossSellQuery {
  minSupport?: string;
  minConfidence?: string;
  minLift?: string;
  maxBundleCandidates?: string;
  hour?: string;
  forceRefresh?: string;
}

async function fetchApi(path: string, options?: RequestInit) {
  const res = await request(path, {
    ...options,
    headers: {
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw await apiError(res, res.statusText || 'API request failed');
  }
  return res.json();
}

function toQueryString(params?: object) {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string] => entry[1] !== undefined,
  );
  return entries.length ? '?' + new URLSearchParams(entries).toString() : '';
}

// CSV Upload APIs
export async function uploadCSV(file: File, channel?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (channel) {
    formData.append('channel', channel);
  }
  const res = await request('/csv/upload', {
    method: 'POST',
    body: formData,
  }, 'Upload could not reach the backend. Make sure the backend is running on port 3001.');
  if (!res.ok) {
    throw await apiError(res, res.statusText || 'Upload failed');
  }
  return res.json();
}

export async function uploadHistoricalCSV(
  file: File,
  module: 'cafe' | 'services',
) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await request(`/csv/historical/${module}`, {
    method: 'POST',
    body: formData,
  }, 'Historical upload could not reach the backend. Make sure the backend is running on port 3001.');
  if (!res.ok) {
    throw await apiError(res, res.statusText || 'Historical upload failed');
  }
  return res.json();
}

export async function getUploads() {
  return fetchApi('/csv/uploads');
}

export async function deleteUpload(id: string) {
  return fetchApi(`/csv/uploads/${id}`, { method: 'DELETE' });
}

export async function getMetrics() {
  return fetchApi('/csv/metrics');
}

// Analytics APIs
export async function getDashboard(sector: string) {
  return fetchApi(`/analytics/dashboard/${sector}`);
}

export async function getForecast(
  sector: string,
  params?: Record<string, string>,
): Promise<ForecastRun> {
  const query = toQueryString(params);
  return fetchApi(`/analytics/forecast/${sector}${query}`);
}

export async function getCrossSell(params?: CrossSellQuery) {
  const query = toQueryString(params);
  return fetchApi(`/analytics/cross-sell${query}`);
}

export async function getCrossSellConfig(params?: CrossSellQuery) {
  const query = toQueryString(params);
  return fetchApi(`/analytics/cross-sell/config${query}`);
}

export async function getCrossSellBySector(params?: CrossSellQuery) {
  const query = toQueryString(params);
  return fetchApi(`/analytics/cross-sell/by-sector${query}`);
}

export async function getCrossSellBundles(params?: CrossSellQuery) {
  const query = toQueryString(params);
  return fetchApi(`/analytics/cross-sell/bundles${query}`);
}

export async function getRetailForecastByChannel() {
  return fetchApi('/analytics/forecast-by-channel/retail');
}

export async function getCurrentWeather() {
  return fetchApi('/analytics/weather/current');
}

export async function getExogenousStatus() {
  return fetchApi('/analytics/exogenous/status');
}

