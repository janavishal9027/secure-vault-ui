import axios from "axios";

const apiClient = axios.create({
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
  },
});

// Prevent multiple triggers
let isSessionExpiredHandled = false;

/* ---------------- REQUEST INTERCEPTOR ---------------- */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("JWT_TOKEN");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ---------------- RESPONSE INTERCEPTOR ---------------- */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;

    // 🔐 Safe message extraction
    const message =
      typeof data === "string"
        ? data
        : data?.message || data?.error || "";

    const lowerMsg = message.toLowerCase();

    // 🔥 AUTH ERROR DETECTION
    const isAuthError =
      status === 401 ||
      lowerMsg.includes("jwt expired") ||
      lowerMsg.includes("token expired") ||
      lowerMsg.includes("session expired") ||
      lowerMsg.includes("invalid token") ||
      lowerMsg.includes("unauthorized") ||
      lowerMsg.includes("authorization header is empty");

    if (isAuthError && !isSessionExpiredHandled) {
      isSessionExpiredHandled = true;

      console.log("Session expired detected");

      // Clear storage
      localStorage.removeItem("JWT_TOKEN");
      localStorage.removeItem("ROLES");

      // Trigger your modal
      window.dispatchEvent(new Event("session-expired"));
    }

    return Promise.reject(error);
  }
);

export default apiClient;