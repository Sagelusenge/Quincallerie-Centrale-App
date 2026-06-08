import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../api/dashboardApi.js';

export const useDashboardStats = () => useQuery({ queryKey: ['dashboard', 'stats'], queryFn: dashboardApi.stats });
export const useAlertesStock = () => useQuery({ queryKey: ['dashboard', 'alertes-stock'], queryFn: dashboardApi.alertesStock });
export const useProduitsPlusVendus = () => useQuery({ queryKey: ['dashboard', 'produits-plus-vendus'], queryFn: dashboardApi.produitsPlusVendus });
export const useVentesMensuelles = () => useQuery({ queryKey: ['dashboard', 'ventes-mensuelles'], queryFn: dashboardApi.ventesMensuelles });
