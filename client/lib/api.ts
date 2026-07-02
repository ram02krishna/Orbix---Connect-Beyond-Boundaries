import axios from "axios";
import { useAuthStore } from "../hooks/useAuthStore";
import { useSocketStore } from "../hooks/useSocketStore";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Essential for sending the httpOnly refresh token cookie
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach access token to headers if it exists
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses to handle 401 Unauthorized / Token Expired errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid token refresh for auth routes (like login, register, etc.) or if refresh fails
    if (originalRequest.url?.includes("/auth/")) {
      if (originalRequest.url?.includes("/auth/refresh")) {
        useAuthStore.getState().logout();
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to call the refresh endpoint to obtain a new access token
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = refreshResponse.data.data;
        useAuthStore.getState().setAccessToken(accessToken);

        // Connect/reconnect the socket with the fresh access token
        useSocketStore.getState().connectSocket(accessToken);

        // Update authorization header and replay the original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.warn("Refresh token failed, logging out...");
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
