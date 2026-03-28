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

export const fetchRecruiterDashboardData = async () => {
  const [statsRes, joinersRes] = await Promise.all([
    api.get("/dashboard/recruiter"),
    api.get("/joiners/my"),
  ]);

  return {
    stats: statsRes.data,
    joiners: joinersRes.data,
  };
};

export const fetchManagerDashboardData = async () => {
  const [claimsRes, statsRes, deficitsRes] = await Promise.all([
    api.get("/claims"),
    api.get("/dashboard/manager"),
    api.get("/dashboard/deficits"),
  ]);

  return {
    claims: claimsRes.data,
    stats: statsRes.data,
    deficits: deficitsRes.data,
  };
};

export const fetchBgvDashboardData = async ({ showAll = false } = {}) => {
  const endpoint = showAll ? "/joiners/bgv-all" : "/joiners/bgv-queue";
  const { data } = await api.get(endpoint);
  return data;
};

export const fetchAdminDashboardData = async () => {
  const [employeesRes, recoveryRes, claimsRes] = await Promise.all([
    api.get("/admin/employees"),
    api.get("/admin/recovery"),
    api.get("/claims"),
  ]);

  return {
    employees: employeesRes.data,
    recoveryRows: recoveryRes.data,
    claims: claimsRes.data,
  };
};

export default api;
