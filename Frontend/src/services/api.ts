import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import useAuthStore from '@/store/authStore';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor for adding token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore.getState();
    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const authStore = useAuthStore.getState();

    if (error.response?.status === 401 && !originalRequest._retry && authStore.refreshTokenValue) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: authStore.refreshTokenValue,
        });

        authStore.updateTokens(response.data.accessToken, response.data.expiresAt);
        originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        authStore.clearAuth();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
  },

  refreshToken: async (refreshTokenValue: string) => {
    const response = await api.post('/auth/refresh', { refreshToken: refreshTokenValue });
    return response.data;
  },

  register: async (email: string, password: string, name: string) => {
    const response = await api.post('/auth/register', { email, password, name });
    return response.data;
  },
};

export const chatService = {
  getConversations: async () => {
    const response = await api.get('/chat/conversations');
    return response.data;
  },

  getMessages: async (conversationId: string) => {
    const response = await api.get(`/chat/conversations/${conversationId}/messages`);
    return response.data;
  },

  sendMessage: async (conversationId: string, content: string) => {
    const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
      content,
    });
    return response.data;
  },
};

export const taskService = {
  getTasks: async () => {
    const response = await api.get('/tasks');
    return response.data;
  },

  createTask: async (task: any) => {
    const response = await api.post('/tasks', task);
    return response.data;
  },

  updateTask: async (taskId: string, task: any) => {
    const response = await api.put(`/tasks/${taskId}`, task);
    return response.data;
  },

  deleteTask: async (taskId: string) => {
    await api.delete(`/tasks/${taskId}`);
  },
};

export const emailService = {
  getEmails: async () => {
    const response = await api.get('/emails');
    return response.data;
  },

  sendEmail: async (to: string, subject: string, body: string) => {
    const response = await api.post('/emails/send', { to, subject, body });
    return response.data;
  },
};

export default api;
