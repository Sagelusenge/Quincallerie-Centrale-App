import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { venteApi } from '../../api/venteApi.js';

export const useVentes = () => useQuery({ queryKey: ['ventes'], queryFn: venteApi.list });
export const useVente = (id) => useQuery({ queryKey: ['ventes', id], queryFn: () => venteApi.detail(id), enabled: Boolean(id) });
export const useCreateVente = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: venteApi.create, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ventes'] }) });
};
