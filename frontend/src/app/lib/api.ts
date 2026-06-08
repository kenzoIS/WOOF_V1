const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchApi(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || 'API request failed');
  }
  return res.json();
}

// CSV Upload APIs
export async function uploadCSV(file: File, channel?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (channel) {
    formData.append('channel', channel);
  }
  const res = await fetch(`${API_BASE}/csv/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || 'Upload failed');
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

export async function getForecast(sector: string) {
  return fetchApi(`/analytics/forecast/${sector}`);
}

export async function getCrossSell() {
  return fetchApi('/analytics/cross-sell');
}

export async function getRetailForecastByChannel() {
  return fetchApi('/analytics/forecast-by-channel/retail');
}
