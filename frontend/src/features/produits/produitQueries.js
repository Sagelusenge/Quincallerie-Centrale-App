import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { produitApi } from '../../api/produitApi.js';

export const useProduits = () => useQuery({ queryKey: ['produits'], queryFn: produitApi.list });
export const useMouvementsStock = () => useQuery({ queryKey: ['produits', 'mouvements'], queryFn: produitApi.mouvements });
export const useCreateProduit = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: produitApi.create, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produits'] }) });
};
export const useUpdateProduit = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, payload }) => produitApi.update(id, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produits'] }) });
};
export const useApprovisionnerProduit = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, payload }) => produitApi.approvisionner(id, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produits'] }) });
};
export const useDeleteProduit = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: produitApi.remove, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produits'] }) });
};
