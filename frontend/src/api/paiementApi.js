import { apiFetch, asData, jsonBody } from './http.js';

export const paiementApi = {
  create: (payload) => apiFetch('/paiements', { method: 'POST', body: jsonBody(payload) }),
  rapportCaisse: async () => asData(await apiFetch('/paiements/rapport-caisse')),
  repartition: async () => asData(await apiFetch('/paiements/repartition')),
};
