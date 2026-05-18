import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Drawer,
  FormControlLabel,
  IconButton,
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
import { useNavigate } from "react-router-dom";

import {
  aiChatConversationsService,
  aiChatHistoryService,
  aiChatService,
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

const AiChatPage = () => {
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [conversations, setConversations] = useState([]);
  const [convsLoading, setConvsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [useNotesContext, setUseNotesContext] = useState(false);

  const scrollRef = useRef(null);

  const loadConversations = useCallback(async () => {
    setConvsLoading(true);
    try {
      const response = await aiChatConversationsService();
      setConversations(response.data?.conversations || []);
    } catch (err) {
      // silent — sidebar just stays empty
    } finally {
      setConvsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

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

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;

    setError("");
    setDraft("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setSending(true);

    try {
      const response = await aiChatService({
        message: text,
        conversationId,
        useNotesContext,
      });
      const data = response.data || {};
      const reply = data.reply || "(no reply)";
      const citations = data.citations || [];
      const nextConversationId = data.conversationId || conversationId;
      const isNew = !conversationId && nextConversationId;
      if (nextConversationId) setConversationId(nextConversationId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, citations },
      ]);
      if (isNew || !conversations.find((c) => c.conversationId === nextConversationId)) {
        loadConversations();
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "Chat request failed.";
      setError(message);
      setMessages((prev) => prev.slice(0, -1));
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

  const sidebarContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <Tooltip title="Back to dashboard">
          <IconButton
            onClick={() => navigate("/dashboard")}
            sx={{ color: "#fff" }}
            size="small"
          >
            <ArrowBackRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography sx={{ fontWeight: 600, fontSize: 14, flex: 1 }}>
          Conversations
        </Typography>
      </Box>

      <Box sx={{ px: 2, pb: 1 }}>
        <Button
          fullWidth
          startIcon={<AddRoundedIcon />}
          onClick={handleNewChat}
          sx={{
            borderRadius: "999px",
            textTransform: "none",
            color: "#fff",
            backgroundColor: "rgba(99,102,241,0.35)",
            "&:hover": { backgroundColor: "rgba(99,102,241,0.55)" },
          }}
        >
          New chat
        </Button>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          px: 1,
          pb: 1,
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(255,255,255,0.12)",
            borderRadius: 6,
          },
        }}
      >
        {convsLoading && conversations.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={18} sx={{ color: "#a5b4fc" }} />
          </Box>
        )}

        {!convsLoading && conversations.length === 0 && (
          <Typography
            sx={{
              px: 2,
              py: 3,
              fontSize: 13,
              color: "rgba(255,255,255,0.45)",
              fontStyle: "italic",
              textAlign: "center",
            }}
          >
            No conversations yet. Start one to see it here.
          </Typography>
        )}

        {conversations.map((c) => {
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
                backgroundColor: active
                  ? "rgba(99,102,241,0.22)"
                  : "transparent",
                border: "1px solid",
                borderColor: active
                  ? "rgba(99,102,241,0.45)"
                  : "transparent",
                "&:hover": {
                  backgroundColor: active
                    ? "rgba(99,102,241,0.28)"
                    : "rgba(255,255,255,0.04)",
                },
              }}
            >
              <ChatBubbleOutlineRoundedIcon
                sx={{
                  fontSize: 16,
                  color: active ? "#a5b4fc" : "rgba(255,255,255,0.5)",
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
                <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                  {formatConvDate(c.updatedAt)}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        height: "100dvh",
        boxSizing: "border-box",
        background: "#0b1020",
        color: "#fff",
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
          background: "#111827",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 3,
          boxShadow: "none",
          color: "#fff",
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
            background: "#111827",
            backgroundImage: "none",
            color: "#fff",
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
                color: "#fff",
                display: { xs: "inline-flex", md: "none" },
                border: "1px solid rgba(255,255,255,0.18)",
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
                color: "#cfd5e3",
                backgroundColor: "rgba(255,255,255,0.06)",
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
                  color: "rgba(255,255,255,0.75)",
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
            background: "#111827",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "none",
            color: "#fff",
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
                color: "rgba(255,255,255,0.5)",
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
            {sending && (
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <CircularProgress size={16} sx={{ color: "#a5b4fc" }} />
                <Typography
                  sx={{ color: "rgba(255,255,255,0.55)", fontStyle: "italic" }}
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

        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          <TextField
            fullWidth
            multiline
            maxRows={5}
            placeholder="Ask a question..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "#fff",
                backgroundColor: "rgba(255,255,255,0.04)",
                "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.25)" },
                "&.Mui-focused fieldset": {
                  borderColor: "rgba(99,102,241,0.6)",
                },
              },
            }}
          />
          <IconButton
            onClick={handleSend}
            disabled={sending || !draft.trim()}
            sx={{
              width: 56,
              backgroundColor: "rgba(99,102,241,0.45)",
              color: "#fff",
              "&:hover": { backgroundColor: "rgba(99,102,241,0.7)" },
              "&.Mui-disabled": {
                color: "rgba(255,255,255,0.3)",
                backgroundColor: "rgba(255,255,255,0.04)",
              },
            }}
          >
            <SendRoundedIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

const MessageBubble = ({ message }) => {
  const navigate = useNavigate();
  const isUser = message.role === "user";

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
            : "rgba(255,255,255,0.05)",
          border: "1px solid",
          borderColor: isUser
            ? "rgba(99,102,241,0.4)"
            : "rgba(255,255,255,0.08)",
        }}
      >
        <Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
          {message.content}
        </Typography>

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
                    color: "#fff",
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
