import apiClient from "../../utils/apiClient";
import { aiBaseUrl } from "../../utils/url";

const buildHeaders = () => {
  const token = localStorage.getItem("JWT_TOKEN");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const semanticSearchService = async (query, topK) => {
  return apiClient.get(`${aiBaseUrl}/search`, {
    headers: buildHeaders(),
    params: { q: query, ...(topK ? { topK } : {}) },
  });
};

export const aiChatService = async ({
  message,
  conversationId,
  useNotesContext = false,
}) => {
  return apiClient.post(
    `${aiBaseUrl}/chat`,
    { message, conversationId, useNotesContext },
    { headers: buildHeaders() },
  );
};

export const aiChatConversationsService = async () => {
  return apiClient.get(`${aiBaseUrl}/chat/conversations`, {
    headers: buildHeaders(),
  });
};

export const aiChatHistoryService = async (conversationId) => {
  return apiClient.get(
    `${aiBaseUrl}/chat/${encodeURIComponent(conversationId)}/history`,
    { headers: buildHeaders() },
  );
};

export const aiTagsService = async ({ noteId, title, content }) => {
  return apiClient.post(
    `${aiBaseUrl}/tags`,
    { noteId, title, content },
    { headers: buildHeaders() },
  );
};

export const aiRecommendationsService = async (noteId, topK) => {
  return apiClient.get(
    `${aiBaseUrl}/recommendations/${encodeURIComponent(noteId)}`,
    {
      headers: buildHeaders(),
      params: { ...(topK ? { topK } : {}) },
    },
  );
};
