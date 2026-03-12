import axios from "axios";

const resolveApiBaseUrl = () => {
  const fallback = "https://rewardsync.onrender.com/api";
  const raw = (import.meta.env.VITE_API_URL || fallback).trim();

  try {
    const parsed = new URL(raw);
    const lowerPath = parsed.pathname.toLowerCase();
    const apiIndex = lowerPath.indexOf("/api");
    const normalizedPath = apiIndex >= 0 ? parsed.pathname.slice(0, apiIndex + 4) : "/api";
    return `${parsed.origin}${normalizedPath}`.replace(/\/$/, "");
  } catch (error) {
    return fallback;
  }
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
