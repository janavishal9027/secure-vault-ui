import axios from "axios";

import apiClient from "../../utils/apiClient";
import { noteBaseUrl } from "../../utils/url";
import { notes } from "../../utils/configEnv";

const baseUrl = `${noteBaseUrl}${notes}`;

const authHeaders = () => {
  const token = localStorage.getItem("JWT_TOKEN");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * The landing page's carousel. Ten newest, published only.
 *
 * Uses bare `axios`, not `apiClient` — deliberately. The landing page is seen
 * by people who are not signed in, and `apiClient` treats a 401 as a session
 * expiry and fires the "your session ended" modal. A public read must not be
 * able to trigger that.
 */
export const getPublicFeedbackService = () =>
  axios.get(`${baseUrl}/public/feedback`);

/** Whether the signed-in account has already been asked. */
export const getMyFeedbackStatusService = () =>
  apiClient.get(`${baseUrl}/api/feedback/me`, { headers: authHeaders() });

/** Submits feedback. The server rejects a second attempt with a 409. */
export const submitFeedbackService = (payload) =>
  apiClient.post(`${baseUrl}/api/feedback`, payload, { headers: authHeaders() });
