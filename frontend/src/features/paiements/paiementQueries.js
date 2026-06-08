import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paiementApi } from '../../api/paiementApi.js';

export const useCreatePaiement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: paiementApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
      queryClient.invalidateQueries({ queryKey: ['ventes'] });
    },
  });
};
export const useRapportCaisse = () => useQuery({ queryKey: ['paiements', 'rapport-caisse'], queryFn: paiementApi.rapportCaisse });
export const useRepartitionPaiements = () => useQuery({ queryKey: ['paiements', 'repartition'], queryFn: paiementApi.repartition });
