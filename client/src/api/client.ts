export const API_BASE = import.meta.env.VITE_API_URL || '';

function getHeaders(isFormData = false): HeadersInit {
  const headers: HeadersInit = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('watchly_access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, { headers: getHeaders() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function apiPost<T>(path: string, data?: unknown | FormData): Promise<T> {
  const isFormData = data instanceof FormData;
  const res = await fetch(`${API_BASE}/api${path}`, {
    method: 'POST',
    headers: getHeaders(isFormData),
    body: isFormData ? (data as FormData) : data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function apiPatch<T>(path: string, data?: unknown | FormData): Promise<T> {
  const isFormData = data instanceof FormData;
  const res = await fetch(`${API_BASE}/api${path}`, {
    method: 'PATCH',
    headers: getHeaders(isFormData),
    body: isFormData ? (data as FormData) : JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}
