/**
 * API Service
 *
 * Copyright © 2026 Himanshu Kumar. All rights reserved.
 * Developed by Himanshu Kumar
 */

import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: false,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
  },
});

// Attach token automatically and handle FormData
API.interceptors.request.use(
  (req) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }

    // For FormData, don't set Content-Type header manually
    if (req.data instanceof FormData) {
      delete req.headers["Content-Type"];
    }

    return req;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Handle responses and errors
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default API;
