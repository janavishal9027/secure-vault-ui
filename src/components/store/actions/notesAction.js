import {
  CREATE_NOTE_FAILURE,
  CREATE_NOTE_REQUEST,
  CREATE_NOTE_SUCCESS,
  UPDATE_NOTE_FAILURE,
  UPDATE_NOTE_REQUEST,
  UPDATE_NOTE_SUCCESS,
  DELETE_NOTE_REQUEST,
  DELETE_NOTE_SUCCESS,
  DELETE_NOTE_FAILURE,
  GET_ALL_NOTES_REQUEST,
  GET_ALL_NOTES_SUCCESS,
  GET_ALL_NOTES_FAILURE,
  GET_NOTE_BY_ID_SUCCESS,
} from "../../utils/actionConstants";
import {
  createNoteService,
  updateNoteService,
  deleteNoteService,
  getAllNotesService,
  getNoteByIdService,
  requestSummaryService,
} from "../services/NoteService";

const isAuthError = (error) => {
  const status = error?.response?.status;
  const data = error?.response?.data;

  const message =
    typeof data === "string"
      ? data
      : data?.message || data?.error || error?.message || "";

  const lowerMsg = message.toLowerCase();

  return (
    status === 401 ||
    lowerMsg.includes("jwt expired") ||
    lowerMsg.includes("token expired") ||
    lowerMsg.includes("session expired") ||
    lowerMsg.includes("invalid token") ||
    lowerMsg.includes("unauthorized") ||
    lowerMsg.includes("authorization header is empty")
  );
};

export const createNote = (noteData) => async (dispatch) => {
  const token = localStorage.getItem("JWT_TOKEN");

  if (!token) {
    window.dispatchEvent(new Event("session-expired"));
    return null;
  }
  
  dispatch({ type: CREATE_NOTE_REQUEST });

  try {
    const response = await createNoteService(noteData);

    const responseNote = response.data?.data ?? response.data ?? {};
    const savedNote = {
      ...noteData,
      ...responseNote,
    };

    dispatch({
      type: CREATE_NOTE_SUCCESS,
      payload: savedNote,
    });

    return savedNote;
  } catch (error) {
    if (isAuthError(error)) {
      return null;
    }
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      "Failed to create note";

    dispatch({
      type: CREATE_NOTE_FAILURE,
      payload: message,
    });

    return null;
  }
};

export const updateNote = (noteId, noteData) => async (dispatch) => {
  const token = localStorage.getItem("JWT_TOKEN");

  if (!token) {
    window.dispatchEvent(new Event("session-expired"));
    return null;
  }

  dispatch({ type: UPDATE_NOTE_REQUEST });

  try {
    const response = await updateNoteService(noteId, noteData);

    const responseNote = response.data?.data ?? response.data ?? {};
    const updatedNote = {
      noteId: responseNote.noteId || noteId,
      ...noteData,
      ...responseNote,
    };

    dispatch({
      type: UPDATE_NOTE_SUCCESS,
      payload: updatedNote,
    });
    return updatedNote;
  } catch (error) {
    if (isAuthError(error)) {
      return null;
    }
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      "Failed to update note";

    dispatch({
      type: UPDATE_NOTE_FAILURE,
      payload: message,
    });
    return null;
  }
};

export const getAllNotes = () => async (dispatch) => {
  const token = localStorage.getItem("JWT_TOKEN");

  if (!token) {
    window.dispatchEvent(new Event("session-expired"));
    return [];
  }

  dispatch({ type: GET_ALL_NOTES_REQUEST });

  try {
    const response = await getAllNotesService();
    const notesList = Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data)
        ? response.data
        : [];
    dispatch({
      type: GET_ALL_NOTES_SUCCESS,
      payload: notesList,
    });
    return notesList;
  } catch (error) {
    if (isAuthError(error)) {
      return [];
    }
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      "Failed to fetch notes";
    dispatch({
      type: GET_ALL_NOTES_FAILURE,
      payload: message,
    });
    return [];
  }
};

export const getNoteById = (noteId) => async (dispatch) => {
  const token = localStorage.getItem("JWT_TOKEN");

  if (!token || !noteId) {
    return null;
  }

  try {
    const response = await getNoteByIdService(noteId);
    const note = response.data?.data ?? response.data ?? null;

    if (note) {
      dispatch({ type: GET_NOTE_BY_ID_SUCCESS, payload: note });
    }

    return note;
  } catch (error) {
    if (isAuthError(error)) {
      return null;
    }
    return null;
  }
};

export const requestSummary = (noteId) => async (dispatch) => {
  const token = localStorage.getItem("JWT_TOKEN");

  if (!token || !noteId) {
    return null;
  }

  try {
    const response = await requestSummaryService(noteId);
    const note = response.data?.data ?? response.data ?? null;

    if (note) {
      dispatch({ type: GET_NOTE_BY_ID_SUCCESS, payload: note });
    }

    return note;
  } catch (error) {
    if (isAuthError(error)) {
      return null;
    }
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      "Failed to request summary";

    return { error: message };
  }
};

export const deleteNote = (noteId) => async (dispatch) => {
  const token = localStorage.getItem("JWT_TOKEN");

  if (!token) {
    window.dispatchEvent(new Event("session-expired"));
    return null;
  }

  if (!noteId) return null;

  dispatch({ type: DELETE_NOTE_REQUEST });

  try {
    await deleteNoteService(noteId);

    dispatch({
      type: DELETE_NOTE_SUCCESS,
      payload: noteId,
    });

    return { deletedId: noteId };
  } catch (error) {
    console.error("Delete note failed:", {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });

    if (isAuthError(error)) {
      return null;
    }
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      (typeof error?.response?.data === "string"
        ? error.response.data
        : null) ||
      `Failed to delete note (status ${error?.response?.status ?? "unknown"})`;

    dispatch({
      type: DELETE_NOTE_FAILURE,
      payload: message,
    });

    return { error: message };
  }
};
