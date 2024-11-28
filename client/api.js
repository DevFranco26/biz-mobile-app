import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://<your-server-ip>:5000/api/auth'; // Replace <your-server-ip> with the actual server IP or localhost

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically attach the token (if available) to each request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Functions
export const signIn = async (email, password) => {
  return api.post('/signin', { email, password });
};

export const logOut = async () => {
  await SecureStore.deleteItemAsync('token');
};
