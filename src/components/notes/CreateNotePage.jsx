import React, { useEffect, useMemo, useRef, useState } from "react";
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
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useSnackbar } from "notistack";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
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

const CreateNotePage = () => {
  const dispatch = useDispatch();
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
  const [mobileNotesOpen, setMobileNotesOpen] = useState(false);

  const pollTimerRef = useRef(null);
  const recognitionRef = useRef(null);
  const interimTranscriptRef = useRef("");
  const baseContentRef = useRef("");
  const silenceTimerRef = useRef(null);
  const heardSpeechRef = useRef(false);
  const voiceAutoStartedRef = useRef(false);

  const SILENCE_TIMEOUT_MS = 6000;

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

  const handleSavedNote = async () => {
    if (!title.trim() || !content.trim()) {
      setValidationOpen(true);
      return;
    }

    const noteData = {
      title: title.trim(),
      content: content.trim(),
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
    silenceTimerRef.current = setTimeout(() => {
      const msg = heardSpeechRef.current
        ? "Stopped listening — no more speech detected."
        : "No voice detected. Voice input stopped.";
      enqueueSnackbar(msg, {
        variant: heardSpeechRef.current ? "info" : "warning",
      });
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {
          // ignore
        }
      }
    }, SILENCE_TIMEOUT_MS);
  };

  const handleStartRecording = () => {
    if (isRecording) return;

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
      clearSilenceTimer();
      if (code === "not-allowed" || code === "service-not-allowed") {
        enqueueSnackbar("Microphone permission denied.", { variant: "error" });
      } else if (code === "no-speech") {
        enqueueSnackbar("No voice detected. Voice input stopped.", {
          variant: "warning",
        });
      } else if (code === "audio-capture") {
        enqueueSnackbar("No microphone available.", { variant: "error" });
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
      clearSilenceTimer();
      setContent(baseContentRef.current.trimEnd());
      recognitionRef.current = null;
      setIsRecording(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      armSilenceTimer();
    } catch (err) {
      clearSilenceTimer();
      enqueueSnackbar("Unable to start voice input.", { variant: "error" });
    }
  };

  const handleStopRecording = () => {
    clearSilenceTimer();
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
          p: 2,
          background: "var(--surface-2)",
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
          <Box sx={{ mt: 8, textAlign: "center", color: "rgba(var(--ov),0.55)" }}>
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
                sx={{
                  p: 2,
                  mb: 1.5,
                  borderRadius: 2,
                  cursor: "pointer",
                  position: "relative",
                  background: isSelected
                    ? "rgba(99,102,241,0.18)"
                    : "rgba(var(--ov),0.03)",
                  border: isSelected
                    ? "1px solid rgba(99,102,241,0.45)"
                    : "1px solid rgba(var(--ov),0.06)",
                  color: "var(--text)",
                  boxShadow: "none",
                  "&:hover": { background: "rgba(var(--ov),0.06)" },
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.25,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditNote(note);
                    }}
                    sx={{
                      color: "rgba(var(--ov),0.7)",
                      "&:hover": {
                        color: "var(--text)",
                        background: "rgba(var(--ov),0.08)",
                      },
                    }}
                  >
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>

                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRequest(note);
                    }}
                    sx={{
                      color: "rgba(255,138,128,0.85)",
                      "&:hover": {
                        color: "#ff8a80",
                        background: "rgba(239,68,68,0.12)",
                      },
                    }}
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Typography
                  sx={{
                    fontWeight: 600,
                    mb: 0.5,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    pr: 7,
                  }}
                >
                  {note.title || "Untitled note"}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(var(--ov),0.6)",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {note.content || "Empty note"}
                </Typography>
              </Paper>
            );
          })
        )}
      </Box>
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
        p: 2,
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
          {isEditMode && (
            <Button
              startIcon={<AddRoundedIcon />}
              onClick={handleSavedNote}
              variant="contained"
              disabled={loading || !isEditMode}
              sx={{
                borderRadius: "999px",
                px: 2.6,
                textTransform: "none",
                color: "var(--bg)",
                backgroundColor: "var(--text)",
                boxShadow: "none",
                "&:hover": {
                  backgroundColor: "#e8ecf7",
                  boxShadow: "none",
                },
              }}
            >
              {loading
                ? "Saving..."
                : selectedNoteId
                  ? "Update note"
                  : "Save note"}
            </Button>
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

          <IconButton
            sx={{
              color: "var(--text)",
              display: { xs: "none", sm: "inline-flex" },
            }}
          >
            <MoreVertOutlinedIcon />
          </IconButton>

          <Avatar sx={{ width: { xs: 30, md: 34 }, height: { xs: 30, md: 34 } }} />
        </Box>
      </Box>

      {error && (
        <Typography sx={{ color: "#ff8a80", mb: 1 }}>
          {typeof error === "string" ? error : "Something went wrong"}
        </Typography>
      )}

      <Box
        sx={{
          display: "flex",
          gap: 2,
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* Left panel (desktop only — Drawer below md) */}
        <Paper
          sx={{
            width: "26%",
            background: "var(--surface)",
            color: "var(--text)",
            borderRadius: 3,
            p: 2,
            height: "100%",
            boxSizing: "border-box",
            display: { xs: "none", md: "flex" },
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

        <Drawer
          anchor="left"
          open={mobileNotesOpen}
          onClose={() => setMobileNotesOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" } }}
          PaperProps={{
            sx: {
              width: { xs: "85vw", sm: 360 },
              background: "var(--surface)",
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
            minHeight: 0,
            position: "relative",
            display: "flex",
          }}
        >
        <Paper
          sx={{
            flex: 1,
            background: "var(--surface)",
            color: "var(--text)",
            borderRadius: 3,
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
            <Box sx={{ maxWidth: 1200, mx: "auto" }}>
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
              px: { xs: 2, md: 4 },
              pt: { xs: 2, md: 3 },
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
            <Box sx={{ maxWidth: 1200, mx: "auto" }}>
              <InputBase
                fullWidth
                multiline
                minRows={20}
                placeholder="Start writing your note here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                readOnly={!isEditMode}
                sx={{
                  color: "rgba(var(--ov),0.92)",
                  fontSize: "1rem",
                  lineHeight: 1.9,
                  alignItems: "flex-start",
                  "& textarea": {
                    overflow: "auto !important",
                  },
                }}
              />
            </Box>

          {selectedNoteId && (
            <Box sx={{ maxWidth: 1200, mx: "auto", mt: 4 }}>
              <Divider sx={{ borderColor: "rgba(var(--ov),0.08)", mb: 2 }} />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 1.5,
                }}
              >
                <AutoAwesomeRoundedIcon sx={{ color: "#a5b4fc" }} />
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
                        color: "rgba(var(--ov),0.4)",
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
                      color: "rgba(var(--ov),0.55)",
                      fontStyle: "italic",
                    }}
                  >
                    Generating AI summary in the background...
                  </Typography>
                ) : summaryStatus === "FAILED" ? (
                  <Typography
                    sx={{
                      fontSize: "0.9rem",
                      color: "rgba(255,138,128,0.9)",
                    }}
                  >
                    Last summary attempt failed. Click "Try again" to retry.
                  </Typography>
                ) : (
                  <Typography
                    sx={{
                      fontSize: "0.9rem",
                      color: "rgba(var(--ov),0.5)",
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
                background: "var(--surface)",
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
                      color: "rgba(var(--ov),0.5)",
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
                background: "var(--surface)",
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
              animation: isRecording
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
        </Box>
      </Box>
    </Box>
  );
};

export default CreateNotePage;
