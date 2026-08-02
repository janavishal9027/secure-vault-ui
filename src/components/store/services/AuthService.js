import axios from "axios";
import apiClient from "../../utils/apiClient";
import { authBaseUrl } from "../../utils/url";
import { authentication } from "../../utils/configEnv";

const baseUrl = `${authBaseUrl}${authentication}/api/user`;

const authHeaders = () => {
  const token = localStorage.getItem("JWT_TOKEN");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/* ---------------- PUBLIC ENDPOINTS ---------------- */

export const validateTokenService = (token) => {
  return axios.get(`${baseUrl}/public/validate`, {
    params: { token },
  });
};

export const extractUserIdService = (token) => {
  return axios.get(`${baseUrl}/public/extractUserId`, {
    params: { token },
  });
};

export const verify2FALoginService = (code, jwtToken) => {
  return axios.post(`${baseUrl}/public/verify-2fa-login`, null, {
    params: { code, jwtToken },
  });
};

/* ---------------- 2FA (AUTHENTICATED) ---------------- */

export const enable2FAService = () => {
  return apiClient.post(`${baseUrl}/enable-2fa`, null, {
    headers: authHeaders(),
  });
};

export const disable2FAService = () => {
  return apiClient.post(`${baseUrl}/disable-2fa`, null, {
    headers: authHeaders(),
  });
};

export const verify2FAService = (code) => {
  return apiClient.post(`${baseUrl}/verify-2fa`, null, {
    headers: authHeaders(),
    params: { code },
  });
};

export const get2FAStatusService = () => {
  return apiClient.get(`${baseUrl}/2fa-status`, {
    headers: authHeaders(),
  });
};

/* ---------------- USER QUERIES (AUTHENTICATED) ---------------- */

export const getAllUsersService = () => {
  return apiClient.get(`${baseUrl}/allUsers`, {
    headers: authHeaders(),
  });
};

export const getUserByUsernameService = (username) => {
  return apiClient.get(`${baseUrl}/getUserByUsername`, {
    headers: authHeaders(),
    params: { username },
  });
};

export const getUserByUserIdService = (userId) => {
  return apiClient.get(`${baseUrl}/getUserByUserId`, {
    headers: authHeaders(),
    params: { userId },
  });
};

/* ---------------- SELF-SERVICE PROFILE ---------------- */

/** The signed-in user's own profile. Takes no id — the server reads the token. */
export const getMyProfileService = () => {
  return apiClient.get(`${baseUrl}/me`, {
    headers: authHeaders(),
  });
};

/**
 * Patches the editable fields. Omit a key to leave it alone; send an empty
 * string to clear it (which is how the avatar is removed).
 */
export const updateMyProfileService = (patch) => {
  return apiClient.patch(`${baseUrl}/me`, patch, {
    headers: authHeaders(),
  });
};

/* ---------------- SESSION ---------------- */

/** Trades a still-valid token for a fresh one. See sessionPolicy.js. */
export const refreshTokenService = () => {
  return apiClient.post(`${baseUrl}/refresh-token`, null, {
    headers: authHeaders(),
  });
};
