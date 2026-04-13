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
  timeout: 30000, // Reduced timeout for faster feedback
  withCredentials: false,
  headers: {
    "X-Requested-With": "XMLHttpRequest", // Better CORS handling for Edge
  },
});

// Retry logic for network errors
let retryCount = 0;
const MAX_RETRIES = 2;

// Attach token automatically and handle FormData
API.interceptors.request.use(
  (req) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // Log debug info for every request
    if (typeof window !== "undefined") {
      const fullUrl = `${req.baseURL || ""}${req.url || ""}`;
      console.log(`[API Debug] Request to: ${fullUrl}`);
      console.log(`[API Debug] Token present: ${Boolean(token)}`);
      console.log(`[API Debug] Method: ${req.method?.toUpperCase()}`);
      console.log(`[API Debug] Base URL: ${req.baseURL}`);
      console.log(`[API Debug] URL: ${req.url}`);
    }

    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }

    // For FormData, don't set Content-Type header manually
    // Let the browser set it with proper boundary
    if (req.data instanceof FormData) {
      console.log("[API] Detected FormData - removing Content-Type header");
      delete req.headers["Content-Type"];
    }

    // Log request for debugging
    if (typeof window !== "undefined") {
      console.log(`[API Request] ${req.method?.toUpperCase()} ${req.url}`);
    }

    return req;
  },
  (error) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  },
);

// Handle responses and errors
API.interceptors.response.use(
  (response) => {
    retryCount = 0; // Reset retry count on success
    if (typeof window !== "undefined") {
      console.log(`[API Response] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    if (typeof window !== "undefined") {
      const isEdge = /Edg/.test(navigator.userAgent);
      const isChromium = /Chrome|Chromium|CriOS/.test(navigator.userAgent);
      const isConnectionRefused =
        error.code === "ERR_NETWORK" ||
        error.code === "ECONNREFUSED" ||
        error.message?.includes("ERR_CONNECTION_REFUSED");

      console.error("[API Error Details]", {
        code: error.code,
        message: error.message,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method,
        responseData: error.response?.data,
        browser: isEdge ? "Edge" : isChromium ? "Chrome" : "Unknown",
        connectionRefused: isConnectionRefused,
        apiBaseUrl: API_BASE_URL,
      });

      // Specific error for connection refused
      if (isConnectionRefused) {
        console.error(
          `❌ Cannot connect to API server at ${API_BASE_URL}. Is the backend server running?`,
        );
        console.warn(
          "⚠️ Make sure the server is running: npm run dev (from /server directory)",
        );
      }

      // Add Edge-specific warning
      if (isEdge && isConnectionRefused) {
        console.warn(
          "⚠️ Edge browser detected connection error. Check that backend server is running...",
        );
      }

      console.error(
        `[API Error] ${error.response?.status || error.code} ${error.config?.url || "unknown"}`,
      );
    }
    return Promise.reject(error);
  },
);

export default API;
