import {
    CREATE_NOTE_REQUEST,
    CREATE_NOTE_SUCCESS,
    CREATE_NOTE_FAILURE,
    UPDATE_NOTE_REQUEST,
    UPDATE_NOTE_SUCCESS,
    UPDATE_NOTE_FAILURE,
    DELETE_NOTE_REQUEST,
    DELETE_NOTE_SUCCESS,
    DELETE_NOTE_FAILURE,
    GET_ALL_NOTES_REQUEST,
    GET_ALL_NOTES_SUCCESS,
    GET_ALL_NOTES_FAILURE,
    GET_NOTE_BY_ID_SUCCESS,
} from "../../utils/actionConstants";

const initialState = {
    loading: false,
    notes: [],
    note: null,
    error: null,
    success: false,
};

const notesReducer = (state = initialState, action) => {
    switch (action.type) {
        case CREATE_NOTE_REQUEST:
        case UPDATE_NOTE_REQUEST:
        case DELETE_NOTE_REQUEST:
        case GET_ALL_NOTES_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
                success: false,
            };

        case GET_ALL_NOTES_SUCCESS:
            return {
                ...state,
                loading: false,
                notes: Array.isArray(action.payload) ? action.payload : [],
                error: null,
                success: true,
            };

        case CREATE_NOTE_SUCCESS:
            return {
                ...state,
                loading: false,
                note: action.payload,
                notes: [...state.notes, action.payload],
                error: null,
                success: true,
            };

        case UPDATE_NOTE_SUCCESS:
            return {
                ...state,
                loading: false,
                note: action.payload,
                notes: state.notes.map((n) => {
                    const id = n.noteId || n.id;
                    const updatedId = action.payload?.noteId || action.payload?.id;
                    return id === updatedId ? action.payload : n;
                }),
                error: null,
                success: true,
            };

        case GET_NOTE_BY_ID_SUCCESS: {
            const refreshed = action.payload;
            const refreshedId = refreshed?.noteId || refreshed?.id;
            return {
                ...state,
                note: state.note && (state.note.noteId || state.note.id) === refreshedId ? refreshed : state.note,
                notes: state.notes.map((n) => {
                    const id = n.noteId || n.id;
                    return id === refreshedId ? { ...n, ...refreshed } : n;
                }),
            };
        }

        case DELETE_NOTE_SUCCESS: {
            const deletedId = action.payload;
            return {
                ...state,
                loading: false,
                notes: state.notes.filter(
                    (n) => (n.noteId || n.id) !== deletedId,
                ),
                note:
                    state.note && (state.note.noteId || state.note.id) === deletedId
                        ? null
                        : state.note,
                error: null,
                success: true,
            };
        }

        case DELETE_NOTE_FAILURE:
            return {
                ...state,
                loading: false,
                success: false,
            };

        case CREATE_NOTE_FAILURE:
        case UPDATE_NOTE_FAILURE:
        case GET_ALL_NOTES_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
                success: false,
            };

        default:
            return state;
    }
};

export default notesReducer;
