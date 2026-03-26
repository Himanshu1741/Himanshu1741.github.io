import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api",
  timeout: 30000,
  withCredentials: false, // Don't send cookies with requests
});

// Attach token automatically and handle FormData
API.interceptors.request.use((req) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  // For FormData, don't set Content-Type header manually
  // Let the browser set it with proper boundary
  if (req.data instanceof FormData) {
    delete req.headers["Content-Type"];
  }

  // Log request for debugging
  if (typeof window !== "undefined") {
    console.log(`[API Request] ${req.method?.toUpperCase()} ${req.url}`);
  }

  return req;
});

// Add response interceptor for debugging
API.interceptors.response.use(
  (res) => {
    if (typeof window !== "undefined") {
      console.log(`[API Response] ${res.status} ${res.statusText}`);
    }
    return res;
  },
  (error) => {
    if (typeof window !== "undefined") {
      console.error(`[API Error] ${error.message}`, error.response?.status);
    }
    return Promise.reject(error);
  },
);

export default API;
