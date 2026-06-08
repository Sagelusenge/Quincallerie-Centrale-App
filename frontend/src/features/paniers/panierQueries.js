import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { panierApi } from '../../api/panierApi.js';

export const usePaniers = () => useQuery({ queryKey: ['paniers'], queryFn: panierApi.list });
export const useCreatePanier = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: panierApi.create, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['paniers'] }) });
};
export const useConvertirPanier = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: panierApi.convertir, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['paniers'] }) });
};
