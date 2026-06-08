import { apiFetch, asData } from './http.js';

export const notificationApi = {
  list: async () => asData(await apiFetch('/notifications')),
  markRead: (id) => apiFetch(`/notifications/${id}/read`, { method: 'PUT' }),
};
