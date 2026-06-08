import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categorieApi } from '../../api/categorieApi.js';

export const useCategories = () => useQuery({ queryKey: ['categories'], queryFn: categorieApi.list });
export const useCreateCategorie = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: categorieApi.create, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }) });
};
export const useUpdateCategorie = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, payload }) => categorieApi.update(id, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }) });
};
export const useDeleteCategorie = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: categorieApi.remove, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }) });
};
