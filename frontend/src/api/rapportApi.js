import { apiFetch, asData } from './http.js';

export const rapportApi = {
  factures: async () => asData(await apiFetch('/rapports/factures')),
  creances: async () => asData(await apiFetch('/rapports/creances')),
  stockInventaire: async () => asData(await apiFetch('/rapports/stock-inventaire')),
  topAcheteurs: async () => asData(await apiFetch('/rapports/top-acheteurs')),
  historiqueClient: async (id) => asData(await apiFetch(`/rapports/historique-client/${id}`)),
};
