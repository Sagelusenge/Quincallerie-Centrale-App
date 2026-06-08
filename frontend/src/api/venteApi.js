import { API_URL, apiFetch, asData, getToken, jsonBody } from './http.js';

const fetchPdf = async (path) => {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error('Impossible de generer la facture PDF');
  }

  return response.blob();
};

export const venteApi = {
  list: async () => asData(await apiFetch('/ventes')),
  detail: async (id) => asData(await apiFetch(`/ventes/${id}`)),
  pdf: (id) => fetchPdf(`/ventes/${id}/pdf`),
  create: (payload) => apiFetch('/ventes', { method: 'POST', body: jsonBody(payload) }),
  update: (id, payload) => apiFetch(`/ventes/${id}`, { method: 'PUT', body: jsonBody(payload) }),
  remove: (id) => apiFetch(`/ventes/${id}`, { method: 'DELETE' }),
};
