export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getToken = () => {
  try {
    const session = JSON.parse(localStorage.getItem('quincaillerie_auth') || 'null');
    return session?.token || localStorage.getItem('token');
  } catch {
    return localStorage.getItem('token');
  }
};

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (response.status === 401) {
    localStorage.removeItem('quincaillerie_auth');
    localStorage.removeItem('token');
    if (!window.location.pathname.includes('/login')) {
      window.location.assign('/login');
    }
  }

  if (!response.ok || payload?.success === false) {
    throw new ApiError(payload?.message || 'Erreur API', response.status, payload);
  }

  return payload;
}

export const asData = (payload) => payload?.data ?? payload;
export const jsonBody = (body) => JSON.stringify(body);
