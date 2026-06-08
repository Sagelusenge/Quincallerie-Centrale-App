import { apiFetch, asData } from './http.js';

export const dashboardApi = {
  stats: async () => asData(await apiFetch('/dashboard/stats')),
  ventesMensuelles: async () => asData(await apiFetch('/dashboard/ventes-mensuelles')),
  alertesStock: async () => asData(await apiFetch('/dashboard/alertes-stock')),
  produitsPlusVendus: async () => asData(await apiFetch('/dashboard/produits-plus-vendus')),
};
