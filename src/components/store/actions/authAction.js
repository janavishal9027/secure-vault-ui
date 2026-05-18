import { enqueueSnackbar } from "notistack";
import {
  validateTokenService,
  extractUserIdService,
  verify2FALoginService,
  enable2FAService,
  disable2FAService,
  verify2FAService,
  get2FAStatusService,
  getAllUsersService,
  getUserByUsernameService,
  getUserByUserIdService,
} from "../services/AuthService";

const handleError = (error, fallback) => {
  const data = error?.response?.data;
  const message =
    typeof data === "string" ? data : data?.message || data?.error || fallback;
  return { success: false, message };
};

/* ---------------- PUBLIC ---------------- */

export const validateToken = (token) => {
  return async () => {
    try {
      const response = await validateTokenService(token);
      return { success: true, data: response.data };
    } catch (error) {
      return handleError(error, "Token validation failed");
    }
  };
};

export const extractUserId = (token) => {
  return async () => {
    try {
      const response = await extractUserIdService(token);
      return { success: true, data: response.data };
    } catch (error) {
      return handleError(error, "Unable to extract userId");
    }
  };
};

export const verify2FALogin = (code, jwtToken) => {
  return async () => {
    try {
      const response = await verify2FALoginService(code, jwtToken);
      enqueueSnackbar(response.data, { variant: "success" });
      return { success: true, data: response.data };
    } catch (error) {
      const result = handleError(error, "Invalid 2FA code");
      enqueueSnackbar(result.message, { variant: "error" });
      return result;
    }
  };
};

/* ---------------- 2FA (AUTHENTICATED) ---------------- */

export const enable2FA = () => {
  return async () => {
    try {
      const response = await enable2FAService();
      return { success: true, qrCodeUrl: response.data };
    } catch (error) {
      const result = handleError(error, "Unable to enable 2FA");
      enqueueSnackbar(result.message, { variant: "error" });
      return result;
    }
  };
};

export const disable2FA = () => {
  return async () => {
    try {
      const response = await disable2FAService();
      enqueueSnackbar(response.data, { variant: "success" });
      return { success: true, data: response.data };
    } catch (error) {
      const result = handleError(error, "Unable to disable 2FA");
      enqueueSnackbar(result.message, { variant: "error" });
      return result;
    }
  };
};

export const verify2FA = (code) => {
  return async () => {
    try {
      const response = await verify2FAService(code);
      enqueueSnackbar(response.data, { variant: "success" });
      return { success: true, data: response.data };
    } catch (error) {
      const result = handleError(error, "Invalid 2FA code");
      enqueueSnackbar(result.message, { variant: "error" });
      return result;
    }
  };
};

export const get2FAStatus = () => {
  return async () => {
    try {
      const response = await get2FAStatusService();
      return { success: true, data: response.data };
    } catch (error) {
      return handleError(error, "Unable to fetch 2FA status");
    }
  };
};

/* ---------------- USER QUERIES (AUTHENTICATED) ---------------- */

export const getAllUsers = () => {
  return async () => {
    try {
      const response = await getAllUsersService();
      return { success: true, data: response.data };
    } catch (error) {
      return handleError(error, "Unable to fetch users");
    }
  };
};

export const getUserByUsername = (username) => {
  return async () => {
    try {
      const response = await getUserByUsernameService(username);
      return { success: true, data: response.data };
    } catch (error) {
      return handleError(error, "User not found");
    }
  };
};

export const getUserByUserId = (userId) => {
  return async () => {
    try {
      const response = await getUserByUserIdService(userId);
      return { success: true, data: response.data };
    } catch (error) {
      return handleError(error, "User not found");
    }
  };
};
