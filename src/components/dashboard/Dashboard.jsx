import React, { useEffect, useMemo, useState } from "react";
import { Box, Container, Typography } from "@mui/material";
import TopBar from "../dashboard/TopBar";
import ToolbarSection from "../dashboard/ToolbarSection";
import NotebookCard from "./NotebookCard";
import { getAllNotesService } from "../store/services/NoteService";

const SORT_OPTIONS = {
  recent: "Most recent",
  oldest: "Oldest first",
  title: "Title A–Z",
};

const noteTimestamp = (note) => {
  const value = note?.updatedAt || note?.createdAt;
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(time) ? 0 : time;
};

export default function Dashboard() {

  const [viewMode, setViewMode] = useState("grid");
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState("recent");

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await getAllNotesService();
      setNotes(response.data?.data || response.data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const visibleNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = query
      ? notes.filter((note) => {
          const title = (note.title || "").toLowerCase();
          const content = (note.content || "").toLowerCase();
          const summary = (note.summary || "").toLowerCase();
          return (
            title.includes(query) ||
            content.includes(query) ||
            summary.includes(query)
          );
        })
      : notes;

    const sorted = [...filtered];
    if (sortMode === "recent") {
      sorted.sort((a, b) => noteTimestamp(b) - noteTimestamp(a));
    } else if (sortMode === "oldest") {
      sorted.sort((a, b) => noteTimestamp(a) - noteTimestamp(b));
    } else if (sortMode === "title") {
      sorted.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "", undefined, {
          sensitivity: "base",
        }),
      );
    }
    return sorted;
  }, [notes, searchQuery, sortMode]);

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        height: { xs: "auto", md: "100dvh" },
        overflow: { xs: "auto", md: "hidden" },
        boxSizing: "border-box",
        background:
          "radial-gradient(circle at top left, rgba(91, 100, 255, 0.12), transparent 22%), var(--bg)",
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          height: { xs: "auto", md: "100%" },
          minHeight: { xs: "100dvh", md: "auto" },
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          pt: { xs: 2, md: 4 },
          pb: { xs: 2, md: 4 },
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <TopBar />

        <Typography
          sx={{
            color: "var(--text)",
            fontSize: { xs: 28, sm: 38, md: 56, lg: 64 },
            fontWeight: 500,
            letterSpacing: { xs: -0.5, md: -1.5 },
            lineHeight: 1.1,
            mb: { xs: 2.5, md: 4 },
          }}
        >
          Welcome to Secure VAULT
        </Typography>

        <ToolbarSection
          viewMode={viewMode}
          setViewMode={setViewMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortMode={sortMode}
          setSortMode={setSortMode}
          sortOptions={SORT_OPTIONS}
        />

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography
            sx={{
              color: "var(--text)",
              fontSize: { xs: 22, sm: 26, md: 30 },
              fontWeight: 500,
              mb: { xs: 1.5, md: 2.5 },
            }}
          >
            Recent notebooks
          </Typography>
          <NotebookCard
            viewMode={viewMode}
            notes={visibleNotes}
            loading={loading}
          />
        </Box>
      </Container>
    </Box>
  );
}