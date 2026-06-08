import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fournisseurApi } from '../../api/fournisseurApi.js';

export const useFournisseurs = (options = {}) => useQuery({ queryKey: ['fournisseurs'], queryFn: fournisseurApi.list, ...options });

export const useCreateFournisseur = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: fournisseurApi.create, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fournisseurs'] }) });
};

export const useUpdateFournisseur = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, payload }) => fournisseurApi.update(id, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fournisseurs'] }) });
};

export const useDeleteFournisseur = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: fournisseurApi.remove, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fournisseurs'] }) });
};
