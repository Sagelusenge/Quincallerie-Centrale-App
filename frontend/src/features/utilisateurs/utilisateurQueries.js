import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { utilisateurApi } from '../../api/utilisateurApi.js';

export const useUtilisateurs = () => useQuery({ queryKey: ['utilisateurs'], queryFn: utilisateurApi.list });
export const useCreateUtilisateur = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: utilisateurApi.create, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['utilisateurs'] }) });
};
export const useUpdateUtilisateur = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, payload }) => utilisateurApi.update(id, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['utilisateurs'] }) });
};
export const useToggleUtilisateur = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: utilisateurApi.toggle, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['utilisateurs'] }) });
};
