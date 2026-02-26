import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api"
});

// Attach token automatically
API.interceptors.request.use((req) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
