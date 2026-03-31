/**
 * API Service
 *
 * Copyright © 2026 Himanshu Kumar. All rights reserved.
 * Developed by Himanshu Kumar
 */

import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  timeout: 30000,
  withCredentials: false,
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

// Handle responses and errors
API.interceptors.response.use(
  (response) => {
    if (typeof window !== "undefined") {
      console.log(`[API Response] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    if (typeof window !== "undefined") {
      console.error(
        `[API Error] ${error.response?.status || error.code} ${error.config?.url || "unknown"}`,
      );
    }
    return Promise.reject(error);
  },
);

export default API;
