import { apiFetch, asData, jsonBody } from './http.js';

export const utilisateurApi = {
  list: async () => asData(await apiFetch('/utilisateurs')),
  create: (payload) => apiFetch('/utilisateurs', { method: 'POST', body: jsonBody(payload) }),
  update: (id, payload) => apiFetch(`/utilisateurs/${id}`, { method: 'PUT', body: jsonBody(payload) }),
  toggle: (id) => apiFetch(`/utilisateurs/${id}/toggle`, { method: 'PUT' }),
  historique: async (id) => asData(await apiFetch(`/utilisateurs/${id}/historique`)),
  remove: (id) => apiFetch(`/utilisateurs/${id}`, { method: 'DELETE' }),
};
