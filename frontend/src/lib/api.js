import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sbi_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry && !original.url.includes("/auth/")) {
      original._retry = true;
      const refresh = localStorage.getItem("sbi_refresh_token");
      if (refresh && !isRefreshing) {
        isRefreshing = true;
        try {
          const { data } = await axios.post(`${API}/auth/refresh`, { refresh_token: refresh });
          localStorage.setItem("sbi_access_token", data.access_token);
          isRefreshing = false;
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch (e) {
          isRefreshing = false;
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(err);
  }
);

export const setSession = (data) => {
  localStorage.setItem("sbi_access_token", data.access_token);
  if (data.refresh_token) localStorage.setItem("sbi_refresh_token", data.refresh_token);
  if (data.user) localStorage.setItem("sbi_user", JSON.stringify(data.user));
};

export const clearSession = () => {
  localStorage.removeItem("sbi_access_token");
  localStorage.removeItem("sbi_refresh_token");
  localStorage.removeItem("sbi_user");
};

export const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem("sbi_user") || "null"); } catch { return null; }
};

export const formatINR = (n) => {
  if (n === null || n === undefined || isNaN(n)) return "₹0";
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
};
