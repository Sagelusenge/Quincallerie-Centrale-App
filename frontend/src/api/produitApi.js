import { apiFetch, asData, jsonBody } from './http.js';

export const produitApi = {
  list: async () => asData(await apiFetch('/produits')),
  mouvements: async () => asData(await apiFetch('/produits/mouvements-recents')),
  create: (payload) => apiFetch('/produits', { method: 'POST', body: jsonBody(payload) }),
  update: (id, payload) => apiFetch(`/produits/${id}`, { method: 'PUT', body: jsonBody(payload) }),
  approvisionner: (id, payload) => apiFetch(`/produits/${id}/approvisionner`, { method: 'POST', body: jsonBody(payload) }),
  remove: (id) => apiFetch(`/produits/${id}`, { method: 'DELETE' }),
};
