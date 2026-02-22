import axios, { AxiosRequestConfig } from 'axios';

// Create an authenticated axios instance for admin API calls
export const createAuthenticatedAxios = () => {
  const token = localStorage.getItem('firebaseToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  return axios.create({
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Helper function for making authenticated API calls with axios
export const makeAuthenticatedRequest = async (url: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET', data?: unknown) => {
  const token = localStorage.getItem('firebaseToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const config: AxiosRequestConfig = {
    method,
    url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    config.data = data;
  }

  return axios(config);
};

// Helper function for making authenticated fetch API calls
export const makeAuthenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('firebaseToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  return fetch(url, {
    ...options,
    headers: authHeaders
  });
};