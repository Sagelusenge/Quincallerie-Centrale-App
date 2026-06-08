import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientApi } from '../../api/clientApi.js';

export const useClients = () => useQuery({ queryKey: ['clients'], queryFn: clientApi.list });
export const useCreateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: clientApi.create, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }) });
};
export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, payload }) => clientApi.update(id, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }) });
};
export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: clientApi.remove, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }) });
};
