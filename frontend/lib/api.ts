import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token if present
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const authApi = {
  login: (credentials: any) => apiClient.post('/auth/login', credentials),
};

export const newsletterApi = {
  list: () => apiClient.get('/newsletters/'),
  get: (id: string) => apiClient.get(`/newsletters/${id}`),
  create: (data: any) => apiClient.post('/newsletters/', data),
  update: (id: string, data: any) => apiClient.put(`/newsletters/${id}`, data),
  delete: (id: string) => apiClient.delete(`/newsletters/${id}`),
  send: (id: string) => apiClient.post(`/newsletters/${id}/send`),
};

export const subscriberApi = {
  list: () => apiClient.get('/subscribers/'),
  create: (data: any) => apiClient.post('/subscribers/', data),
  importCsv: (formData: FormData) =>
    apiClient.post('/subscribers/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  unsubscribe: (email: string, categoryIds: number[]) =>
    apiClient.post('/subscribers/unsubscribe', { email, category_ids: categoryIds }),
};

export const categoryApi = {
  list: () => apiClient.get('/categories/'),
  create: (data: any) => apiClient.post('/categories/', data),
};

export const aiApi = {
  generateDraft: (prompt: string, categoryId: number, tone: string) =>
    apiClient.post('/ai/generate-draft', { prompt, category_id: categoryId, tone }),

  generateOverview: (htmlContent: string, categoryId: number, tone: string) =>
    apiClient.post('/ai/generate-draft', {
      prompt: htmlContent,
      category_id: categoryId,
      tone,
    }),
};

export const dashboardApi = {
  getStatistics: () => apiClient.get('/statistics/dashboard'),
};
