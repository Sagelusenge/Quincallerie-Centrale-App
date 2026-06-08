import { apiFetch, asData, jsonBody } from './http.js';

export const clientApi = {
  list: async () => asData(await apiFetch('/clients')),
  detail: async (id) => asData(await apiFetch(`/clients/${id}`)),
  create: (payload) => apiFetch('/clients', { method: 'POST', body: jsonBody(payload) }),
  update: (id, payload) => apiFetch(`/clients/${id}`, { method: 'PUT', body: jsonBody(payload) }),
  remove: (id) => apiFetch(`/clients/${id}`, { method: 'DELETE' }),
};
