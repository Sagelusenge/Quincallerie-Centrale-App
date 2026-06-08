import { useQuery } from '@tanstack/react-query';
import { rapportApi } from '../../api/rapportApi.js';

export const useRapportFactures = () => useQuery({ queryKey: ['rapports', 'factures'], queryFn: rapportApi.factures });
export const useRapportCreances = () => useQuery({ queryKey: ['rapports', 'creances'], queryFn: rapportApi.creances });
export const useRapportStock = () => useQuery({ queryKey: ['rapports', 'stock'], queryFn: rapportApi.stockInventaire });
export const useTopAcheteurs = () => useQuery({ queryKey: ['rapports', 'top-acheteurs'], queryFn: rapportApi.topAcheteurs });
