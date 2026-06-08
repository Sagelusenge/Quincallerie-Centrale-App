import { apiFetch, asData, jsonBody } from './http.js';

export const venteApi = {
  list: async () => asData(await apiFetch('/ventes')),
  detail: async (id) => asData(await apiFetch(`/ventes/${id}`)),
  create: (payload) => apiFetch('/ventes', { method: 'POST', body: jsonBody(payload) }),
  update: (id, payload) => apiFetch(`/ventes/${id}`, { method: 'PUT', body: jsonBody(payload) }),
  remove: (id) => apiFetch(`/ventes/${id}`, { method: 'DELETE' }),
};
