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

// Streaming chat — returns the raw fetch Response so the caller can read the
// Server-Sent Events body incrementally. (axios buffers, so we use fetch here.)
export const aiChatStreamRequest = ({
  message,
  conversationId,
  useNotesContext = false,
  signal,
}) => {
  return fetch(`${aiBaseUrl}/chat/stream`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ message, conversationId, useNotesContext }),
    signal,
  });
};

export const aiChatConversationsService = async (archived = false) => {
  return apiClient.get(`${aiBaseUrl}/chat/conversations`, {
    headers: buildHeaders(),
    params: archived ? { archived: true } : {},
  });
};

export const aiChatHistoryService = async (conversationId) => {
  return apiClient.get(
    `${aiBaseUrl}/chat/${encodeURIComponent(conversationId)}/history`,
    { headers: buildHeaders() },
  );
};

export const updateConversationService = async (conversationId, payload) => {
  return apiClient.patch(
    `${aiBaseUrl}/chat/${encodeURIComponent(conversationId)}`,
    payload,
    { headers: buildHeaders() },
  );
};

export const deleteConversationService = async (conversationId) => {
  return apiClient.delete(
    `${aiBaseUrl}/chat/${encodeURIComponent(conversationId)}`,
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
