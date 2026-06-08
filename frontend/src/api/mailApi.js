import { apiFetch, asData, jsonBody } from './http.js';

export const mailApi = {
  status: async () => asData(await apiFetch('/mail/status')),
  messages: async () => asData(await apiFetch('/mail/messages')),
  send: (payload) => apiFetch('/mail/send', { method: 'POST', body: jsonBody(payload) }),
  notifyTeam: (payload) => apiFetch('/mail/notify-team', { method: 'POST', body: jsonBody(payload) }),
};
