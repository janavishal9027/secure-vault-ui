import React, { useEffect, useMemo, useRef, useState } from "react";
import hljs from "../utils/hljs-setup";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
  Box,
  Button,
  Chip,
  Drawer,
  Fab,
  IconButton,
  Paper,
  Tooltip,
  Typography,
  Avatar,
  InputBase,
  Divider,
  CircularProgress,
  Dialog,
  DialogContent,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useNavigate } from "react-router-dom";
import { initialsFor, useMyProfile } from "../store/useMyProfile";
import { glassCard, glassInset } from "../theme/glass";
import { useSnackbar } from "notistack";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import MicNoneRoundedIcon from "@mui/icons-material/MicNoneRounded";
import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";

import AiInsightsPanel from "../ai/AiInsightsPanel";
import { KEYS_ROUTE } from "../utils/aiErrors";

import {
  createNote,
  deleteNote,
  getAllNotes,
  getNoteById,
  requestSummary,
  updateNote,
} from "../store/actions/notesAction";

const SUMMARY_POLL_INTERVAL_MS = 3000;
const SUMMARY_POLL_MAX_ATTEMPTS = 40;

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ align: [] }],
    ["blockquote", "code-block"],
    ["link", "image"],
    ["clean"],
  ],
  syntax: {
    highlight: (text) => hljs.highlightAuto(text).value,
    languages: [
      { key: "plain", label: "Plain" },
      { key: "javascript", label: "JavaScript" },
      { key: "typescript", label: "TypeScript" },
      { key: "python", label: "Python" },
      { key: "java", label: "Java" },
      { key: "c", label: "C" },
      { key: "cpp", label: "C++" },
      { key: "csharp", label: "C#" },
      { key: "go", label: "Go" },
      { key: "rust", label: "Rust" },
      { key: "dart", label: "Dart" },
      { key: "kotlin", label: "Kotlin" },
      { key: "swift", label: "Swift" },
      { key: "scala", label: "Scala" },
      { key: "ruby", label: "Ruby" },
      { key: "php", label: "PHP" },
      { key: "perl", label: "Perl" },
      { key: "lua", label: "Lua" },
      { key: "r", label: "R" },
      { key: "matlab", label: "MATLAB" },
      { key: "haskell", label: "Haskell" },
      { key: "elixir", label: "Elixir" },
      { key: "erlang", label: "Erlang" },
      { key: "clojure", label: "Clojure" },
      { key: "groovy", label: "Groovy" },
      { key: "fsharp", label: "F#" },
      { key: "vbnet", label: "VB.NET" },
      { key: "objectivec", label: "Objective-C" },
      { key: "bash", label: "Bash" },
      { key: "shell", label: "Shell" },
      { key: "powershell", label: "PowerShell" },
      { key: "sql", label: "SQL" },
      { key: "json", label: "JSON" },
      { key: "xml", label: "HTML/XML" },
      { key: "css", label: "CSS" },
      { key: "scss", label: "SCSS" },
      { key: "less", label: "Less" },
      { key: "markdown", label: "Markdown" },
      { key: "yaml", label: "YAML" },
      { key: "dockerfile", label: "Dockerfile" },
      { key: "nginx", label: "Nginx" },
      { key: "ini", label: "INI/TOML" },
      { key: "makefile", label: "Makefile" },
      { key: "graphql", label: "GraphQL" },
      { key: "protobuf", label: "Protobuf" },
      { key: "latex", label: "LaTeX" },
    ],
  },
  clipboard: {
    matchVisual: false,
  },
};

const QUILL_FORMATS = [
  "header",
  "bold", "italic", "underline", "strike",
  "color", "background",
  "list", "indent", "align",
  "blockquote", "code-block",
  "link", "image",
];

const CreateNotePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const profile = useMyProfile();
  const { enqueueSnackbar } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedNoteId = searchParams.get("noteId");
  const autoStartVoice = searchParams.get("voice") === "1";

  const {
    loading,
    notes = [],
    error,
  } = useSelector((state) => state.notesState);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [validationOpen, setValidationOpen] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  // Distinct from isRecording: the session can be starting up (permission
  // prompt, device opening) before the microphone is actually live. The button
  // says "Starting" until this flips, so nobody talks into a closed mic.
  const [isListening, setIsListening] = useState(false);
  const [mobileNotesOpen, setMobileNotesOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [noteMenuAnchor, setNoteMenuAnchor] = useState(null);
  const [noteMenuTarget, setNoteMenuTarget] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState(""); // "", "saving", "saved"

  const pollTimerRef = useRef(null);
  const recognitionRef = useRef(null);
  const interimTranscriptRef = useRef("");
  const baseContentRef = useRef("");
  const silenceTimerRef = useRef(null);
  const isResizingRef = useRef(false);
  const heardSpeechRef = useRef(false);
  // True when the session ended because we or the user meant it to, so onend
  // can tell a deliberate stop from Chrome closing the stream on its own.
  const userStoppedRef = useRef(false);
  const voiceAutoStartedRef = useRef(false);
  const autoSaveTimerRef = useRef(null);
  const isSavingRef = useRef(false);

  // Two different waits, which is the fix for the bug that made voice input
  // look broken.
  //
  // There was one 6-second timeout, and it was armed the moment `start()` was
  // called. `start()` returns immediately, but the browser has not opened the
  // microphone yet — on first use it is still showing the permission prompt.
  // Finding and clicking "Allow" ate most of the window, so the timer fired
  // before the user had said anything and reported "No voice detected".
  //
  // These are two genuinely different questions: how long to wait for someone
  // to *begin*, and how long to wait for *more* after they pause. The first
  // includes gathering your thoughts; the second only spans a breath.
  const LISTEN_GRACE_MS = 20000;
  const SILENCE_AFTER_SPEECH_MS = 8000;

  const selectedNote = useMemo(
    () =>
      notes.find((n) => (n.noteId || n.id) === selectedNoteId) || null,
    [notes, selectedNoteId],
  );

  const orderedNotes = useMemo(() => {
    const noteTime = (note) => {
      const v = note?.createdAt || note?.updatedAt;
      const t = v ? new Date(v).getTime() : NaN;
      return Number.isNaN(t) ? 0 : t;
    };
    return [...notes].sort((a, b) => noteTime(b) - noteTime(a));
  }, [notes]);

  const summary = selectedNote?.summary || "";
  const summaryStatus = selectedNote?.summaryStatus || "NONE";

  useEffect(() => {
    dispatch(getAllNotes());
  }, [dispatch]);

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      // Set before aborting, so the `onend` handler treats this as deliberate
      // and does not restart recognition on a page that no longer exists —
      // which would hold the microphone open after the user navigated away.
      userStoppedRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!requestedNoteId || notes.length === 0) return;
    if (selectedNoteId === requestedNoteId) return;

    const target = notes.find(
      (n) => (n.noteId || n.id) === requestedNoteId,
    );
    if (target) {
      setSelectedNoteId(requestedNoteId);
      setTitle(target.title || "");
      setContent(target.content || "");
      setIsEditMode(false);
      setSummaryError("");
    }

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("noteId");
        return next;
      },
      { replace: true },
    );
  }, [requestedNoteId, notes, selectedNoteId, setSearchParams]);

  useEffect(() => {
    if (!autoStartVoice || voiceAutoStartedRef.current) return;
    voiceAutoStartedRef.current = true;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("voice");
        return next;
      },
      { replace: true },
    );

    const t = setTimeout(() => {
      handleStartRecording();
    }, 200);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartVoice]);

  useEffect(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    if (!selectedNoteId || summaryStatus !== "PENDING") {
      return;
    }

    let attempts = 0;
    pollTimerRef.current = setInterval(async () => {
      attempts += 1;
      const refreshed = await dispatch(getNoteById(selectedNoteId));
      const status = refreshed?.summaryStatus;
      if (
        !refreshed ||            // note deleted / not found (404) — stop polling
        status === "READY" ||
        status === "FAILED" ||
        attempts >= SUMMARY_POLL_MAX_ATTEMPTS
      ) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }, SUMMARY_POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [dispatch, selectedNoteId, summaryStatus]);

  // ─── Auto-save ───
  const AUTO_SAVE_DELAY_MS = 2000;

  useEffect(() => {
    // Only auto-save in edit mode with actual content
    if (!isEditMode || !title.trim() || !content.trim()) return;
    if (isSavingRef.current) return;

    // Clear previous timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      setAutoSaveStatus("saving");

      const noteData = {
        title: title.trim(),
        content: sanitizeNoteHtml(content.trim()),
      };

      try {
        if (selectedNoteId) {
          await dispatch(updateNote(selectedNoteId, noteData));
        } else {
          const createdNote = await dispatch(createNote(noteData));
          if (createdNote) {
            setSelectedNoteId(createdNote.noteId || createdNote.id || null);
          }
        }
        dispatch(getAllNotes());
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus(""), 2000);
      } catch (err) {
        setAutoSaveStatus("");
      } finally {
        isSavingRef.current = false;
      }
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, isEditMode]);

  // ─── Sidebar resize handlers ───
  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (moveEvent) => {
      if (!isResizingRef.current) return;
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.min(Math.max(startWidth + delta, 180), 500);
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // Strip unwanted inline styles (background, border, font-family, etc.) from pasted HTML
  const sanitizeNoteHtml = (html) => {
    if (!html) return html;
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.body.querySelectorAll("*").forEach((el) => {
      // Skip code blocks — preserve their styling
      if (el.tagName === "PRE" || el.closest("pre")) return;

      el.style.removeProperty("background-color");
      el.style.removeProperty("background");
      el.style.removeProperty("border");
      el.style.removeProperty("border-left");
      el.style.removeProperty("border-right");
      el.style.removeProperty("border-top");
      el.style.removeProperty("border-bottom");
      el.style.removeProperty("box-shadow");
      el.style.removeProperty("font-family");
      el.style.removeProperty("font-size");
      el.style.removeProperty("color");
      // Remove empty style attribute
      if (!el.getAttribute("style")?.trim()) {
        el.removeAttribute("style");
      }
    });
    return doc.body.innerHTML;
  };

  const handleSavedNote = async () => {
    if (!title.trim() || !content.trim()) {
      setValidationOpen(true);
      return;
    }

    const noteData = {
      title: title.trim(),
      content: sanitizeNoteHtml(content.trim()),
    };

    try {
      if (selectedNoteId) {
        const updatedNote = await dispatch(
          updateNote(selectedNoteId, noteData),
        );

        setTitle(updatedNote?.title || "");
        setContent(updatedNote?.content || "");
      } else {
        const createdNote = await dispatch(createNote(noteData));

        setSelectedNoteId(createdNote?.noteId || createdNote?.id || null);
        setTitle(createdNote?.title || "");
        setContent(createdNote?.content || "");
      }

      dispatch(getAllNotes());
    } catch (err) {
      console.error("Save note failed:", err);
    }
  };

  const handleSelectNote = (note) => {
    setSelectedNoteId(note.noteId || note.id);
    setTitle(note.title || "");
    setContent(note.content || "");
    setIsEditMode(false);
    setMobileNotesOpen(false);
  };

  const handleEditNote = (note) => {
    setSelectedNoteId(note.noteId || note.id);
    setTitle(note.title || "");
    setContent(note.content || "");
    setIsEditMode(true);
    setMobileNotesOpen(false);
  };

  const handleCreateNew = () => {
    setSelectedNoteId(null);
    setTitle("");
    setContent("");
    setIsEditMode(true);
    setSummaryError("");
    setMobileNotesOpen(false);
  };

  const handleDeleteRequest = (note) => {
    setDeleteTarget(note);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.noteId || deleteTarget.id;
    const targetTitle = deleteTarget.title || "Untitled note";
    const result = await dispatch(deleteNote(targetId));
    setDeleteTarget(null);

    if (result?.deletedId) {
      enqueueSnackbar(`"${targetTitle}" deleted successfully`, {
        variant: "success",
      });

      if (selectedNoteId === targetId) {
        setSelectedNoteId(null);
        setTitle("");
        setContent("");
        setIsEditMode(false);
        setSummaryError("");
      }
    } else if (result?.error) {
      enqueueSnackbar(result.error, { variant: "error" });
    }
  };

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const armSilenceTimer = () => {
    clearSilenceTimer();
    // Longer before the first word than between later ones.
    const wait = heardSpeechRef.current
      ? SILENCE_AFTER_SPEECH_MS
      : LISTEN_GRACE_MS;
    silenceTimerRef.current = setTimeout(() => {
      const msg = heardSpeechRef.current
        ? "Stopped listening — no more speech detected."
        : "Didn't hear anything, so voice input stopped. Tap the mic to try again.";
      enqueueSnackbar(msg, {
        variant: heardSpeechRef.current ? "info" : "warning",
      });
      userStoppedRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {
          // ignore
        }
      }
    }, wait);
  };

  const handleStartRecording = () => {
    if (isRecording) return;

    // Speech recognition needs a secure context. Served over plain http from a
    // LAN address — which is how you would open the app on a phone — the API
    // is either absent or fails instantly, and the browser's own error gives
    // no hint why. Checking first turns a mystery into an instruction.
    if (!window.isSecureContext) {
      enqueueSnackbar(
        "Voice input needs a secure connection. Open the app over https, or on localhost.",
        { variant: "error" },
      );
      return;
    }

    const SpeechRecognitionImpl =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionImpl) {
      enqueueSnackbar(
        "Voice input is not supported in this browser. Try Chrome or Edge.",
        { variant: "error" },
      );
      return;
    }

    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    baseContentRef.current = content ? `${content.trimEnd()} ` : "";
    interimTranscriptRef.current = "";
    heardSpeechRef.current = false;
    userStoppedRef.current = false;

    // The microphone is open and audio is arriving. This — not `start()` — is
    // the first moment the user could possibly have been heard, so it is where
    // the clock starts.
    recognition.onaudiostart = () => {
      setIsListening(true);
      armSilenceTimer();
    };

    recognition.onresult = (event) => {
      let finalChunk = "";
      let interimChunk = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || "";
        if (result.isFinal) {
          finalChunk += transcript;
        } else {
          interimChunk += transcript;
        }
      }

      if (finalChunk || interimChunk.trim()) {
        heardSpeechRef.current = true;
        armSilenceTimer();
      }

      if (finalChunk) {
        baseContentRef.current = `${baseContentRef.current}${finalChunk} `;
      }
      interimTranscriptRef.current = interimChunk;

      setContent(`${baseContentRef.current}${interimChunk}`);
      setIsEditMode(true);
    };

    recognition.onspeechstart = () => {
      heardSpeechRef.current = true;
      armSilenceTimer();
    };

    recognition.onerror = (event) => {
      const code = event?.error;

      // `no-speech` is not a failure worth ending the session over.
      //
      // Chrome raises it after a few seconds of quiet even with
      // `continuous = true`, so it fires while someone is simply thinking
      // about what to dictate. Treating it as fatal meant the session died on
      // the first pause. Our own timer already decides when silence has gone
      // on too long — that is the one place the decision belongs.
      if (code === "no-speech") {
        return;
      }

      clearSilenceTimer();
      userStoppedRef.current = true;

      if (code === "not-allowed" || code === "service-not-allowed") {
        enqueueSnackbar(
          "Microphone permission denied. Allow microphone access for this site and try again.",
          { variant: "error" },
        );
      } else if (code === "audio-capture") {
        enqueueSnackbar("No microphone found. Check your input device.", {
          variant: "error",
        });
      } else if (code === "network") {
        enqueueSnackbar(
          "Speech recognition needs an internet connection.",
          { variant: "error" },
        );
      } else if (code !== "aborted") {
        enqueueSnackbar(`Voice input error: ${code || "unknown"}`, {
          variant: "error",
        });
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {
          // ignore
        }
      }
    };

    recognition.onend = () => {
      // Chrome ends the session on its own after a quiet stretch, regardless of
      // `continuous`. If the user has not asked to stop and our own timer has
      // not expired, that end is the browser's housekeeping rather than the
      // user's intent — so pick the session straight back up.
      if (!userStoppedRef.current && recognitionRef.current) {
        try {
          recognition.start();
          return;
        } catch (_) {
          // Fall through and close down properly.
        }
      }

      clearSilenceTimer();
      setContent(baseContentRef.current.trimEnd());
      recognitionRef.current = null;
      setIsRecording(false);
      setIsListening(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      // Note: no timer armed here. It starts in `onaudiostart`, once the
      // microphone is actually open — see the constants above.
    } catch (err) {
      clearSilenceTimer();
      enqueueSnackbar("Unable to start voice input.", { variant: "error" });
    }
  };

  const handleStopRecording = () => {
    clearSilenceTimer();
    // Marks this as deliberate, so `onend` does not restart the session.
    userStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {
        // ignore
      }
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedNoteId) return;
    setSummaryError("");
    const result = await dispatch(requestSummary(selectedNoteId));
    if (result?.error) {
      setSummaryError(result.error);
    }
  };

  const notesPanelContent = (
    <>
      <Typography sx={{ mb: 2, fontWeight: 500 }}>Notes</Typography>

      <Button
        fullWidth
        startIcon={<AddRoundedIcon />}
        onClick={handleCreateNew}
        sx={{
          mb: 2,
          borderRadius: "999px",
          textTransform: "none",
          color: "var(--text)",
          border: "1px solid rgba(var(--ov),0.12)",
        }}
      >
        New note
      </Button>

      <Paper
        sx={{
          // Inset rather than glass: this sits inside the frosted sidebar, and
          // blurring an already-blurred backdrop turns muddy instead of
          // layered. A plain overlay tint gives the hierarchy without the
          // second blur pass — and without a second compositor layer.
          ...glassInset,
          p: 2,
          borderRadius: 3,
          color: "var(--text)",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <SearchOutlinedIcon sx={{ color: "rgba(var(--ov),0.6)" }} />
          <Typography sx={{ color: "rgba(var(--ov),0.6)" }}>
            Search saved notes
          </Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            variant="outlined"
            sx={{
              borderRadius: "999px",
              textTransform: "none",
              color: "var(--text)",
              borderColor: "rgba(var(--ov),0.12)",
            }}
          >
            Notes
          </Button>

          <IconButton sx={{ color: "var(--text)" }}>
            <ArrowForwardRoundedIcon />
          </IconButton>
        </Box>
      </Paper>

      <Box sx={{ mt: 2 }}>
        {loading && notes.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress size={24} sx={{ color: "var(--text)" }} />
          </Box>
        ) : notes.length === 0 ? (
          <Box sx={{ mt: 8, textAlign: "center", color: "var(--text-muted)" }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>
              No saved notes yet
            </Typography>
            <Typography variant="body2">
              Create a note and click Save note. It will appear here.
            </Typography>
          </Box>
        ) : (
          orderedNotes.map((note) => {
            const currentId = note.noteId || note.id;
            const isSelected = selectedNoteId === currentId;
            return (
              <Paper
                key={currentId}
                onClick={() => handleSelectNote(note)}
                elevation={0}
                sx={{
                  p: 1.75,
                  mb: 1.5,
                  borderRadius: 2,
                  cursor: "pointer",
                  position: "relative",
                  // Sized by its contents, not pinned.
                  //
                  // This was `height: 80` with `overflow: hidden`, which is 48px
                  // of usable space after padding — but the title row is ~30px
                  // and the two-line preview another ~36px. The overflow was
                  // clipped mid-glyph, so the second line of every preview was
                  // sliced in half. The line clamp below already truncates
                  // cleanly with an ellipsis; the fixed height only fought it.
                  minHeight: 92,
                  background: isSelected
                    ? "rgba(99,102,241,0.18)"
                    : "rgba(var(--ov),0.03)",
                  border: isSelected
                    ? "1px solid rgba(99,102,241,0.45)"
                    : "1px solid rgba(var(--ov),0.06)",
                  color: "var(--text)",
                  boxShadow: "none",
                  backgroundImage: "none",
                  "&:hover": {
                    background: isSelected
                      ? "rgba(99,102,241,0.22)"
                      : "rgba(var(--ov),0.06)",
                  },
                  "&:focus, &:focus-within, &:active": {
                    background: isSelected
                      ? "rgba(99,102,241,0.18)"
                      : "rgba(var(--ov),0.03)",
                    outline: "none",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    mb: 0.5,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 600,
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {note.title || "Untitled note"}
                  </Typography>

                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNoteMenuAnchor(e.currentTarget);
                      setNoteMenuTarget(note);
                    }}
                    sx={{
                      flexShrink: 0,
                      color: "rgba(var(--ov),0.6)",
                      "&:hover": {
                        color: "var(--text)",
                        background: "rgba(var(--ov),0.08)",
                      },
                    }}
                  >
                    <MoreVertOutlinedIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    // `--text-2` rather than a raw overlay alpha: the overlay
                    // triplet at 0.6 is a wash in light mode and washed-out in
                    // dark. This is body text, so it uses the text ramp.
                    color: "var(--text-2)",
                    fontSize: 13,
                    // Pinned so two lines occupy a predictable 36px and the
                    // clamp lands on a line boundary rather than through one.
                    lineHeight: "18px",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    // The extracted text is one long run with no break
                    // opportunities when a note starts with a URL, which is
                    // what pushed the preview past the card edge.
                    overflowWrap: "anywhere",
                  }}
                >
                  {(() => {
                    const raw = note.content || "Empty note";
                    const doc = new DOMParser().parseFromString(raw, "text/html");
                    return (doc.body.textContent || "").trim() || "Empty note";
                  })()}
                </Typography>
              </Paper>
            );
          })
        )}
      </Box>

      {/* Note card context menu */}
      <Menu
        anchorEl={noteMenuAnchor}
        open={Boolean(noteMenuAnchor)}
        onClose={() => {
          setNoteMenuAnchor(null);
          setNoteMenuTarget(null);
        }}
        PaperProps={{
          sx: {
            background: "var(--surface, #1e1e2e)",
            backgroundImage: "none",
            color: "var(--text)",
            border: "1px solid rgba(var(--ov),0.12)",
            borderRadius: 2,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            minWidth: 140,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (noteMenuTarget) handleEditNote(noteMenuTarget);
            setNoteMenuAnchor(null);
            setNoteMenuTarget(null);
          }}
          sx={{ gap: 1.5 }}
        >
          <ListItemIcon sx={{ color: "rgba(var(--ov),0.7)", minWidth: "auto" }}>
            <EditRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (noteMenuTarget) handleDeleteRequest(noteMenuTarget);
            setNoteMenuAnchor(null);
            setNoteMenuTarget(null);
          }}
          sx={{ gap: 1.5 }}
        >
          <ListItemIcon sx={{ color: "rgba(255,138,128,0.85)", minWidth: "auto" }}>
            <DeleteOutlineRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ color: "rgba(255,138,128,0.85)" }}>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );

  return (
    <Box
      sx={{
        height: "100dvh",
        boxSizing: "border-box",
        overflow: "hidden",
        background: "var(--surface-2)",
        color: "var(--text)",
        p: { xs: 1, sm: 1.5, md: 2 },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: 2,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flex: 1 }}>
          <Tooltip title="Back to dashboard">
            <IconButton
              onClick={() => navigate("/dashboard")}
              aria-label="Back to dashboard"
              sx={{
                color: "var(--text)",
                border: "1px solid rgba(var(--ov),0.18)",
              }}
              size="small"
            >
              <ArrowBackRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Open notes list">
            <IconButton
              onClick={() => setMobileNotesOpen(true)}
              sx={{
                color: "var(--text)",
                display: { xs: "inline-flex", md: "none" },
                border: "1px solid rgba(var(--ov),0.18)",
              }}
              size="small"
            >
              <MenuRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={title || "Untitled notebook"}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                minWidth: 0,
                fontSize: { xs: "1.05rem", sm: "1.25rem", md: "1.5rem" },
              }}
            >
              {title || "Untitled notebook"}
            </Typography>
          </Tooltip>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, md: 1.5 }, flexShrink: 0 }}>
          {autoSaveStatus && (
            <Typography
              sx={{
                fontSize: "0.75rem",
                color: autoSaveStatus === "saved" ? "rgba(34,197,94,0.85)" : "rgba(var(--ov),0.5)",
                whiteSpace: "nowrap",
              }}
            >
              {autoSaveStatus === "saving" ? "Saving..." : "Auto-saved ✓"}
            </Typography>
          )}

          <Button
            variant="outlined"
            startIcon={<ShareOutlinedIcon />}
            sx={{
              borderRadius: "999px",
              textTransform: "none",
              color: "var(--text)",
              borderColor: "rgba(var(--ov),0.2)",
              display: { xs: "none", md: "inline-flex" },
            }}
          >
            Share
          </Button>

          <Button
            variant="outlined"
            startIcon={<SettingsOutlinedIcon />}
            onClick={() => navigate("/dashboard/settings")}
            sx={{
              borderRadius: "999px",
              textTransform: "none",
              color: "var(--text)",
              borderColor: "rgba(var(--ov),0.2)",
              display: { xs: "none", md: "inline-flex" },
            }}
          >
            Settings
          </Button>

          <Tooltip title="Share">
            <IconButton
              size="small"
              sx={{
                color: "var(--text)",
                display: { xs: "inline-flex", md: "none" },
                border: "1px solid rgba(var(--ov),0.18)",
              }}
            >
              <ShareOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* The overflow menu that used to sit here had no handler and no
              items — it opened nothing. Settings is the only thing it could
              have led to, and that already has its own button. */}

          <Tooltip title="Settings">
            <IconButton
              size="small"
              onClick={() => navigate("/dashboard/settings")}
              sx={{
                color: "var(--text)",
                display: { xs: "inline-flex", md: "none" },
                border: "1px solid rgba(var(--ov),0.18)",
              }}
            >
              <SettingsOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={profile?.displayName || profile?.username || "Account"}>
            <Avatar
              src={profile?.avatarUrl || undefined}
              onClick={() => navigate("/dashboard/settings")}
              sx={{
                width: { xs: 30, md: 34 },
                height: { xs: 30, md: 34 },
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                bgcolor: "rgba(99,102,241,0.35)",
                color: "var(--text)",
              }}
            >
              {initialsFor(profile)}
            </Avatar>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Typography sx={{ color: "var(--danger)", mb: 1 }}>
          {typeof error === "string" ? error : "Something went wrong"}
        </Typography>
      )}

      <Box
        sx={{
          display: "flex",
          gap: { xs: 1, md: 2 },
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* Left panel (desktop only — Drawer below md) */}
        <Box
          sx={{
            position: "relative",
            width: sidebarWidth,
            minWidth: 180,
            maxWidth: 500,
            flexShrink: 0,
            display: { xs: "none", md: "flex" },
            height: "100%",
          }}
        >
          <Paper
            sx={{
              // No lit edge: this panel scrolls, and an absolutely-positioned
              // highlight would slide away with the content.
              ...glassCard({ highlight: false }),
              width: "100%",
              color: "var(--text)",
              p: 2,
              height: "100%",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",

              overflowY: "auto",
              overflowX: "hidden",
              scrollBehavior: "smooth",
              msOverflowStyle: "none",

              backgroundClip: "padding-box",
              clipPath: "inset(0 round 24px)",

              "&::-webkit-scrollbar": { width: "8px" },
              "&::-webkit-scrollbar-track": { background: "transparent" },
              "&::-webkit-scrollbar-thumb": {
                background: "rgba(var(--ov),0.3)",
                borderRadius: "999px",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                background: "rgba(var(--ov),0.5)",
              },
            }}
          >
            {notesPanelContent}
          </Paper>

          {/* Resize handle */}
          <Box
            onMouseDown={handleResizeMouseDown}
            sx={{
              position: "absolute",
              top: 0,
              bottom: 0,
              right: -5,
              width: 10,
              cursor: "col-resize",
              zIndex: 10,
            }}
          />
        </Box>

        <Drawer
          anchor="left"
          open={mobileNotesOpen}
          onClose={() => setMobileNotesOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" } }}
          PaperProps={{
            sx: {
              width: { xs: "85vw", sm: 360 },
              backgroundImage: "none",
              color: "var(--text)",
              p: 2,
              boxSizing: "border-box",
            },
          }}
        >
          {notesPanelContent}
        </Drawer>

        {/* Right panel */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            position: "relative",
            display: "flex",
          }}
        >
        <Paper
          sx={{
            ...glassCard({ highlight: false }),
            flex: 1,
            minWidth: 0,
            color: "var(--text)",
            p: 0,
            height: "100%",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",

            backgroundClip: "padding-box",
            clipPath: "inset(0 round 24px)",
          }}
        >
          {/* Fixed title header — stays put while the content below scrolls */}
          <Box
            sx={{
              flexShrink: 0,
              px: { xs: 2, md: 4 },
              pt: { xs: 2, md: 4 },
            }}
          >
            <Box>
              <InputBase
                fullWidth
                placeholder="Untitled note"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                readOnly={!isEditMode}
                sx={{
                  color: "var(--text)",
                  fontSize: { xs: "1.5rem", sm: "2rem", md: "2.6rem" },
                  fontWeight: 600,
                  mb: 1.5,
                }}
              />
            </Box>

            <Divider />
          </Box>

          {/* Scrollable content + AI sections */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
              scrollBehavior: "smooth",
              px: { xs: 1.5, sm: 2, md: 3 },
              pb: { xs: 2, md: 4 },

              msOverflowStyle: "none",
              "&::-webkit-scrollbar": { width: "8px" },
              "&::-webkit-scrollbar-track": { background: "transparent" },
              "&::-webkit-scrollbar-thumb": {
                background: "rgba(var(--ov),0.3)",
                borderRadius: "999px",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                background: "rgba(var(--ov),0.5)",
              },
            }}
          >
            <Box sx={{ width: "100%", overflowWrap: "break-word", wordBreak: "break-word" }}>
              {isEditMode ? (
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  placeholder="Start writing your note here..."
                  modules={QUILL_MODULES}
                  formats={QUILL_FORMATS}
                  style={{ minHeight: 400 }}
                />
              ) : (
                <Box
                  sx={{
                    color: "rgba(var(--ov),0.92)",
                    fontSize: "1rem",
                    lineHeight: 1.9,
                    minHeight: 400,
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                    "& p": { margin: "0.4em 0" },
                    "& ul, & ol": { paddingLeft: "1.5em" },
                    "& *": { maxWidth: "100%" },
                    "& pre": {
                      background: "#1e1e2e !important",
                      color: "#abb2bf",
                      borderRadius: "10px",
                      padding: "1.2em",
                      fontFamily: '"Fira Code", "JetBrains Mono", "Cascadia Code", Consolas, "Courier New", monospace',
                      fontSize: "0.9rem",
                      lineHeight: 1.7,
                      overflowX: "auto",
                      border: "1px solid rgba(var(--ov), 0.1)",
                      margin: "1em 0",
                      whiteSpace: "pre",
                      wordWrap: "normal",
                      wordBreak: "normal",
                    },
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(content) || "<p style='color:rgba(var(--ov),0.5); font-style:italic'>No content yet.</p>" }}
                />
              )}
            </Box>

          {selectedNoteId && (
            <Box sx={{ width: "100%", mt: 4 }}>
              <Divider sx={{ borderColor: "rgba(var(--ov),0.08)", mb: 2 }} />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 1.5,
                }}
              >
                <AutoAwesomeRoundedIcon sx={{ color: "var(--accent-soft)" }} />
                <Typography sx={{ fontWeight: 600, fontSize: 18 }}>
                  AI Summary
                </Typography>
                {summaryStatus === "PENDING" && (
                  <Chip
                    size="small"
                    icon={
                      <CircularProgress
                        size={12}
                        sx={{ color: "#fff !important" }}
                      />
                    }
                    label="Generating..."
                    sx={{
                      color: "var(--text)",
                      backgroundColor: "rgba(99,102,241,0.25)",
                      "& .MuiChip-icon": { ml: 1, mr: -0.5 },
                    }}
                  />
                )}
                {summaryStatus === "READY" && (
                  <Chip
                    size="small"
                    label="Ready"
                    sx={{
                      color: "var(--text)",
                      backgroundColor: "rgba(34,197,94,0.25)",
                    }}
                  />
                )}
                {summaryStatus === "FAILED" && (
                  <Chip
                    size="small"
                    label="Failed"
                    sx={{
                      color: "var(--text)",
                      backgroundColor: "rgba(239,68,68,0.3)",
                    }}
                  />
                )}

                <Box sx={{ flexGrow: 1 }} />

                {(summaryStatus === "NONE" ||
                  summaryStatus === "FAILED" ||
                  summaryStatus === "READY" ||
                  !summaryStatus) && (
                  <Button
                    size="small"
                    onClick={handleGenerateSummary}
                    startIcon={<AutoAwesomeRoundedIcon />}
                    disabled={
                      !content || content.trim().length < 50 || isEditMode
                    }
                    sx={{
                      borderRadius: "999px",
                      textTransform: "none",
                      color: "var(--text)",
                      backgroundColor: "rgba(99,102,241,0.35)",
                      px: 2,
                      "&:hover": {
                        backgroundColor: "rgba(99,102,241,0.55)",
                      },
                      "&.Mui-disabled": {
                        color: "var(--text-muted)",
                        backgroundColor: "rgba(var(--ov),0.05)",
                      },
                    }}
                  >
                    {summaryStatus === "READY"
                      ? "Regenerate"
                      : summaryStatus === "FAILED"
                        ? "Try again"
                        : "Generate AI Summary"}
                  </Button>
                )}
              </Box>

              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  background: "rgba(var(--ov),0.03)",
                  border: "1px solid rgba(var(--ov),0.08)",
                  color: "rgba(var(--ov),0.85)",
                  boxShadow: "none",
                }}
              >
                {summary ? (
                  <Typography sx={{ fontSize: "0.95rem", lineHeight: 1.7 }}>
                    {summary}
                  </Typography>
                ) : summaryStatus === "PENDING" ? (
                  <Typography
                    sx={{
                      fontSize: "0.9rem",
                      color: "var(--text-muted)",
                      fontStyle: "italic",
                    }}
                  >
                    Generating AI summary in the background...
                  </Typography>
                ) : summaryStatus === "FAILED" ? (
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "0.9rem",
                        color: "rgba(255,138,128,0.9)",
                      }}
                    >
                      Last summary attempt failed. Click "Try again" to retry.
                    </Typography>
                    {/* Summarization runs off a Kafka event, so the reason
                        cannot come back on this response. The usual cause is a
                        missing provider key — point at the fix. */}
                    <Typography
                      sx={{
                        mt: 0.75,
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Summaries run on your own Groq key.{" "}
                      <Box
                        component="span"
                        onClick={() => navigate(KEYS_ROUTE)}
                        sx={{
                          color: "var(--accent-soft)",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        Check your provider key
                      </Box>{" "}
                      if this keeps failing.
                    </Typography>
                  </Box>
                ) : (
                  <Typography
                    sx={{
                      fontSize: "0.9rem",
                      color: "var(--text-muted)",
                      fontStyle: "italic",
                    }}
                  >
                    {content && content.trim().length < 50
                      ? "Note must be at least 50 characters to summarize."
                      : isEditMode
                        ? "Save the note before generating a summary."
                        : "Click \"Generate AI Summary\" to create short note."}
                  </Typography>
                )}

                {summaryError && (
                  <Typography
                    sx={{
                      mt: 1.5,
                      fontSize: "0.85rem",
                      color: "rgba(255,138,128,0.95)",
                    }}
                  >
                    {summaryError}
                  </Typography>
                )}
              </Paper>
            </Box>
          )}

          {selectedNote && <AiInsightsPanel note={selectedNote} />}
          </Box>

          {/* Delete Confirmation Modal */}
          <Dialog
            open={Boolean(deleteTarget)}
            onClose={() => setDeleteTarget(null)}
            BackdropProps={{
              sx: {
                backdropFilter: "blur(6px)",
                backgroundColor: "rgba(0,0,0,0.6)",
              },
            }}
            PaperProps={{
              sx: {
                color: "var(--text)",
                borderRadius: 3,
                minWidth: { xs: "auto", sm: 420 },
                width: { xs: "calc(100vw - 64px)", sm: "auto" },
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              },
            }}
          >
            <DialogContent>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                Delete note?
              </Typography>

              <Typography sx={{ color: "rgba(var(--ov),0.7)", mb: 3 }}>
                "{deleteTarget?.title || "Untitled note"}" will be permanently
                deleted. This action cannot be undone.
              </Typography>

              <Box
                sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}
              >
                <Button
                  onClick={() => setDeleteTarget(null)}
                  disabled={loading}
                  sx={{
                    borderRadius: "999px",
                    textTransform: "none",
                    color: "var(--text)",
                    border: "1px solid rgba(var(--ov),0.18)",
                    px: 2.5,
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  disabled={loading}
                  sx={{
                    borderRadius: "999px",
                    textTransform: "none",
                    color: "var(--text)",
                    backgroundColor: "rgba(239,68,68,0.85)",
                    px: 2.5,
                    "&:hover": {
                      backgroundColor: "rgba(239,68,68,1)",
                    },
                    "&.Mui-disabled": {
                      color: "var(--text-muted)",
                      backgroundColor: "rgba(239,68,68,0.35)",
                    },
                  }}
                >
                  {loading ? "Deleting..." : "Delete"}
                </Button>
              </Box>
            </DialogContent>
          </Dialog>

          {/* Validation Modal */}
          <Dialog
            open={validationOpen}
            onClose={() => setValidationOpen(false)}
            BackdropProps={{
              sx: {
                backdropFilter: "blur(6px)",
                backgroundColor: "rgba(0,0,0,0.6)",
              },
            }}
            PaperProps={{
              sx: {
                color: "var(--text)",
                borderRadius: 3,
                minWidth: { xs: "auto", sm: 420 },
                width: { xs: "calc(100vw - 64px)", sm: "auto" },
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              },
            }}
          >
            <DialogContent>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                Required Fields
              </Typography>

              <Typography sx={{ color: "rgba(var(--ov),0.7)", mb: 3 }}>
                Title and content are required.
              </Typography>

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  onClick={() => setValidationOpen(false)}
                  sx={{
                    borderRadius: "999px",
                    textTransform: "none",
                    color: "var(--text)",
                    border: "1px solid rgba(var(--ov),0.18)",
                    px: 2.5,
                  }}
                >
                  OK
                </Button>
              </Box>
            </DialogContent>
          </Dialog>
        </Paper>

          <Tooltip
            title={
              !isRecording
                ? "Dictate a note"
                : isListening
                  ? "Listening — tap to stop"
                  : "Starting microphone…"
            }
            placement="left"
          >
          <Fab
            onClick={handleToggleRecording}
            aria-label={isRecording ? "Stop voice input" : "Start voice input"}
            sx={{
              position: "absolute",
              bottom: 24,
              right: 24,
              zIndex: 3,
              width: 56,
              height: 56,
              color: "#ffffff",
              backgroundColor: isRecording
                ? "rgba(239,68,68,0.95)"
                : "rgba(99,102,241,0.95)",
              boxShadow: isRecording
                ? "0 8px 24px rgba(239,68,68,0.35)"
                : "0 8px 24px rgba(99,102,241,0.35)",
              // Pulses only once the microphone is actually open. While the
              // permission prompt is up the button is live but deaf, and a
              // pulsing "recording" light there invites the user to talk into
              // nothing — which is how the original bug felt from the outside.
              animation: isListening
                ? "voiceFabPulse 1.4s ease-in-out infinite"
                : "none",
              "@keyframes voiceFabPulse": {
                "0%, 100%": {
                  boxShadow: "0 0 0 0 rgba(239,68,68,0.55)",
                },
                "50%": {
                  boxShadow: "0 0 0 12px rgba(239,68,68,0)",
                },
              },
              "&:hover": {
                backgroundColor: isRecording
                  ? "rgba(239,68,68,1)"
                  : "rgba(99,102,241,1)",
              },
            }}
          >
            {isRecording ? <StopCircleRoundedIcon /> : <MicNoneRoundedIcon />}
          </Fab>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};

export default CreateNotePage;
