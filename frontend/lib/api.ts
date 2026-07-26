import axios from 'axios';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { msalInstance } from './msalInstance';
import { apiScopeRequest } from './msalConfig';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach a fresh Entra access token to every call.
apiClient.interceptors.request.use(async (config) => {
  const account = msalInstance.getActiveAccount();
  if (account) {
    try {
      const result = await msalInstance.acquireTokenSilent({ ...apiScopeRequest, account });
      config.headers.Authorization = `Bearer ${result.accessToken}`;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        await msalInstance.acquireTokenRedirect(apiScopeRequest);
      }
      throw error;
    }
  }
  return config;
});

// Response interceptor: a 401 means the token was rejected (expired,
// revoked, wrong tenant/domain) — send the user through sign-in again
// instead of leaving them stuck on a "backend not connected"-looking error.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      msalInstance.logoutRedirect();
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  me: () => apiClient.get('/auth/me'),
};

export const listsApi = {
  list: () => apiClient.get('/lists/'),
  get: (id: number) => apiClient.get(`/lists/${id}`),
  create: (data: any) => apiClient.post('/lists/', data),
  update: (id: number, data: any) => apiClient.put(`/lists/${id}`, data),
  delete: (id: number) => apiClient.delete(`/lists/${id}`),
  getSubscribers: (listId: number, params?: { search?: string; status?: string }) => 
    apiClient.get(`/lists/${listId}/subscribers`, { params }),
  addSubscriber: (listId: number, data: any) => 
    apiClient.post(`/lists/${listId}/subscribers`, data),
};

export const subscriptionsApi = {
  update: (id: number, data: any) => apiClient.put(`/subscriptions/${id}`, data),
  delete: (id: number) => apiClient.delete(`/subscriptions/${id}`),
};

export const importsApi = {
  preview: (formData: FormData) => 
    apiClient.post('/imports/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  commit: (data: { list_id: number; entries: Array<{ name?: string; email: string }> }) => 
    apiClient.post('/imports/commit', data),
};

export const subscriberApi = {
  listMaster: () => apiClient.get('/subscribers/'),
};

export const auditLogsApi = {
  list: () => apiClient.get('/audit-logs/'),
};

export const dashboardApi = {
  getStatistics: () => apiClient.get('/dashboard/stats'),
};

const selfServiceClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const selfServiceApi = {
  lookupByEmail: (email: string) =>
    selfServiceClient.post('/self-service/lookup', { email }),
  getSubscriber: (token: string) =>
    selfServiceClient.get('/self-service/subscriber', { params: { token } }),
  unsubscribeAll: (token: string) =>
    selfServiceClient.post('/self-service/unsubscribe', null, { params: { token } }),
  updatePreferences: (token: string, subscriptions: Array<{ list_id: number; subscribed: boolean }>) =>
    selfServiceClient.put('/self-service/preferences', { subscriptions }, { params: { token } }),
};
