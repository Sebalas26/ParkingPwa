const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5135/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const inspected = sessionStorage.getItem('parkflow_inspected_company');
    if (inspected) {
      const comp = JSON.parse(inspected);
      if (comp && comp.id) {
        headers['X-Company-Id'] = String(comp.id);
      }
    }
  } catch {
    // Ignore storage parse errors
  }

  return headers;
};

const handleResponse = async <T>(response: Response, endpoint: string = ''): Promise<T> => {
  const isLoginEndpoint = endpoint.toLowerCase().includes('/auth/login');
  const hadActiveSession = Boolean(localStorage.getItem('auth_token'));

  if (response.status === 401 && !isLoginEndpoint) {
    // Si recibimos un 401 en una petición protegida, limpiamos la sesión
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');

    // Solo si el usuario tenía una sesión autenticada activa, mostramos el aviso de concurrencia/expiración
    if (hadActiveSession) {
      sessionStorage.setItem(
        'session_terminated_reason',
        'Tu sesión fue cerrada automáticamente porque se inició sesión con esta cuenta desde otro dispositivo o estación de trabajo.'
      );

      if (window.location.pathname !== '/' || !window.location.search.includes('expired=concurrent')) {
        window.location.href = '/?expired=concurrent';
      }
    }
  }

  const contentType = response.headers.get('content-type');
  let data: any = null;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text ? { message: text } : null;
  }

  if (!response.ok) {
    const errorMessage = data?.message || data?.errorMessage || response.statusText || 'Error en la petición al servidor';
    throw new ApiError(response.status, errorMessage, data);
  }

  return data as T;
};

export const apiClient = {
  get: async <T>(endpoint: string, params?: Record<string, any>): Promise<T> => {
    let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return handleResponse<T>(response, endpoint);
  },

  post: async <T>(endpoint: string, body?: any): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    return handleResponse<T>(response, endpoint);
  },

  put: async <T>(endpoint: string, body?: any): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    return handleResponse<T>(response, endpoint);
  },

  patch: async <T>(endpoint: string, body?: any): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    return handleResponse<T>(response, endpoint);
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return handleResponse<T>(response, endpoint);
  },
};
