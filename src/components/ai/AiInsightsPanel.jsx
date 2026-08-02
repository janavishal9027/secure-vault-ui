import React, { useEffect, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import { aiRecommendationsService } from "../store/services/AiCoreService";
import { describeAiError } from "../utils/aiErrors";
import NoteEntities from "./NoteEntities";

const AiInsightsPanel = ({ note }) => {
  const navigate = useNavigate();
  const { notes = [] } = useSelector((state) => state.notesState);

  // Set of existing noteIds to filter out deleted notes from recommendations
  const existingNoteIds = new Set(
    notes.map((n) => n.noteId || n.id).filter(Boolean),
  );

  const noteId = note?.noteId || note?.id;
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
        const data = response.data;
        // Support both array response and object with related/recommendations key
        const raw = Array.isArray(data)
          ? data
          : data?.related || data?.recommendations || [];

        // Helper to extract note identifier from a hit (backend may use different field names)
        const getNoteId = (hit) => hit.noteId || hit.note_id || hit.id;

        // Minimum relevance score to consider a note as truly related
        const RELEVANCE_THRESHOLD = 0.75;

        // Exclude the current note and deduplicate by title (keep highest score)
        // Notes with the same title are treated as duplicates (stale embeddings)
        const uniqueMap = new Map();
        raw
          .filter((hit) => {
            const hitId = getNoteId(hit);
            // Exclude current note, notes that no longer exist, and low-relevance matches
            return (
              hitId !== noteId &&
              existingNoteIds.has(hitId) &&
              (hit.score || 0) >= RELEVANCE_THRESHOLD
            );
          })
          .forEach((hit) => {
            const key = hit.title || getNoteId(hit);
            const existing = uniqueMap.get(key);
            if (!existing || (hit.score || 0) > (existing.score || 0)) {
              uniqueMap.set(key, hit);
            }
          });
        setRelated(Array.from(uniqueMap.values()));
      })
      .catch((err) => {
        if (cancelled) return;
        // Recommendations are embedding-backed and run on the server's key, so
        // this never reports a missing user key — just surface the message.
        setRelatedError(
          describeAiError(err, "Failed to load related notes.").message,
        );
      })
      .finally(() => {
        if (!cancelled) setRelatedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [noteId]);

  // Remove related notes that have been deleted from the store
  useEffect(() => {
    setRelated((prev) =>
      prev.filter((hit) => {
        const hitId = hit.noteId || hit.note_id || hit.id;
        return existingNoteIds.has(hitId);
      }),
    );
  }, [notes]);

  if (!noteId) return null;

  return (
    <Box sx={{ width: "100%", mt: 4 }}>
      <Divider sx={{ borderColor: "rgba(var(--ov),0.08)", mb: 2 }} />

      {/* The knowledge graph's view of this note, shown where it can actually
          be checked — you have the note in front of you. */}
      <NoteEntities noteId={noteId} />

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 4, mb: 1.5 }}>
        <LightbulbRoundedIcon sx={{ color: "var(--accent-soft)" }} />
        <Typography sx={{ fontWeight: 600, fontSize: 18 }}>
          Related notes
        </Typography>
        {relatedLoading && (
          <CircularProgress size={14} sx={{ color: "var(--accent-soft)", ml: 1 }} />
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
              color: "var(--text-muted)",
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
                  {(() => {
                    const raw = hit.chunkText || "";
                    const doc = new DOMParser().parseFromString(raw, "text/html");
                    return doc.body.textContent || "";
                  })()}
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
