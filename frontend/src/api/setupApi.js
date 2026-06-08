import { apiFetch, asData, jsonBody } from './http.js';

export const setupApi = {
  status: async () => asData(await apiFetch('/setup/status')),
  createCompany: async (payload) => apiFetch('/setup/company', {
    method: 'POST',
    body: jsonBody(payload),
    headers: payload.setup_code ? { 'X-Setup-Code': payload.setup_code } : {},
  }),
};
