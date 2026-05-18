import axios from "axios";
import apiClient from "../../utils/apiClient";
import { noteBaseUrl } from "../../utils/url";
import { notes } from "../../utils/configEnv";

const authHeaders = () => {
  const token = localStorage.getItem("JWT_TOKEN");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const createNoteService = (noteData) => {
  return apiClient.post(`${noteBaseUrl}${notes}/api/notes/createdNote`, noteData, {
    headers: authHeaders(),
  });
};

export const updateNoteService = (noteId, noteData) => {
  return apiClient.put(
    `${noteBaseUrl}${notes}/api/notes/updateNote`,
    { noteId, ...noteData },
    {
      headers: authHeaders(),
      params: { noteId },
    },
  );
};

export const getAllNotesService = () => {
  return apiClient.get(`${noteBaseUrl}${notes}/api/notes/owner/allNotes`, {
    headers: authHeaders(),
  });
};

export const getNoteByIdService = (noteId) => {
  return apiClient.get(`${noteBaseUrl}${notes}/api/notes/getNotes/${noteId}`, {
    headers: authHeaders(),
  });
};

export const requestSummaryService = (noteId) => {
  return apiClient.post(
    `${noteBaseUrl}${notes}/api/notes/summarize/${noteId}`,
    {},
    { headers: authHeaders() },
  );
};

export const deleteNoteService = (noteId) => {
  return apiClient.delete(`${noteBaseUrl}${notes}/api/notes/deleteNote`, {
    headers: authHeaders(),
    params: { noteId },
  });
};

export const transcribeAudioService = (audioBlob, language) => {
  const token = localStorage.getItem("JWT_TOKEN");
  const formData = new FormData();
  const fileName = `recording-${Date.now()}.webm`;
  formData.append("file", audioBlob, fileName);

  return axios.post(
    `${noteBaseUrl}${notes}/api/notes/transcribe`,
    formData,
    {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      params: language ? { language } : undefined,
    },
  );
};
