import apiClient from "../../utils/apiClient";
import { aiBaseUrl } from "../../utils/url";

const buildHeaders = () => {
  const token = localStorage.getItem("JWT_TOKEN");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Every route below is scoped server-side to the caller's own keys — the owner
// comes from the verified token and is never sent from here.

export const listProviderKeysService = async () => {
  return apiClient.get(`${aiBaseUrl}/provider-keys`, {
    headers: buildHeaders(),
  });
};

export const addProviderKeyService = async ({ key, label, provider = "groq" }) => {
  return apiClient.post(
    `${aiBaseUrl}/provider-keys`,
    { provider, key, label },
    { headers: buildHeaders() },
  );
};

export const deleteProviderKeyService = async (keyId) => {
  return apiClient.delete(`${aiBaseUrl}/provider-keys/${keyId}`, {
    headers: buildHeaders(),
  });
};

// Makes a tiny live call against the provider, and records the result on the row.
export const checkProviderKeyService = async (keyId) => {
  return apiClient.post(
    `${aiBaseUrl}/provider-keys/${keyId}/check`,
    {},
    { headers: buildHeaders() },
  );
};

// The exact fallback chain this user's requests will walk, in order.
export const modelChainService = async () => {
  return apiClient.get(`${aiBaseUrl}/provider-keys/models`, {
    headers: buildHeaders(),
  });
};

// Opt in/out of billable models past the free tier.
export const setPremiumModelsService = async (enabled) => {
  return apiClient.patch(
    `${aiBaseUrl}/provider-keys/settings`,
    { enabled },
    { headers: buildHeaders() },
  );
};
