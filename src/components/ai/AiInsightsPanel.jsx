import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";

import {
  aiRecommendationsService,
  aiTagsService,
} from "../store/services/AiCoreService";
import { updateNote } from "../store/actions/notesAction";

const TAG_MIN_CONTENT_CHARS = 30;

const AiInsightsPanel = ({ note }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const noteId = note?.noteId || note?.id;
  const title = note?.title || "";
  const content = note?.content || "";
  const noteTags = (note?.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState("");
  const [suggestedTags, setSuggestedTags] = useState([]);

  useEffect(() => {
    setSuggestedTags(noteTags);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, note?.tags]);

  const selectedTagSet = new Set(noteTags);

  const persistTags = (tags) =>
    dispatch(
      updateNote(noteId, {
        title,
        content,
        tags: tags.join(","),
      }),
    );

  const handleToggleTag = (tag) => {
    if (!noteId) return;
    const nextSelected = selectedTagSet.has(tag)
      ? noteTags.filter((t) => t !== tag)
      : [...noteTags, tag];
    persistTags(nextSelected);
  };

  const handleRemoveTag = (tag) => {
    if (!noteId) return;
    setSuggestedTags((prev) => prev.filter((t) => t !== tag));
    if (selectedTagSet.has(tag)) {
      persistTags(noteTags.filter((t) => t !== tag));
    }
  };

  const [related, setRelated] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState("");

  useEffect(() => {
    if (!noteId) return;
    let cancelled = false;
    setRelatedLoading(true);
    setRelatedError("");
    aiRecommendationsService(noteId, 5)
      .then((response) => {
        if (cancelled) return;
        setRelated(response.data?.related || []);
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err?.response?.data?.message ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to load related notes.";
        setRelatedError(message);
      })
      .finally(() => {
        if (!cancelled) setRelatedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [noteId]);

  const handleGenerateTags = async () => {
    if (!noteId) return;
    setTagsLoading(true);
    setTagsError("");
    try {
      const response = await aiTagsService({ noteId, title, content });
      const tags = response.data?.tags || [];
      if (tags.length > 0) {
        const merged = Array.from(new Set([...noteTags, ...tags]));
        setSuggestedTags(merged);
        await persistTags(merged);
      }
    } catch (err) {
      setTagsError(
        err?.response?.data?.message ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to generate tags.",
      );
    } finally {
      setTagsLoading(false);
    }
  };

  if (!noteId) return null;

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 4 }}>
      <Divider sx={{ borderColor: "rgba(var(--ov),0.08)", mb: 2 }} />

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
        <LocalOfferRoundedIcon sx={{ color: "#a5b4fc" }} />
        <Typography sx={{ fontWeight: 600, fontSize: 18 }}>
          AI Tags
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <Button
          size="small"
          onClick={handleGenerateTags}
          startIcon={
            tagsLoading ? (
              <CircularProgress size={14} sx={{ color: "#fff !important" }} />
            ) : (
              <AutoAwesomeRoundedIcon />
            )
          }
          disabled={tagsLoading || (content || "").trim().length < TAG_MIN_CONTENT_CHARS}
          sx={{
            borderRadius: "999px",
            textTransform: "none",
            color: "var(--text)",
            backgroundColor: "rgba(99,102,241,0.35)",
            px: 2,
            "&:hover": { backgroundColor: "rgba(99,102,241,0.55)" },
            "&.Mui-disabled": {
              color: "rgba(var(--ov),0.4)",
              backgroundColor: "rgba(var(--ov),0.05)",
            },
          }}
        >
          {suggestedTags.length > 0 ? "Regenerate tags" : "Generate tags"}
        </Button>
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
        {suggestedTags.length > 0 ? (
          <>
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ gap: 0.75 }}>
              {suggestedTags.map((tag) => {
                const selected = selectedTagSet.has(tag);
                return (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    onClick={() => handleToggleTag(tag)}
                    onDelete={() => handleRemoveTag(tag)}
                    sx={{
                      cursor: "pointer",
                      color: "var(--text)",
                      backgroundColor: selected
                        ? "rgba(99,102,241,0.32)"
                        : "rgba(var(--ov),0.04)",
                      border: selected
                        ? "1px solid rgba(99,102,241,0.55)"
                        : "1px solid rgba(var(--ov),0.12)",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        backgroundColor: selected
                          ? "rgba(99,102,241,0.45)"
                          : "rgba(var(--ov),0.08)",
                      },
                      "& .MuiChip-deleteIcon": {
                        color: "rgba(var(--ov),0.55)",
                        "&:hover": { color: "#ff8a80" },
                      },
                    }}
                  />
                );
              })}
            </Stack>
            <Typography
              sx={{
                mt: 1.5,
                fontSize: "0.75rem",
                color: "rgba(var(--ov),0.45)",
              }}
            >
              Click a tag to toggle whether it's saved on the note. Click × to discard the suggestion.
            </Typography>
          </>
        ) : (
          <Typography
            sx={{
              fontSize: "0.9rem",
              color: "rgba(var(--ov),0.5)",
              fontStyle: "italic",
            }}
          >
            {(content || "").trim().length < TAG_MIN_CONTENT_CHARS
              ? `Note must be at least ${TAG_MIN_CONTENT_CHARS} characters to generate tags.`
              : "No tags yet. Click \"Generate tags\" to create some."}
          </Typography>
        )}
        {tagsError && (
          <Typography
            sx={{
              mt: 1.5,
              fontSize: "0.85rem",
              color: "rgba(255,138,128,0.95)",
            }}
          >
            {tagsError}
          </Typography>
        )}
      </Paper>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 4, mb: 1.5 }}>
        <LightbulbRoundedIcon sx={{ color: "#a5b4fc" }} />
        <Typography sx={{ fontWeight: 600, fontSize: 18 }}>
          Related notes
        </Typography>
        {relatedLoading && (
          <CircularProgress size={14} sx={{ color: "#a5b4fc", ml: 1 }} />
        )}
      </Box>

      <Paper
        sx={{
          p: 2,
          borderRadius: 2,
          background: "rgba(var(--ov),0.03)",
          border: "1px solid rgba(var(--ov),0.08)",
          color: "rgba(var(--ov),0.85)",
          boxShadow: "none",
        }}
      >
        {relatedError ? (
          <Typography
            sx={{ fontSize: "0.85rem", color: "rgba(255,138,128,0.95)" }}
          >
            {relatedError}
          </Typography>
        ) : !relatedLoading && related.length === 0 ? (
          <Typography
            sx={{
              fontSize: "0.9rem",
              color: "rgba(var(--ov),0.5)",
              fontStyle: "italic",
            }}
          >
            No related notes yet. Save more notes to build connections.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {related.map((hit) => (
              <Paper
                key={`${hit.noteId}-${hit.chunkText?.slice(0, 24)}`}
                onClick={() =>
                  navigate(
                    `/dashboard/create-note?noteId=${encodeURIComponent(hit.noteId)}`,
                  )
                }
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  cursor: "pointer",
                  background: "rgba(var(--ov),0.02)",
                  border: "1px solid rgba(var(--ov),0.06)",
                  boxShadow: "none",
                  "&:hover": {
                    background: "rgba(var(--ov),0.06)",
                    borderColor: "rgba(99,102,241,0.45)",
                  },
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                  sx={{ mb: 0.5 }}
                >
                  <Typography sx={{ fontWeight: 600 }} noWrap>
                    {hit.title || "Untitled note"}
                  </Typography>
                  <Chip
                    size="small"
                    label={`${Math.round((hit.score || 0) * 100)}%`}
                    sx={{
                      color: "var(--text)",
                      backgroundColor: "rgba(99,102,241,0.25)",
                    }}
                  />
                </Stack>
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(var(--ov),0.65)",
                    fontSize: "0.85rem",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {hit.chunkText}
                </Typography>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
};

export default AiInsightsPanel;
