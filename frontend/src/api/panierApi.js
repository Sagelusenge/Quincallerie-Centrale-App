import { apiFetch, asData, jsonBody } from './http.js';

export const panierApi = {
  list: async () => asData(await apiFetch('/paniers')),
  detail: async (id) => asData(await apiFetch(`/paniers/${id}`)),
  create: (payload) => apiFetch('/paniers', { method: 'POST', body: jsonBody(payload) }),
  update: (id, payload) => apiFetch(`/paniers/${id}`, { method: 'PUT', body: jsonBody(payload) }),
  convertir: (id) => apiFetch(`/paniers/${id}/convertir`, { method: 'POST' }),
  annuler: (id) => apiFetch(`/paniers/${id}/annuler`, { method: 'PUT' }),
  remove: (id) => apiFetch(`/paniers/${id}`, { method: 'DELETE' }),
};
