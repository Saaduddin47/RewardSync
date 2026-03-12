import axios from "axios";

const resolveApiBaseUrl = () => {
  const raw = (import.meta.env.VITE_API_URL || "https://rewardsync.onrender.com/api").trim();
  return /\/api\/?$/i.test(raw) ? raw.replace(/\/$/, "") : `${raw.replace(/\/$/, "")}/api`;
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
