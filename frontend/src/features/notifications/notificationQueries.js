import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../../api/notificationApi.js';

export const useNotifications = () => useQuery({ queryKey: ['notifications'], queryFn: notificationApi.list });
export const useReadNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: notificationApi.markRead, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }) });
};
