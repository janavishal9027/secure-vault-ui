import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  IconButton,
  InputBase,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { useNavigate } from "react-router-dom";

import { semanticSearchService } from "../store/services/AiCoreService";

const AiSearchDialog = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef(null);
  const searchSeqRef = useRef(0);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setHits([]);
      setError("");
      setHasSearched(false);
      searchSeqRef.current += 1;
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (!trimmed) {
      setHits([]);
      setHasSearched(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      runSearch(trimmed);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const runSearch = async (q) => {
    const seq = ++searchSeqRef.current;
    setLoading(true);
    setError("");
    try {
      const response = await semanticSearchService(q, 8);
      if (seq !== searchSeqRef.current) return;
      setHits(response.data?.hits || []);
      setHasSearched(true);
    } catch (err) {
      if (seq !== searchSeqRef.current) return;
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "Search failed.";
      setError(message);
      setHits([]);
      setHasSearched(true);
    } finally {
      if (seq === searchSeqRef.current) setLoading(false);
    }
  };

  const handleOpenNote = (noteId) => {
    onClose?.();
    navigate(`/dashboard/create-note?noteId=${encodeURIComponent(noteId)}`);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          background: "#111827",
          color: "#fff",
          borderRadius: 3,
          border: "1px solid rgba(255,255,255,0.08)",
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 2,
            px: 1,
          }}
        >
          <AutoAwesomeRoundedIcon sx={{ color: "#a5b4fc" }} />
          <Typography sx={{ fontWeight: 600, flex: 1 }}>
            Semantic search
          </Typography>
          <IconButton size="small" onClick={onClose} sx={{ color: "#fff" }}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>

        <Paper
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            p: 1.25,
            borderRadius: 2,
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "none",
          }}
        >
          <SearchOutlinedIcon sx={{ color: "rgba(255,255,255,0.6)", ml: 1 }} />
          <InputBase
            autoFocus
            fullWidth
            placeholder="Search by meaning... e.g. 'how to set up Docker network'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ color: "#fff", fontSize: 16 }}
          />
          {loading && <CircularProgress size={18} sx={{ color: "#a5b4fc", mr: 1 }} />}
        </Paper>

        {error && (
          <Typography sx={{ color: "#ff8a80", mt: 1.5, fontSize: 14 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ mt: 2, maxHeight: "55vh", overflowY: "auto" }}>
          {hasSearched && !loading && hits.length === 0 && !error && (
            <Typography
              sx={{ color: "rgba(255,255,255,0.5)", fontStyle: "italic", py: 4, textAlign: "center" }}
            >
              No matches yet. Try a different query.
            </Typography>
          )}

          <Stack spacing={1.25}>
            {hits.map((hit) => (
              <Paper
                key={`${hit.noteId}-${hit.chunkText?.slice(0, 32)}`}
                onClick={() => handleOpenNote(hit.noteId)}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "none",
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.06)",
                    borderColor: "rgba(99,102,241,0.45)",
                  },
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
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
                      color: "#fff",
                      backgroundColor: "rgba(99,102,241,0.25)",
                    }}
                  />
                </Stack>
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255,255,255,0.7)",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {hit.chunkText}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </Box>
      </Box>
    </Dialog>
  );
};

export default AiSearchDialog;
