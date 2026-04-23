import axios from 'axios';

export const API_URL = 'http://192.168.0.16:8000';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 5000,
});