import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import DriveFileRenameOutlineRoundedIcon from "@mui/icons-material/DriveFileRenameOutlineRounded";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import PushPinRoundedIcon from "@mui/icons-material/PushPinRounded";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import UnarchiveOutlinedIcon from "@mui/icons-material/UnarchiveOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

import {
  aiChatConversationsService,
  aiChatHistoryService,
  aiChatStreamRequest,
  deleteConversationService,
  updateConversationService,
} from "../store/services/AiCoreService";

const formatConvDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

// Default until the first response tells us the real model the server used.
// Backend (ai-core-service) chats via OpenRouter using openai/gpt-oss-120b.
const DEFAULT_MODEL = "openai/gpt-oss-120b";

// Friendly labels for known model ids; everything else uses the fallback below.
const MODEL_LABELS = {
  "openai/gpt-oss-120b": "GPT-OSS-120B",
  "gpt-oss-120b": "GPT-OSS-120B",
  "gemini-2.5-flash": "Gemini 2.5 Flash",
};

// e.g. "openai/gpt-oss-120b" -> "GPT-OSS-120B", "gemini-2.5-flash" -> "Gemini 2.5 Flash"
const prettyModel = (id) => {
  if (!id) return "";
  if (MODEL_LABELS[id]) return MODEL_LABELS[id];
  const name = id.includes("/") ? id.split("/").pop() : id;
  return name
    .split(/[-_]/)
    .map((part) =>
      /\d/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ");
};

const AiChatPage = () => {
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [conversations, setConversations] = useState([]);
  const [archivedConversations, setArchivedConversations] = useState([]);
  const [viewArchived, setViewArchived] = useState(false);
  const [convsLoading, setConvsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [useNotesContext, setUseNotesContext] = useState(false);
  const [model, setModel] = useState(DEFAULT_MODEL);

  // Per-conversation context menu + dialogs
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuConv, setMenuConv] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  const scrollRef = useRef(null);

  const loadConversations = useCallback(async () => {
    setConvsLoading(true);
    try {
      const [activeRes, archivedRes] = await Promise.all([
        aiChatConversationsService(false),
        aiChatConversationsService(true),
      ]);
      // Filter by the `archived` flag on each item rather than trusting the
      // endpoint — so the lists stay correct even if the backend ignores the
      // ?archived param. (No archived chats => no "Archived" row at all.)
      const active = (activeRes.data?.conversations || []).filter(
        (c) => !c.archived,
      );
      const archived = (archivedRes.data?.conversations || []).filter(
        (c) => c.archived,
      );
      setConversations(active);
      setArchivedConversations(archived);
    } catch (err) {
      // silent — sidebar just stays empty
    } finally {
      setConvsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Leave the Archived view automatically once nothing is archived.
  useEffect(() => {
    if (viewArchived && archivedConversations.length === 0) {
      setViewArchived(false);
    }
  }, [viewArchived, archivedConversations]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const handleNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setError("");
    setDraft("");
    setMobileSidebarOpen(false);
  };

  const handleOpenConvMenu = (event, conv) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuConv(conv);
  };

  const handleCloseConvMenu = () => {
    // Drop focus off the menu item before the popover (and any following
    // dialog) applies aria-hidden — a focused element must not be hidden.
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setMenuAnchor(null);
    setMenuConv(null);
  };

  // After archive/delete, clear the open chat if it was the affected one.
  const refreshAfterMutation = async (affectedId) => {
    if (affectedId && affectedId === conversationId) {
      setConversationId(null);
      setMessages([]);
    }
    await loadConversations();
  };

  const handleTogglePin = async (conv) => {
    handleCloseConvMenu();
    try {
      await updateConversationService(conv.conversationId, {
        pinned: !conv.pinned,
      });
      await loadConversations();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to update conversation.");
    }
  };

  const handleArchive = async (conv) => {
    handleCloseConvMenu();
    try {
      await updateConversationService(conv.conversationId, { archived: true });
      await refreshAfterMutation(conv.conversationId);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to archive conversation.");
    }
  };

  const handleUnarchive = async (conv) => {
    handleCloseConvMenu();
    try {
      await updateConversationService(conv.conversationId, { archived: false });
      await loadConversations();
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Failed to unarchive conversation.",
      );
    }
  };

  const handleStartRename = (conv) => {
    setRenameTarget(conv);
    setRenameValue(conv.title || "");
    handleCloseConvMenu();
  };

  const handleConfirmRename = async () => {
    const title = renameValue.trim();
    if (!renameTarget || !title) return;
    setActionBusy(true);
    try {
      await updateConversationService(renameTarget.conversationId, { title });
      setRenameTarget(null);
      setRenameValue("");
      await loadConversations();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to rename conversation.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleStartDelete = (conv) => {
    setDeleteTarget(conv);
    handleCloseConvMenu();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setActionBusy(true);
    try {
      await deleteConversationService(deleteTarget.conversationId);
      const removedId = deleteTarget.conversationId;
      setDeleteTarget(null);
      await refreshAfterMutation(removedId);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to delete conversation.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleSelectConversation = async (convId) => {
    if (convId === conversationId) {
      setMobileSidebarOpen(false);
      return;
    }
    setConversationId(convId);
    setMessages([]);
    setError("");
    setMobileSidebarOpen(false);
    setHistoryLoading(true);
    try {
      const response = await aiChatHistoryService(convId);
      const history = (response.data?.messages || []).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      setMessages(history);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to load conversation.",
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  // Append streamed text to the trailing assistant message.
  const appendToAssistant = (deltaText) => {
    setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last && last.role === "assistant") {
        copy[copy.length - 1] = { ...last, content: last.content + deltaText };
      }
      return copy;
    });
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;

    setError("");
    setDraft("");
    // Add the user message + an empty assistant placeholder we stream into.
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
      { role: "assistant", content: "", citations: [] },
    ]);
    setSending(true);

    let nextConversationId = conversationId;
    let isNew = false;
    let streamError = "";

    try {
      const response = await aiChatStreamRequest({
        message: text,
        conversationId,
        useNotesContext,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Chat request failed (${response.status}).`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Read the SSE stream: events are separated by a blank line.
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() || "";

        for (const block of blocks) {
          const line = block.trim();
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;

          let evt;
          try {
            evt = JSON.parse(payload);
          } catch {
            continue;
          }

          if (evt.type === "meta") {
            nextConversationId = evt.conversationId || conversationId;
            isNew = !conversationId && Boolean(evt.conversationId);
            if (evt.conversationId) setConversationId(evt.conversationId);
            if (evt.model) setModel(evt.model);
            if (Array.isArray(evt.citations) && evt.citations.length) {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && last.role === "assistant") {
                  copy[copy.length - 1] = { ...last, citations: evt.citations };
                }
                return copy;
              });
            }
          } else if (evt.type === "delta") {
            appendToAssistant(evt.text || "");
          } else if (evt.type === "error") {
            streamError = evt.message || "Stream error.";
          }
        }
      }

      if (streamError) throw new Error(streamError);

      if (
        isNew ||
        !conversations.find((c) => c.conversationId === nextConversationId)
      ) {
        loadConversations();
      }
    } catch (err) {
      setError(err?.message || "Chat request failed.");
      // Drop the (possibly empty) assistant placeholder and the user message,
      // and restore the draft so the user can retry.
      setMessages((prev) => {
        let copy = [...prev];
        if (
          copy.length &&
          copy[copy.length - 1].role === "assistant" &&
          !copy[copy.length - 1].content
        ) {
          copy = copy.slice(0, -1);
        }
        if (copy.length && copy[copy.length - 1].role === "user") {
          copy = copy.slice(0, -1);
        }
        return copy;
      });
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const renderConversationRow = (c) => {
    const active = c.conversationId === conversationId;
    return (
      <Box
        key={c.conversationId}
        onClick={() => handleSelectConversation(c.conversationId)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          px: 1.5,
          py: 1,
          mb: 0.5,
          borderRadius: 1.5,
          cursor: "pointer",
          backgroundColor: active ? "rgba(99,102,241,0.22)" : "transparent",
          border: "1px solid",
          borderColor: active ? "rgba(99,102,241,0.45)" : "transparent",
          "&:hover": {
            backgroundColor: active
              ? "rgba(99,102,241,0.28)"
              : "rgba(var(--ov),0.04)",
          },
        }}
      >
        <ChatBubbleOutlineRoundedIcon
          sx={{
            fontSize: 16,
            color: active ? "#a5b4fc" : "rgba(var(--ov),0.5)",
            flexShrink: 0,
          }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 500,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {c.title || "Untitled chat"}
          </Typography>
          <Typography sx={{ fontSize: 11, color: "rgba(var(--ov),0.45)" }}>
            {formatConvDate(c.updatedAt)}
          </Typography>
        </Box>

        {c.pinned && !c.archived && (
          <PushPinRoundedIcon
            sx={{
              fontSize: 14,
              color: "#a5b4fc",
              transform: "rotate(45deg)",
              flexShrink: 0,
            }}
          />
        )}

        <IconButton
          size="small"
          aria-label="Conversation options"
          onClick={(e) => handleOpenConvMenu(e, c)}
          sx={{
            flexShrink: 0,
            color: "rgba(var(--ov),0.5)",
            "&:hover": {
              color: "var(--text)",
              backgroundColor: "rgba(var(--ov),0.08)",
            },
          }}
        >
          <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    );
  };

  const sidebarContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <Tooltip title={viewArchived ? "Back to chats" : "Back to dashboard"}>
          <IconButton
            onClick={() =>
              viewArchived ? setViewArchived(false) : navigate("/dashboard")
            }
            sx={{ color: "var(--text)" }}
            size="small"
          >
            <ArrowBackRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography sx={{ fontWeight: 600, fontSize: 14, flex: 1 }}>
          {viewArchived ? "Archived" : "Conversations"}
        </Typography>
      </Box>

      {!viewArchived && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Button
            fullWidth
            startIcon={<AddRoundedIcon />}
            onClick={handleNewChat}
            sx={{
              borderRadius: "999px",
              textTransform: "none",
              color: "var(--text)",
              backgroundColor: "rgba(99,102,241,0.35)",
              "&:hover": { backgroundColor: "rgba(99,102,241,0.55)" },
            }}
          >
            New chat
          </Button>
        </Box>
      )}

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          px: 1,
          pb: 1,
          // Match the notes panel scrollbar style
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
        {convsLoading &&
          conversations.length === 0 &&
          archivedConversations.length === 0 && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={18} sx={{ color: "#a5b4fc" }} />
            </Box>
          )}

        {viewArchived ? (
          // ---- Archived view ----
          archivedConversations.map(renderConversationRow)
        ) : (
          // ---- Normal view: "Archived" entry on top, then active chats ----
          <>
            {archivedConversations.length > 0 && (
              <Box
                onClick={() => setViewArchived(true)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  px: 1.5,
                  py: 1,
                  mb: 1,
                  borderRadius: 1.5,
                  cursor: "pointer",
                  border: "1px solid rgba(var(--ov),0.06)",
                  "&:hover": { backgroundColor: "rgba(var(--ov),0.04)" },
                }}
              >
                <ArchiveOutlinedIcon
                  sx={{ fontSize: 18, color: "rgba(var(--ov),0.6)", flexShrink: 0 }}
                />
                <Typography sx={{ flex: 1, fontSize: 13, fontWeight: 500 }}>
                  Archived
                </Typography>
                <Box
                  component="span"
                  sx={{
                    fontSize: 12,
                    color: "rgba(var(--ov),0.6)",
                    backgroundColor: "rgba(var(--ov),0.08)",
                    borderRadius: "999px",
                    px: 1,
                    py: 0.1,
                  }}
                >
                  {archivedConversations.length}
                </Box>
                <ChevronRightRoundedIcon
                  sx={{ fontSize: 18, color: "rgba(var(--ov),0.4)", flexShrink: 0 }}
                />
              </Box>
            )}

            {!convsLoading && conversations.length === 0 ? (
              <Typography
                sx={{
                  px: 2,
                  py: 3,
                  fontSize: 13,
                  color: "rgba(var(--ov),0.45)",
                  fontStyle: "italic",
                  textAlign: "center",
                }}
              >
                No conversations yet. Start one to see it here.
              </Typography>
            ) : (
              conversations.map(renderConversationRow)
            )}
          </>
        )}
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        height: "100dvh",
        boxSizing: "border-box",
        background: "var(--bg)",
        color: "var(--text)",
        display: "flex",
        p: { xs: 1, md: 2 },
        gap: { xs: 1, md: 2 },
      }}
    >
      {/* Sidebar — desktop */}
      <Paper
        sx={{
          width: 280,
          flexShrink: 0,
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          background: "var(--surface-2)",
          border: "1px solid rgba(var(--ov),0.06)",
          borderRadius: 3,
          boxShadow: "none",
          color: "var(--text)",
        }}
      >
        {sidebarContent}
      </Paper>

      {/* Sidebar — mobile drawer */}
      <Drawer
        anchor="left"
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: "block", md: "none" } }}
        PaperProps={{
          sx: {
            width: { xs: "85vw", sm: 320 },
            background: "var(--surface-2)",
            backgroundImage: "none",
            color: "var(--text)",
            boxSizing: "border-box",
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* Main chat */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 1, md: 1.5 },
            mb: 2,
            flexWrap: "wrap",
          }}
        >
          <Tooltip title="Conversations">
            <IconButton
              onClick={() => setMobileSidebarOpen(true)}
              size="small"
              sx={{
                color: "var(--text)",
                display: { xs: "inline-flex", md: "none" },
                border: "1px solid rgba(var(--ov),0.18)",
              }}
            >
              <MenuRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <AutoAwesomeRoundedIcon sx={{ color: "#a5b4fc" }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, fontSize: { xs: 16, md: 20 } }}
          >
            Chat
          </Typography>
          {conversationId && (
            <Chip
              size="small"
              label={`session ${conversationId.slice(0, 8)}`}
              sx={{
                ml: { xs: 0, md: 1 },
                color: "var(--text-2)",
                backgroundColor: "rgba(var(--ov),0.06)",
                display: { xs: "none", sm: "inline-flex" },
              }}
            />
          )}

          <Box sx={{ flex: 1 }} />

          <FormControlLabel
            control={
              <Switch
                checked={useNotesContext}
                onChange={(e) => setUseNotesContext(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography
                sx={{
                  fontSize: { xs: 12, md: 13 },
                  color: "rgba(var(--ov),0.75)",
                }}
              >
                <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                  Use my notes as context
                </Box>
                <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
                  Notes
                </Box>
              </Typography>
            }
            sx={{ mr: 0 }}
          />
        </Box>

        <Paper
          ref={scrollRef}
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            p: 2.5,
            borderRadius: 3,
            background: "var(--surface-2)",
            border: "1px solid rgba(var(--ov),0.06)",
            boxShadow: "none",
            color: "var(--text)",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(var(--ov),0.18) transparent",
            "&::-webkit-scrollbar": { width: "8px" },
            "&::-webkit-scrollbar-track": { background: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(var(--ov),0.18)",
              borderRadius: "999px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "rgba(var(--ov),0.3)",
            },
          }}
        >
          {historyLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
              <CircularProgress size={22} sx={{ color: "#a5b4fc" }} />
            </Box>
          )}

          {!historyLoading && messages.length === 0 && !sending && (
            <Typography
              sx={{
                color: "rgba(var(--ov),0.5)",
                fontStyle: "italic",
                textAlign: "center",
                mt: 6,
              }}
            >
              {useNotesContext
                ? "Ask anything — answers will cite your notes when relevant."
                : "Ask anything. Toggle “Use my notes as context” to ground answers in your notes."}
            </Typography>
          )}

          <Stack spacing={2}>
            {messages.map((m, idx) => (
              <MessageBubble key={idx} message={m} />
            ))}
            {sending &&
              messages.length > 0 &&
              messages[messages.length - 1].role === "assistant" &&
              !messages[messages.length - 1].content && (
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <CircularProgress size={16} sx={{ color: "#a5b4fc" }} />
                  <Typography
                    sx={{ color: "rgba(var(--ov),0.55)", fontStyle: "italic" }}
                  >
                    Thinking...
                  </Typography>
                </Stack>
              )}
          </Stack>
        </Paper>

        {error && (
          <Typography sx={{ color: "#ff8a80", mt: 1.5, fontSize: 14 }}>
            {error}
          </Typography>
        )}

        <Box
          sx={{
            mt: 2,
            borderRadius: 3,
            border: "1px solid rgba(var(--ov),0.12)",
            backgroundColor: "rgba(var(--ov),0.04)",
            px: { xs: 1.25, md: 1.75 },
            py: { xs: 1, md: 1.25 },
            transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            "&:focus-within": {
              borderColor: "rgba(99,102,241,0.6)",
              boxShadow: "0 0 0 3px rgba(99,102,241,0.15)",
            },
          }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={8}
            variant="standard"
            placeholder="Ask a question..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            InputProps={{ disableUnderline: true }}
            sx={{
              "& .MuiInputBase-root": {
                color: "var(--text)",
                fontSize: { xs: 14, md: 15 },
                px: 0.5,
                py: 0.5,
                alignItems: "flex-start",
              },
              "& .MuiInputBase-input::placeholder": {
                color: "rgba(var(--ov),0.45)",
                opacity: 1,
              },
            }}
          />

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mt: 0.5,
              px: 0.5,
            }}
          >
            <Box sx={{ flex: 1 }} />

            <Tooltip title="AI model used for this chat">
              <Chip
                icon={<AutoAwesomeRoundedIcon sx={{ fontSize: 16 }} />}
                label={prettyModel(model)}
                size="small"
                sx={{
                  maxWidth: { xs: 160, sm: "none" },
                  color: "rgba(var(--ov),0.8)",
                  backgroundColor: "rgba(var(--ov),0.06)",
                  border: "1px solid rgba(var(--ov),0.1)",
                  fontSize: 12,
                  "& .MuiChip-icon": { color: "#a5b4fc", ml: 0.5 },
                }}
              />
            </Tooltip>

            <IconButton
              onClick={handleSend}
              disabled={sending || !draft.trim()}
              aria-label="Send message"
              sx={{
                width: 40,
                height: 40,
                backgroundColor: "rgba(99,102,241,0.55)",
                color: "var(--text)",
                "&:hover": { backgroundColor: "rgba(99,102,241,0.8)" },
                "&.Mui-disabled": {
                  color: "rgba(var(--ov),0.3)",
                  backgroundColor: "rgba(var(--ov),0.04)",
                },
              }}
            >
              {sending ? (
                <CircularProgress size={18} sx={{ color: "var(--text)" }} />
              ) : (
                <SendRoundedIcon fontSize="small" />
              )}
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Per-conversation context menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseConvMenu}
        // Don't return focus to the ⋯ trigger on close: when a menu item opens a
        // dialog, the dialog would aria-hide the (re-focused) trigger and warn.
        disableRestoreFocus
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            background: "var(--surface)",
            color: "var(--text)",
            borderRadius: 2,
            minWidth: 184,
            border: "1px solid rgba(var(--ov),0.08)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            "& .MuiMenuItem-root": { fontSize: 14, py: 1 },
            "& .MuiListItemIcon-root": {
              color: "rgba(var(--ov),0.7)",
              minWidth: 32,
            },
            "& .MuiMenuItem-root:hover": {
              backgroundColor: "rgba(var(--ov),0.06)",
            },
          },
        }}
      >
        <MenuItem onClick={() => handleStartRename(menuConv)}>
          <ListItemIcon>
            <DriveFileRenameOutlineRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>

        {!menuConv?.archived && (
          <MenuItem onClick={() => handleTogglePin(menuConv)}>
            <ListItemIcon>
              {menuConv?.pinned ? (
                <PushPinRoundedIcon fontSize="small" />
              ) : (
                <PushPinOutlinedIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText>{menuConv?.pinned ? "Unpin" : "Pin chat"}</ListItemText>
          </MenuItem>
        )}

        {menuConv?.archived ? (
          <MenuItem onClick={() => handleUnarchive(menuConv)}>
            <ListItemIcon>
              <UnarchiveOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Unarchive</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleArchive(menuConv)}>
            <ListItemIcon>
              <ArchiveOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Archive</ListItemText>
          </MenuItem>
        )}

        <Divider sx={{ borderColor: "rgba(var(--ov),0.08)", my: 0.5 }} />

        <MenuItem
          onClick={() => handleStartDelete(menuConv)}
          sx={{
            color: "#ff6b6b",
            "& .MuiListItemIcon-root": { color: "#ff6b6b !important" },
          }}
        >
          <ListItemIcon>
            <DeleteOutlineRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Rename dialog */}
      <Dialog
        open={Boolean(renameTarget)}
        onClose={() => !actionBusy && setRenameTarget(null)}
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
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Rename conversation
          </Typography>
          <TextField
            fullWidth
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleConfirmRename();
              }
            }}
            placeholder="Conversation title"
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "var(--text)",
                backgroundColor: "rgba(var(--ov),0.04)",
                "& fieldset": { borderColor: "rgba(var(--ov),0.12)" },
                "&:hover fieldset": { borderColor: "rgba(var(--ov),0.25)" },
                "&.Mui-focused fieldset": {
                  borderColor: "rgba(99,102,241,0.6)",
                },
              },
            }}
          />
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 3 }}
          >
            <Button
              onClick={() => setRenameTarget(null)}
              disabled={actionBusy}
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
              onClick={handleConfirmRename}
              disabled={actionBusy || !renameValue.trim()}
              sx={{
                borderRadius: "999px",
                textTransform: "none",
                color: "var(--text)",
                backgroundColor: "rgba(99,102,241,0.55)",
                px: 2.5,
                "&:hover": { backgroundColor: "rgba(99,102,241,0.8)" },
                "&.Mui-disabled": {
                  color: "rgba(var(--ov),0.4)",
                  backgroundColor: "rgba(var(--ov),0.05)",
                },
              }}
            >
              {actionBusy ? "Saving..." : "Save"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !actionBusy && setDeleteTarget(null)}
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
            minWidth: { xs: "auto", sm: 440 },
            width: { xs: "calc(100vw - 64px)", sm: "auto" },
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          },
        }}
      >
        <DialogContent>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Delete conversation?
          </Typography>
          <Typography sx={{ color: "rgba(var(--ov),0.7)", mb: 3 }}>
            "{deleteTarget?.title || "Untitled chat"}" and all of its messages
            will be permanently deleted. This action cannot be undone.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
            <Button
              onClick={() => setDeleteTarget(null)}
              disabled={actionBusy}
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
              disabled={actionBusy}
              sx={{
                borderRadius: "999px",
                textTransform: "none",
                color: "var(--text)",
                backgroundColor: "rgba(239,68,68,0.85)",
                px: 2.5,
                "&:hover": { backgroundColor: "rgba(239,68,68,1)" },
                "&.Mui-disabled": {
                  color: "rgba(var(--ov),0.5)",
                  backgroundColor: "rgba(239,68,68,0.35)",
                },
              }}
            >
              {actionBusy ? "Deleting..." : "Delete"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

const MarkdownContent = ({ text }) => (
  <Box
    sx={{
      lineHeight: 1.6,
      fontSize: "0.95rem",
      wordBreak: "break-word",
      // Thin, transparent scrollbars for code blocks / tables that overflow
      "& *": {
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(var(--ov),0.18) transparent",
      },
      "& *::-webkit-scrollbar": { width: "8px", height: "8px" },
      "& *::-webkit-scrollbar-track": { background: "transparent" },
      "& *::-webkit-scrollbar-thumb": {
        background: "rgba(var(--ov),0.18)",
        borderRadius: "999px",
      },
      "& *::-webkit-scrollbar-thumb:hover": {
        background: "rgba(var(--ov),0.3)",
      },
      "& > *:first-of-type": { mt: 0 },
      "& > *:last-child": { mb: 0 },
      "& p": { my: 1 },
      "& h1, & h2, & h3, & h4": { fontWeight: 700, mt: 2, mb: 1, lineHeight: 1.3 },
      "& h1": { fontSize: "1.4rem" },
      "& h2": { fontSize: "1.25rem" },
      "& h3": { fontSize: "1.1rem" },
      "& h4": { fontSize: "1rem" },
      "& ul, & ol": { pl: 3, my: 1 },
      "& li": { mb: 0.5 },
      "& a": { color: "#a5b4fc", textDecoration: "underline" },
      "& strong": { fontWeight: 700 },
      "& hr": {
        border: "none",
        borderTop: "1px solid rgba(var(--ov),0.12)",
        my: 2,
      },
      "& blockquote": {
        borderLeft: "3px solid rgba(99,102,241,0.6)",
        m: 0,
        my: 1,
        pl: 2,
        color: "rgba(var(--ov),0.75)",
      },
      // Inline code only (block code is handled by SyntaxHighlighter below,
      // whose <code> carries a language-* class and is excluded here)
      "& code:not([class])": {
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        fontSize: "0.85em",
        backgroundColor: "rgba(var(--ov),0.1)",
        padding: "0.15em 0.4em",
        borderRadius: "4px",
      },
      // Tables — render in a horizontally scrollable block so wide tables
      // don't crush their columns on mobile.
      "& table": {
        borderCollapse: "collapse",
        width: "100%",
        my: 1.5,
        fontSize: "0.88rem",
        display: "block",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch", // momentum scroll on touch devices
      },
      "& th, & td": {
        border: "1px solid rgba(var(--ov),0.15)",
        px: 1.25,
        py: 0.75,
        textAlign: "left",
        verticalAlign: "top",
        // The parent Box uses wordBreak:"break-word", which shatters whole
        // words (e.g. "Requirement" -> "Req uire me nt") when a column gets
        // narrow on mobile. Override it for cells: wrap at spaces only, so
        // each column is at least as wide as its longest word and the table
        // scrolls horizontally instead of breaking words apart.
        wordBreak: "normal",
        overflowWrap: "break-word",
        minWidth: "5.5rem",
      },
      "& th": {
        backgroundColor: "rgba(var(--ov),0.06)",
        fontWeight: 700,
      },
    }}
  >
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Render fenced/multi-line code with syntax highlighting; keep
        // short inline code as a plain styled <code>.
        pre: ({ children }) => <>{children}</>,
        code: ({ inline, className, children, ...rest }) => {
          const match = /language-(\w+)/.exec(className || "");
          const raw = String(children).replace(/\n$/, "");
          const isBlock = !inline && (Boolean(match) || raw.includes("\n"));

          if (!isBlock) {
            return (
              <code className={className} {...rest}>
                {children}
              </code>
            );
          }

          return (
            <SyntaxHighlighter
              language={match ? match[1] : "text"}
              style={vscDarkPlus}
              PreTag="div"
              customStyle={{
                margin: "12px 0",
                borderRadius: "8px",
                border: "1px solid rgba(var(--ov),0.08)",
                fontSize: "0.85rem",
              }}
            >
              {raw}
            </SyntaxHighlighter>
          );
        },
      }}
    >
      {text}
    </ReactMarkdown>
  </Box>
);

const MessageBubble = ({ message }) => {
  const navigate = useNavigate();
  const isUser = message.role === "user";

  // Don't render the empty assistant placeholder — the "Thinking..." row
  // covers that moment until the first streamed token arrives.
  if (!isUser && !message.content && !(message.citations?.length)) {
    return null;
  }

  return (
    <Stack
      direction="row"
      justifyContent={isUser ? "flex-end" : "flex-start"}
    >
      <Box
        sx={{
          maxWidth: "75%",
          p: 1.5,
          borderRadius: 2.5,
          backgroundColor: isUser
            ? "rgba(99,102,241,0.25)"
            : "rgba(var(--ov),0.05)",
          border: "1px solid",
          borderColor: isUser
            ? "rgba(99,102,241,0.4)"
            : "rgba(var(--ov),0.08)",
        }}
      >
        {isUser ? (
          <Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
            {message.content}
          </Typography>
        ) : (
          <MarkdownContent text={message.content} />
        )}

        {!isUser &&
          Array.isArray(message.citations) &&
          message.citations.length > 0 && (
            <Stack
              direction="row"
              spacing={0.75}
              flexWrap="wrap"
              useFlexGap
              sx={{ mt: 1.5, gap: 0.75 }}
            >
              {message.citations.map((cite, i) => (
                <Chip
                  key={`${cite.noteId}-${i}`}
                  size="small"
                  label={`[${i + 1}] ${cite.title || "Untitled note"}`}
                  onClick={() =>
                    navigate(
                      `/dashboard/create-note?noteId=${encodeURIComponent(cite.noteId)}`,
                    )
                  }
                  sx={{
                    color: "var(--text)",
                    backgroundColor: "rgba(34,197,94,0.18)",
                    border: "1px solid rgba(34,197,94,0.35)",
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "rgba(34,197,94,0.3)" },
                  }}
                />
              ))}
            </Stack>
          )}
      </Box>
    </Stack>
  );
};

export default AiChatPage;
