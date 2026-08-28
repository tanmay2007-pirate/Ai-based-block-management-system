import axios from 'axios';

export const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const api = axios.create({ baseURL: API });
export default api;
