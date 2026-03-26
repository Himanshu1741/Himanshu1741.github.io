import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api",
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

  return req;
});

export default API;
