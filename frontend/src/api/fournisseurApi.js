import { apiFetch, asData, jsonBody } from './http.js';

export const fournisseurApi = {
  list: async () => asData(await apiFetch('/fournisseurs')),
  create: (payload) => apiFetch('/fournisseurs', { method: 'POST', body: jsonBody(payload) }),
  update: (id, payload) => apiFetch(`/fournisseurs/${id}`, { method: 'PUT', body: jsonBody(payload) }),
  remove: (id) => apiFetch(`/fournisseurs/${id}`, { method: 'DELETE' }),
};
