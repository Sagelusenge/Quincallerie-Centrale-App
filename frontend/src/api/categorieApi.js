import { apiFetch, asData, jsonBody } from './http.js';

export const categorieApi = {
  list: async () => asData(await apiFetch('/categories')),
  create: (payload) => apiFetch('/categories', { method: 'POST', body: jsonBody(payload) }),
  update: (id, payload) => apiFetch(`/categories/${id}`, { method: 'PUT', body: jsonBody(payload) }),
  remove: (id) => apiFetch(`/categories/${id}`, { method: 'DELETE' }),
};
