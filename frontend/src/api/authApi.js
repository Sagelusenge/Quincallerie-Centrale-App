import { apiFetch, jsonBody } from './http.js';

export const authApi = {
  login: (payload) => apiFetch('/auth/login', { method: 'POST', body: jsonBody(payload) }),
  me: () => apiFetch('/auth/me'),
  forgotPassword: (payload) => apiFetch('/auth/forgot-password', { method: 'POST', body: jsonBody(payload) }),
  changePassword: (payload) => apiFetch('/auth/change-password', { method: 'POST', body: jsonBody(payload) }),
  resetRequestedPassword: (payload) => apiFetch('/auth/reset-request-password', { method: 'POST', body: jsonBody(payload) }),
};
